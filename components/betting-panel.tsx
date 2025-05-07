"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ArrowDown, ArrowUp } from "lucide-react"
import { useBettingStore } from "@/lib/betting-store"
import { BullIcon, BearIcon } from "./chart-icons"
import { useToast } from "@/components/ui/use-toast"

// Create a custom event for chart communication
const CHART_EVENT = "update-tradingview-markers";

export default function BettingPanel() {
  const [betAmount, setBetAmount] = useState(1000)
  const [leverage, setLeverage] = useState(1)
  const [isBettingOpen, setIsBettingOpen] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const { placeBet, balance, bets } = useBettingStore()
  const [livePnL, setLivePnL] = useState(0)
  const [pnlChange, setPnlChange] = useState(0)
  const [isUpBetting, setIsUpBetting] = useState(false)
  const [isDownBetting, setIsDownBetting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Simulate candle timing for demo purposes
    const interval = setInterval(() => {
      const now = new Date()
      const secondsInCurrentMinute = now.getSeconds()

      // Abrir ventana de apuestas SOLO en los primeros 10 segundos de cada minuto
      setIsBettingOpen(secondsInCurrentMinute < 10)
      
      // Actualizar contador de tiempo
      if (secondsInCurrentMinute < 10) {
        // Tiempo restante para apostar
        setCountdown(10 - secondsInCurrentMinute)
      } else {
        // Tiempo hasta la próxima ventana de apuestas
        setCountdown(60 - secondsInCurrentMinute + 10)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Calculate PnL from completed bets
    const calculatePnL = () => {
      const completedBets = bets.filter((bet) => bet.status !== "pending")

      const totalWon = completedBets
        .filter((bet) => bet.status === "won")
        .reduce((sum, bet) => sum + bet.potentialProfit, 0)

      const totalLost = completedBets.filter((bet) => bet.status === "lost").reduce((sum, bet) => sum + bet.amount, 0)

      const newPnL = totalWon - totalLost

      // Calculate change from previous PnL
      const change = newPnL - livePnL
      setPnlChange(change)
      setLivePnL(newPnL)
    }

    calculatePnL()

    // Update PnL every second to show real-time changes
    const interval = setInterval(calculatePnL, 1000)

    return () => clearInterval(interval)
  }, [bets, livePnL])

  const handleBet = (direction: "up" | "down") => {
    if (!isBettingOpen) return

    // Check if there's already a bet for the current candle
    const currentCandleTime = Math.floor(Date.now() / 60000) * 60000
    const existingBetForCandle = bets.some((bet) => bet.candleTime === currentCandleTime)

    if (existingBetForCandle) {
      // Mostrar mensaje de error
      toast({
        variant: "destructive",
        title: "Error en la apuesta",
        description: "¡Solo puedes hacer una apuesta por vela!",
      })
      return
    }

    // Set animation flags
    if (direction === "up") {
      setIsUpBetting(true)
      setTimeout(() => setIsUpBetting(false), 500)
    } else {
      setIsDownBetting(true)
      setTimeout(() => setIsDownBetting(false), 500)
    }

    // Crear un ID único con timestamp y random para evitar colisiones
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Place the bet
    placeBet({
      id: uniqueId,
      amount: betAmount,
      leverage: leverage,
      direction: direction,
      timestamp: new Date().toISOString(),
      symbol: "BTC/USDT",
      status: "pending",
      potentialProfit: betAmount * leverage * 0.95, // 95% payout for simplicity
      candleTime: currentCandleTime,
    })

    // Show success toast
    toast({
      title: `¡Apuesta de ${betAmount.toLocaleString()} colocada!`,
      description: `Has apostado ${direction === "up" ? "TORO" : "OSO"} con apalancamiento de ${leverage}x`,
      variant: direction === "up" ? "default" : "destructive",
    })

    // Trigger an event to update chart markers immediately
    window.dispatchEvent(new CustomEvent(CHART_EVENT));
    
    // También disparar el evento después de un breve retraso 
    // para asegurar que todo se haya sincronizado
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent(CHART_EVENT));
      
      // Forzar actualización del DOM para asegurar que la pestaña Bets muestre las apuestas
      document.dispatchEvent(new Event('visibilitychange'));
    }, 500);
  }

  return (
    <Card className="h-full border-blue-900 bg-gray-900">
      <CardContent className="p-0 h-full flex flex-col">
        <div className="border-b border-blue-900 bg-gray-800 bg-opacity-50 p-1">
          <h3 className="text-base font-bold text-white">Hacer Apuesta</h3>
        </div>

        <div className="p-1 flex-grow flex flex-col justify-between overflow-y-auto">
          <div className="space-y-1">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-400">Cantidad</label>
                <div className="w-16 rounded bg-gray-800 px-1 py-0.5 text-center font-mono text-xs">
                  {betAmount.toLocaleString()}
                </div>
              </div>
              <Slider
                value={[betAmount]}
                min={100}
                max={100000}
                step={100}
                onValueChange={(value) => setBetAmount(value[0])}
                className="my-1"
              />
              <div className="flex justify-between text-xs">
                <button className="rounded bg-gray-800 px-1 py-0.5" onClick={() => setBetAmount(1000)}>
                  1K
                </button>
                <button className="rounded bg-gray-800 px-1 py-0.5" onClick={() => setBetAmount(10000)}>
                  10K
                </button>
                <button className="rounded bg-gray-800 px-1 py-0.5" onClick={() => setBetAmount(100000)}>
                  100K
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-400">Apalancamiento</label>
                <div className="w-10 rounded bg-gray-800 px-1 py-0.5 text-center font-mono text-xs">{leverage}x</div>
              </div>
              <Slider
                value={[leverage]}
                min={1}
                max={100}
                step={1}
                onValueChange={(value) => setLeverage(value[0])}
                className="my-1"
              />
              <div className="flex justify-between text-xs">
                <button className="rounded bg-gray-800 px-1 py-0.5" onClick={() => setLeverage(1)}>
                  1x
                </button>
                <button className="rounded bg-gray-800 px-1 py-0.5" onClick={() => setLeverage(10)}>
                  10x
                </button>
                <button className="rounded bg-gray-800 px-1 py-0.5" onClick={() => setLeverage(100)}>
                  100x
                </button>
              </div>
            </div>

            <div className="rounded bg-blue-900 bg-opacity-30 p-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Beneficio:</span>
                <span className="font-bold text-yellow-400">{(betAmount * leverage * 0.95).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="mt-1">
            <div className="grid grid-cols-2 gap-1">
              <Button
                className={`bg-gradient-to-b from-green-600 to-green-800 text-xs font-bold hover:from-green-500 hover:to-green-700 disabled:from-gray-700 disabled:to-gray-800 shadow-lg border border-green-500 h-7 py-0 flex items-center justify-center ${
                  isUpBetting ? "scale-95 shadow-inner" : ""
                } transition-all duration-200`}
                onClick={() => handleBet("up")}
                disabled={!isBettingOpen || betAmount > balance}
              >
                <div className="flex items-center">
                  <BullIcon size={14} color="#ffffff" />
                  <span className="ml-1">TORO</span>
                </div>
              </Button>
              
              <Button
                className={`bg-gradient-to-b from-red-600 to-red-800 text-xs font-bold hover:from-red-500 hover:to-red-700 disabled:from-gray-700 disabled:to-gray-800 shadow-lg border border-red-500 h-7 py-0 flex items-center justify-center ${
                  isDownBetting ? "scale-95 shadow-inner" : ""
                } transition-all duration-200`}
                onClick={() => handleBet("down")}
                disabled={!isBettingOpen || betAmount > balance}
              >
                <div className="flex items-center">
                  <BearIcon size={14} color="#ffffff" />
                  <span className="ml-1">OSO</span>
                </div>
              </Button>
            </div>

            <div className="mt-1 text-center">
              {isBettingOpen ? (
                <span className="rounded-full bg-green-900 bg-opacity-30 px-1 py-0.5 text-xs font-medium text-green-400 shadow-inner flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1 animate-pulse"></div>
                  Abierto: {countdown}s
                </span>
              ) : (
                <span className="rounded-full bg-blue-900 bg-opacity-30 px-1 py-0.5 text-xs font-medium text-blue-400 shadow-inner">
                  Próximo: {countdown}s
                </span>
              )}
            </div>

            {/* PnL display */}
            <div className="mt-1 w-full rounded-lg bg-blue-900 bg-opacity-20 px-1 py-0.5 border border-blue-800 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-300">Ganancia:</span>
                <span className={`font-bold ${livePnL >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {livePnL >= 0 ? "+" : ""}
                  {livePnL.toLocaleString()}
                  {pnlChange !== 0 && (
                    <span className="ml-1 text-xs">
                      {pnlChange > 0 ? <ArrowUp className="inline h-2 w-2" /> : <ArrowDown className="inline h-2 w-2" />}
                      {Math.abs(pnlChange).toLocaleString()}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

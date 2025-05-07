"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TradingChart from "@/components/trading-chart"
import BettingPanel from "@/components/betting-panel"
import LiquidationsPanel from "@/components/liquidations-panel"
import BetHistory from "@/components/bet-history"
import UserStats from "@/components/user-stats"
import SpotTrades from "@/components/spot-trades"
import Profile from "@/components/profile"
import WinRateDisplay from "@/components/win-rate-display"
import MiniChart from "@/components/mini-chart"
import { useBettingStore } from "@/lib/betting-store"
import { useEffect, useState } from "react"
import { ArrowDown, ArrowUp, RefreshCcw } from "lucide-react"

export default function Home() {
  const { balance } = useBettingStore()
  const [btcPrice, setBtcPrice] = useState<number | null>(null)
  const [priceChange, setPriceChange] = useState<number>(0)
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0)
  const [isRealData, setIsRealData] = useState<boolean>(true)
  const [lastUpdate, setLastUpdate] = useState<string>("")

  // Obtener precio de Bitcoin para el header
  useEffect(() => {
    const fetchBitcoinPrice = async () => {
      try {
        const response = await fetch("/api/current-price")
        const data = await response.json()

        if (data.error) {
          console.error("Error en datos de precio:", data.error)
          setIsRealData(false)
          return
        }

        if (data.price) {
          setBtcPrice(data.price)
          setPriceChange(data.change)
          setPriceChangePercent(data.changePercent)
          setLastUpdate(new Date().toLocaleTimeString())
          setIsRealData(data.isReal !== undefined ? data.isReal : true)
        }
      } catch (error) {
        console.error("Error obteniendo precio de Bitcoin:", error)
        setIsRealData(false)
      }
    }

    fetchBitcoinPrice()
    const interval = setInterval(fetchBitcoinPrice, 10000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <main className="min-h-screen bg-black text-white overflow-y-auto">
      {/* Panel superior de precio fijo */}
      <div className={`w-full py-1.5 px-4 ${isRealData ? 'bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950' : 'bg-gradient-to-r from-red-950 via-red-900 to-red-950'} shadow-md border-b border-blue-800 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <span className="font-bold text-yellow-400 text-lg mr-1">₿</span>
            <span className="text-xs text-blue-300 uppercase mr-2">BTC/USDT</span>
            {isRealData ? (
              <span className="text-xs px-1 bg-blue-800/70 text-blue-300 rounded">LIVE</span>
            ) : (
              <span className="text-xs px-1 bg-red-800/70 text-red-300 rounded">CACHÉ</span>
            )}
          </div>
          
          <div className="hidden md:block text-xs text-gray-400">
            Actualizado: {lastUpdate}
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center">
            {btcPrice ? (
              <span className="font-bold text-xl text-yellow-400">${btcPrice.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
            ) : (
              <div className="animate-pulse">
                <RefreshCcw className="h-4 w-4 text-blue-400 animate-spin" />
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end">
            <div className={`flex items-center ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {priceChange >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
              <span className="text-sm font-medium">${Math.abs(priceChange).toFixed(2)}</span>
            </div>
            <span className={`text-xs ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceChangePercent > 0 ? "+" : ""}{priceChangePercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
      
      {/* Header con mismo ancho que panel superior */}
      <header className="w-full px-4 py-2 mb-1 flex items-center justify-between bg-gradient-to-r from-black via-blue-950 to-black shadow-md border-b border-blue-900">
        <div className="flex items-center">
          <div className="mr-2 text-blue-500">🔥</div>
          <h1 className="text-xl font-bold text-blue-500 md:text-2xl">
            Candle <span className="text-blue-300">Rush</span> <span className="text-blue-600">3</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg bg-blue-900/70 px-3 py-1 shadow-md border border-blue-800">
            <span className="text-xs text-blue-300 mr-1">BALANCE</span>
            <span className="font-bold text-yellow-400">{balance.toLocaleString()}</span>
          </div>
          <button className="rounded-lg bg-blue-700 px-3 py-1 font-medium text-white hover:bg-blue-600 shadow-md text-sm transition-colors">
            Perfil
          </button>
        </div>
      </header>

      {/* Main content area con ancho completo */}
      <div className="w-full px-4 grid grid-cols-1 gap-1 lg:grid-cols-4">
        {/* Main trading chart - takes up most of the space */}
        <div className="lg:col-span-3 h-[calc(100vh-200px)]">
          <TradingChart />
        </div>

        {/* Right control console with stacked panels */}
        <div className="lg:col-span-1 flex flex-col gap-1 h-[calc(100vh-200px)]">
          {/* Betting panel */}
          <div className="h-[33%]">
            <BettingPanel />
          </div>
          
          {/* Win rate display */}
          <div className="h-[33%]">
            <WinRateDisplay />
          </div>
          
          {/* Mini chart */}
          <div className="h-[34%]">
            <MiniChart />
          </div>
        </div>
      </div>
      
      {/* Bottom panel with tabs con ancho completo */}
      <div className="w-full px-4 mt-1">
        <Tabs defaultValue="bets" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800">
            <TabsTrigger value="liquidations" className="data-[state=active]:bg-blue-900 text-xs">
              Liquidaciones
            </TabsTrigger>
            <TabsTrigger value="bets" className="data-[state=active]:bg-blue-900 text-xs">
              Apuestas
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-blue-900 text-xs">
              Estadísticas
            </TabsTrigger>
            <TabsTrigger value="spot" className="data-[state=active]:bg-blue-900 text-xs">
              Mercado
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-blue-900 text-xs">
              Perfil
            </TabsTrigger>
          </TabsList>
          <TabsContent value="liquidations" className="h-[300px] overflow-hidden">
            <LiquidationsPanel />
          </TabsContent>
          <TabsContent value="bets" className="h-[300px] overflow-hidden">
            <BetHistory />
          </TabsContent>
          <TabsContent value="stats" className="h-[300px] overflow-hidden">
            <UserStats />
          </TabsContent>
          <TabsContent value="spot" className="h-[300px] overflow-hidden">
            <SpotTrades />
          </TabsContent>
          <TabsContent value="profile" className="h-[300px] overflow-hidden">
            <Profile />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useBettingStore, Bet } from "@/lib/betting-store"
import { Confetti } from "@/components/confetti"

interface BetResultModalProps {
  bet: Bet
  onClose: () => void
}

export default function BetResultModal({ bet, onClose }: BetResultModalProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  
  useEffect(() => {
    // Activar confetti si la apuesta fue ganada
    if (bet.status === "won") {
      setShowConfetti(true)
      
      // Detener el confetti después de 5 segundos
      const timer = setTimeout(() => {
        setShowConfetti(false)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [bet])
  
  if (!bet || bet.status === "pending") return null
  
  const formatPrice = (price: number | undefined | null) => {
    if (!price) return "N/A"
    return price.toFixed(2)
  }
  
  const priceDifference = bet.finalPrice && bet.initialPrice 
    ? bet.finalPrice - bet.initialPrice 
    : 0
    
  const percentChange = bet.initialPrice 
    ? ((priceDifference / bet.initialPrice) * 100).toFixed(2) 
    : "0.00"
    
  const isPositive = priceDifference >= 0

  return (
    <>
      {showConfetti && <Confetti />}
      
      <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="bg-gray-900 border border-blue-900 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <span className={bet.status === "won" ? "text-green-400" : "text-red-400"}>
                {bet.status === "won" ? "¡Apuesta Ganada! 🎉" : "Apuesta Perdida"}
              </span>
              <Badge 
                variant="outline" 
                className={bet.status === "won" ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"}
              >
                {bet.status === "won" ? "GANADA" : "PERDIDA"}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Resultado de tu apuesta {bet.direction === "up" ? "TORO" : "OSO"} en {new Date(bet.timestamp).toLocaleTimeString()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="bg-gray-800 p-4 rounded-lg border border-blue-900 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400">Símbolo</p>
                <p className="font-bold text-white">{bet.symbol}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Dirección</p>
                <p className={`font-bold ${bet.direction === "up" ? "text-green-400" : "text-red-400"}`}>
                  {bet.direction === "up" ? "TORO ↑" : "OSO ↓"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Cantidad</p>
                <p className="font-bold text-white">{bet.amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Apalancamiento</p>
                <p className="font-bold text-white">{bet.leverage}x</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Precio Inicial</p>
                <p className="font-bold text-white">${formatPrice(bet.initialPrice)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Precio Final</p>
                <p className={`font-bold ${
                  bet.finalPrice && bet.initialPrice && bet.finalPrice > bet.initialPrice 
                    ? "text-green-400" 
                    : bet.finalPrice && bet.initialPrice && bet.finalPrice < bet.initialPrice 
                    ? "text-red-400" 
                    : "text-white"
                }`}>
                  ${formatPrice(bet.finalPrice)}
                  {bet.finalPrice && bet.initialPrice && (
                    <span className="text-xs ml-1">
                      {bet.finalPrice > bet.initialPrice 
                        ? `(+${(bet.finalPrice - bet.initialPrice).toFixed(2)})` 
                        : bet.finalPrice < bet.initialPrice 
                        ? `(-${(bet.initialPrice - bet.finalPrice).toFixed(2)})` 
                        : ""}
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${bet.status === "won" ? "bg-green-900/30 border border-green-500" : "bg-red-900/30 border border-red-500"}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-300">Resultado</p>
                  <div className="flex items-center mt-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bet.status === "won" ? "bg-green-500" : "bg-red-500"}`}>
                      {bet.status === "won" ? "✓" : "✗"}
                    </div>
                    <div className="ml-2">
                      <p className={`font-bold ${bet.status === "won" ? "text-green-400" : "text-red-400"}`}>
                        {bet.status === "won" ? "Predicción Correcta" : "Predicción Incorrecta"}
                      </p>
                      <p className="text-xs text-gray-400">
                        Cambio de precio: 
                        <span className={isPositive ? "text-green-400" : "text-red-400"}>
                          {" "}{isPositive ? "+" : ""}{priceDifference.toFixed(2)} ({isPositive ? "+" : ""}{percentChange}%)
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-gray-300">Ganancia/Pérdida</p>
                  <p className={`text-2xl font-bold ${bet.status === "won" ? "text-green-400" : "text-red-400"}`}>
                    {bet.status === "won" ? "+" : "-"}
                    {(bet.status === "won" ? bet.potentialProfit : bet.amount).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={onClose}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 
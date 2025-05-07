"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react"
import { useBettingStore, type Bet } from "@/lib/betting-store"
import { useState, useEffect } from "react"
import { toast } from "@/components/ui/use-toast"

interface BetDetailsModalProps {
  bet: Bet | null
  isOpen: boolean
  onClose: () => void
}

export default function BetDetailsModal({ bet, isOpen, onClose }: BetDetailsModalProps) {
  const { deleteBet } = useBettingStore()
  const [priceDifference, setPriceDifference] = useState<number | null>(null)
  const [startPrice, setStartPrice] = useState<number | null>(null)
  const [endPrice, setEndPrice] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRealData, setIsRealData] = useState(true)

  useEffect(() => {
    // Obtener datos reales de precios para la vela apostada
    if (bet && isOpen) {
      // Si ya tenemos precios iniciales y finales (para apuestas resueltas), úsalos
      if (bet.status !== "pending" && bet.initialPrice && bet.finalPrice) {
        setStartPrice(bet.initialPrice);
        setEndPrice(bet.finalPrice);
        setPriceDifference(bet.finalPrice - bet.initialPrice);
        console.log(`Usando precios guardados: inicial=${bet.initialPrice}, final=${bet.finalPrice}`);
        return;
      }
      
      // Función para obtener los datos de precio actuales
      const fetchPriceData = async () => {
        try {
          // Obtenemos datos de precio actuales desde la API
          const response = await fetch("/api/current-price");
          const data = await response.json();
          
          // Verificar si hay error
          if (data.error) {
            console.error("Error en datos de precio:", data.error);
            setIsRealData(false);
            return;
          }
          
          if (data.price) {
            // Actualizar estado de datos reales
            setIsRealData(data.isReal !== undefined ? data.isReal : true);
            
            // Para apuestas pendientes, el precio de apertura es el precio inicial almacenado
            if (bet.status === "pending") {
              // Usar el precio inicial guardado en la apuesta
              if (bet.initialPrice) {
                setStartPrice(bet.initialPrice);
              }
              
              // El precio actual es el precio de cierre (actualizado)
              setEndPrice(data.price);
              
              if (bet.initialPrice) {
                // Calcular la diferencia de precio
                setPriceDifference(data.price - bet.initialPrice);
              }
            } else {
              // Para apuestas ya resueltas, usamos los precios guardados
              if (bet.initialPrice && bet.finalPrice) {
                setStartPrice(bet.initialPrice);
                setEndPrice(bet.finalPrice);
                setPriceDifference(bet.finalPrice - bet.initialPrice);
              }
            }
          }
        } catch (error) {
          console.error("Error al obtener datos de precio:", error);
        }
      };
      
      // Obtener datos iniciales
      fetchPriceData();
      
      // Para apuestas pendientes, actualizamos cada 2 segundos
      let intervalId: NodeJS.Timeout | null = null;
      if (bet.status === "pending") {
        intervalId = setInterval(fetchPriceData, 2000);
      }
      
      return () => {
        if (intervalId) clearInterval(intervalId);
      };
    }
  }, [bet, isOpen]);

  if (!bet) return null;

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-ES', {
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleDelete = () => {
    if (!bet) return;
    
    setIsDeleting(true);
    deleteBet(bet.id);
    setTimeout(() => {
      setIsDeleting(false);
      // Mostrar toast de confirmación
      toast({
        title: "Apuesta eliminada",
        description: "La apuesta ha sido eliminada correctamente",
        variant: "destructive"
      });
      onClose();
    }, 500);
  };

  const candleDirection = endPrice && startPrice ? 
    (endPrice > startPrice ? "up" : endPrice < startPrice ? "down" : "neutral") : "neutral";

  const calculateResult = () => {
    if (!priceDifference || bet.status === "pending") return null;

    const isCorrectPrediction = 
      (bet.direction === "up" && priceDifference > 0) || 
      (bet.direction === "down" && priceDifference < 0);

    return isCorrectPrediction;
  };

  const betResult = calculateResult();
  
  // Calcular ganancias o pérdidas
  const calculateProfitLoss = () => {
    if (bet.status === "pending") return null;
    
    if (bet.status === "won") {
      return {
        value: bet.potentialProfit,
        isPositive: true
      };
    } else {
      return {
        value: -bet.amount,
        isPositive: false
      };
    }
  };
  
  const profitLoss = calculateProfitLoss();
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gray-900 border border-blue-900 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <span className="text-blue-400">Detalles de Apuesta</span>
            <Badge 
              variant="outline" 
              className={`
                ${bet.status === "pending" ? "bg-yellow-900 text-yellow-400" : 
                  bet.status === "won" ? "bg-green-900 text-green-400" : 
                  "bg-red-900 text-red-400"}
              `}
            >
              {bet.status === "pending" ? "Pendiente" : 
                bet.status === "won" ? "Ganada" : "Perdida"}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Información completa sobre esta apuesta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Bet basic info */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800 p-2 rounded">
              <p className="text-xs text-gray-400">ID de Apuesta</p>
              <p className="text-sm font-mono truncate">{bet.id}</p>
            </div>
            <div className="bg-gray-800 p-2 rounded">
              <p className="text-xs text-gray-400">Fecha</p>
              <p className="text-sm">{formatDateTime(bet.timestamp)}</p>
            </div>
          </div>

          {/* Direction and amount */}
          <div className="bg-gray-800 p-3 rounded flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Dirección</p>
              <div className="flex items-center mt-1">
                {bet.direction === "up" ? (
                  <>
                    <div className="text-2xl mr-1">🐂</div>
                    <span className="ml-1 text-green-400 font-bold">TORO</span>
                  </>
                ) : (
                  <>
                    <div className="text-2xl mr-1">🐻</div>
                    <span className="ml-1 text-red-400 font-bold">OSO</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Cantidad</p>
              <p className="text-lg font-bold text-yellow-400">{bet.amount.toLocaleString()}</p>
              <p className="text-xs text-blue-400">x{bet.leverage} apalancamiento</p>
            </div>
          </div>

          {/* Candle details */}
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-xs text-gray-400 mb-2">Datos de la Vela</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-900 p-1 rounded">
                <p className="text-xs text-gray-400">Precio Inicial</p>
                {bet.initialPrice ? (
                  <div className="flex flex-col items-center">
                    <p className="text-sm font-mono font-bold text-white">${bet.initialPrice.toFixed(2)}</p>
                    <p className="text-[10px] text-blue-400">Apertura de vela</p>
                    <p className="text-[10px] text-gray-500">{new Date(bet.candleTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</p>
                  </div>
                ) : (
                  <p className="text-sm font-mono">${startPrice?.toFixed(2) || "..."}</p>
                )}
              </div>
              <div className="bg-gray-900 p-1 rounded">
                <p className="text-xs text-gray-400">Precio Final</p>
                {bet.status === "pending" ? (
                  <div className="flex flex-col items-center">
                    <p className="text-sm font-mono text-yellow-400">${endPrice?.toFixed(2) || "..."}</p>
                    <p className="text-[10px] text-yellow-500 animate-pulse">Actualizado</p>
                    {!isRealData && <span className="text-[10px] text-red-400">(caché)</span>}
                  </div>
                ) : bet.finalPrice ? (
                  <div className="flex flex-col items-center">
                    <p className={`text-sm font-mono font-bold ${
                      bet.finalPrice > (bet.initialPrice || 0) ? "text-green-400" :
                      bet.finalPrice < (bet.initialPrice || 0) ? "text-red-400" : "text-white"
                    }`}>
                      ${bet.finalPrice.toFixed(2)}
                      {bet.initialPrice && (
                        <span className="text-[10px] ml-1">
                          {bet.finalPrice > bet.initialPrice
                            ? `(+${(bet.finalPrice - bet.initialPrice).toFixed(2)})`
                            : bet.finalPrice < bet.initialPrice
                            ? `(-${(bet.initialPrice - bet.finalPrice).toFixed(2)})`
                            : ""}
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-blue-400">Cierre de vela</p>
                    <p className="text-[10px] text-gray-500">{bet.status === "won" ? "Ganancia" : "Pérdida"}</p>
                  </div>
                ) : (
                  <p className="text-sm font-mono">${endPrice?.toFixed(2) || "..."}</p>
                )}
              </div>
              <div className="bg-gray-900 p-1 rounded">
                <p className="text-xs text-gray-400">Diferencia</p>
                {bet.initialPrice ? (
                  <div className="flex flex-col items-center">
                    <p className={`text-sm font-bold ${
                      priceDifference && priceDifference > 0 ? 'text-green-400' : 
                      priceDifference && priceDifference < 0 ? 'text-red-400' : 
                      'text-gray-400'
                    } ${bet.status === "pending" ? "animate-pulse" : ""}`}>
                      {priceDifference !== null 
                        ? `${priceDifference > 0 ? '+' : ''}${priceDifference.toFixed(2)}`
                        : "..."}
                    </p>
                    {priceDifference !== null && bet.initialPrice && (
                      <p className={`text-[10px] ${
                        priceDifference > 0 ? 'text-green-400' : 
                        priceDifference < 0 ? 'text-red-400' : 
                        'text-gray-400'
                      }`}>
                        ({(priceDifference / bet.initialPrice * 100).toFixed(2)}%)
                      </p>
                    )}
                    {bet.status !== "pending" && (
                      <p className="text-[10px] text-gray-400 mt-1">
                        Predicción: <span className={bet.status === "won" ? "text-green-400" : "text-red-400"}>
                          {bet.status === "won" ? "Acertada" : "Fallada"}
                        </span>
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm font-mono text-gray-500">Sin datos</p>
                )}
              </div>
            </div>

            {/* Candle visualization */}
            <div className="mt-3 h-16 relative rounded overflow-hidden bg-gray-950">
              <div className={`absolute inset-0 flex items-center justify-center
                ${candleDirection === "up" ? "bg-green-900/20" : 
                  candleDirection === "down" ? "bg-red-900/20" : "bg-gray-900/30"}`}
              >
                {bet.status === "pending" && (
                  <div className="absolute top-0 right-0 bg-blue-600/70 text-blue-100 text-[10px] px-1 py-0.5 rounded-bl-sm">
                    Actualización en tiempo real
                  </div>
                )}
                <div className="flex items-center">
                  {candleDirection === "up" ? (
                    <ArrowUp className="h-4 w-4 text-green-400 mr-1" />
                  ) : candleDirection === "down" ? (
                    <ArrowDown className="h-4 w-4 text-red-400 mr-1" />
                  ) : null}
                  <span className={`text-xs font-medium ${
                    candleDirection === "up" ? "text-green-400" : 
                    candleDirection === "down" ? "text-red-400" : "text-gray-400"
                  }`}>
                    {candleDirection === "up" ? "Vela Alcista" : 
                     candleDirection === "down" ? "Vela Bajista" : "Neutral"}
                  </span>
                </div>
              </div>
              
              {/* Visualización detallada de la vela */}
              {startPrice && endPrice && (
                <>
                  {/* Marcadores de precios */}
                  <div className="absolute left-0 top-0 h-full w-0.5 bg-blue-500 flex flex-col justify-between items-start">
                    <span className="text-[10px] bg-blue-900 px-1 text-blue-300 rounded-r-sm">Apertura</span>
                    <span className="text-[10px] font-mono ml-1 bg-blue-900/70 px-1 text-blue-200 rounded-r-sm">${startPrice.toFixed(1)}</span>
                  </div>
                  <div className="absolute right-0 top-0 h-full w-0.5 bg-yellow-500 flex flex-col justify-between items-end">
                    <span className="text-[10px] bg-yellow-900 px-1 text-yellow-300 rounded-l-sm">Cierre</span>
                    <span className="text-[10px] font-mono mr-1 bg-yellow-900/70 px-1 text-yellow-200 rounded-l-sm">${endPrice.toFixed(1)}</span>
                  </div>
                  
                  {/* Cuerpo de la vela */}
                  <div 
                    className={`absolute h-6 left-6 right-6 ${
                      candleDirection === "up" ? "bg-green-600/70 border-green-400" : 
                      candleDirection === "down" ? "bg-red-600/70 border-red-400" : 
                      "bg-gray-600/50 border-gray-400"
                    } border rounded`}
                    style={{ top: "calc(50% - 12px)" }}
                  >
                    {/* Mostrar la diferencia de precio dentro de la vela */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-xs font-mono ${
                        candleDirection === "up" ? "text-green-100" : 
                        candleDirection === "down" ? "text-red-100" : 
                        "text-gray-100"
                      }`}>
                        {priceDifference 
                          ? `${priceDifference > 0 ? '+' : ''}${priceDifference.toFixed(1)}`
                          : "..."}
                      </span>
                    </div>
                    
                    {/* Línea que conecta apertura y cierre */}
                    <div 
                      className={`absolute w-1 -left-1 -right-1 ${
                        candleDirection === "up" ? "bg-green-400" : 
                        candleDirection === "down" ? "bg-red-400" : 
                        "bg-gray-400"
                      }`}
                      style={{ 
                        height: "40px", 
                        top: "-10px" 
                      }}
                    />
                  </div>
                  
                  {/* Sombras/mechas de la vela */}
                  <div 
                    className={`absolute w-0.5 left-1/2 -ml-px h-full ${
                      candleDirection === "up" ? "bg-green-400" : 
                      candleDirection === "down" ? "bg-red-400" : 
                      "bg-gray-400"
                    }`}
                  />
                  
                  {/* Predicción del usuario */}
                  <div 
                    className={`absolute h-6 w-6 flex items-center justify-center rounded-full ${
                      bet.direction === "up" 
                        ? `${candleDirection === "up" ? "bg-green-700" : "bg-red-700"} border-2 ${candleDirection === "up" ? "border-green-300" : "border-red-300"}` 
                        : `${candleDirection === "down" ? "bg-green-700" : "bg-red-700"} border-2 ${candleDirection === "down" ? "border-green-300" : "border-red-300"}`
                    }`}
                    style={{ 
                      top: bet.direction === "up" ? "calc(15% - 12px)" : "calc(85% - 12px)",
                      left: "calc(80% - 12px)"
                    }}
                  >
                    {bet.direction === "up" ? "▲" : "▼"}
                  </div>
                  
                  {/* Indicador de actualización en tiempo real */}
                  {bet.status === "pending" && (
                    <div className="absolute top-1 right-1/2 transform translate-x-1/2 bg-blue-900/80 px-1 py-0.5 rounded text-[9px] text-blue-300 animate-pulse">
                      Actualizando...
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Prediction result visualization */}
          {bet.status !== "pending" && (
            <div className={`bg-gray-800 p-3 rounded ${bet.status === "won" ? "border border-green-500" : "border border-red-500"}`}>
              <p className="text-xs text-gray-400 mb-2">Resultado de la Predicción</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bet.status === "won" ? "bg-green-900" : "bg-red-900"}`}>
                    {bet.status === "won" ? "✓" : "✗"}
                  </div>
                  <div className="ml-2">
                    <p className={`font-bold ${bet.status === "won" ? "text-green-400" : "text-red-400"}`}>
                      {bet.status === "won" ? "Predicción Correcta" : "Predicción Incorrecta"}
                    </p>
                    <p className="text-xs text-gray-400">
                      Predijo que el precio iría {bet.direction === "up" ? "hacia arriba" : "hacia abajo"}
                    </p>
                  </div>
                </div>
                
                {profitLoss && (
                  <div className={`text-right ${profitLoss.isPositive ? "text-green-400" : "text-red-400"}`}>
                    <p className="text-xs">Resultado</p>
                    <p className="text-lg font-bold">
                      {profitLoss.isPositive ? "+" : ""}{profitLoss.value.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PNL en tiempo real para apuestas pendientes */}
          {bet.status === "pending" && bet.currentPnL !== undefined && (
            <div className={`bg-gray-800 p-3 rounded ${
              bet.currentPnL > 0 ? "border border-green-500" : 
              bet.currentPnL < 0 ? "border border-red-500" : 
              "border border-blue-500"
            }`}>
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-400">PNL en tiempo real</p>
                <div className="bg-blue-900/70 text-blue-100 text-[10px] px-1 py-0.5 rounded">
                  Actualización en vivo
                </div>
              </div>
              
              <div className="mt-2 flex justify-between items-center">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    bet.currentPnL > 0 ? "bg-green-900/70" : 
                    bet.currentPnL < 0 ? "bg-red-900/70" : 
                    "bg-blue-900/70"
                  }`}>
                    {bet.currentPnL > 0 ? "▲" : bet.currentPnL < 0 ? "▼" : "•"}
                  </div>
                  <div className="ml-2">
                    <p className={`font-bold ${
                      bet.currentPnL > 0 ? "text-green-400" : 
                      bet.currentPnL < 0 ? "text-red-400" : 
                      "text-blue-400"
                    }`}>
                      {bet.currentPnL > 0 ? "Ganando" : bet.currentPnL < 0 ? "Perdiendo" : "Neutral"}
                    </p>
                    <p className="text-xs text-gray-400">
                      Apalancamiento: {bet.leverage}x
                    </p>
                  </div>
                </div>
                
                <div className={`text-right ${
                  bet.currentPnL > 0 ? "text-green-400" : 
                  bet.currentPnL < 0 ? "text-red-400" : 
                  "text-blue-400"
                }`}>
                  <p className="text-lg font-bold animate-pulse">
                    {bet.currentPnL > 0 ? "+" : ""}{bet.currentPnL.toFixed(2)}
                  </p>
                  <p className="text-xs">
                    {bet.currentPnLPercent !== undefined && (
                      <span>
                        {bet.currentPnLPercent > 0 ? "+" : ""}
                        {bet.currentPnLPercent.toFixed(2)}%
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Profit/Loss */}
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-xs text-gray-400 mb-1">Información Financiera</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-900 p-2 rounded">
                <p className="text-xs text-gray-400">Potencial ganancia</p>
                <p className="text-sm font-bold text-green-400">+{bet.potentialProfit.toLocaleString()}</p>
              </div>
              
              <div className="bg-gray-900 p-2 rounded">
                <p className="text-xs text-gray-400">Ganancia máxima</p>
                <p className="text-sm">
                  {((bet.potentialProfit / bet.amount) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 mt-4">
            {bet.status === "pending" && (
              <Button 
                variant="destructive" 
                size="sm"
                disabled={isDeleting}
                onClick={handleDelete}
                className="bg-red-900 hover:bg-red-800"
              >
                {isDeleting ? (
                  <>
                    <span className="animate-spin mr-1">⏳</span>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar Apuesta
                  </>
                )}
              </Button>
            )}
            <DialogClose asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-blue-800 bg-blue-900 bg-opacity-40 text-blue-400 hover:bg-blue-800"
              >
                Cerrar
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp, Info, RefreshCw, Trash2 } from "lucide-react"
import { useBettingStore, type Bet } from "@/lib/betting-store"
import { useState, useEffect } from "react"
import BetDetailsModal from "./bet-details-modal"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export default function BetHistory() {
  const { bets, deleteBet } = useBettingStore()
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [localBets, setLocalBets] = useState<Bet[]>([])
  const { toast } = useToast()
  
  // Utilizar una copia local de las apuestas para asegurar renderizado correcto
  useEffect(() => {
    setLocalBets(bets);
    
    // También verificar si hay apuestas en localStorage que no se hayan cargado
    try {
      const storedData = localStorage.getItem("betting-store");
      if (storedData) {
        const parsed = JSON.parse(storedData);
        if (parsed.state && parsed.state.bets && parsed.state.bets.length > 0) {
          if (parsed.state.bets.length !== bets.length) {
            console.log("Detectadas diferencias entre localStorage y estado actual");
            // Forzar actualización (en una aplicación real, habría que hacer merge)
            setLocalBets(parsed.state.bets);
          }
        }
      }
    } catch (e) {
      console.error("Error cargando apuestas desde localStorage:", e);
    }
  }, [bets]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  const handleViewDetails = (bet: Bet) => {
    setSelectedBet(bet)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedBet(null), 300) // Clear after animation finishes
  }

  const handleDeleteBet = (bet: Bet, e: React.MouseEvent) => {
    e.stopPropagation()
    
    deleteBet(bet.id)
    
    // Actualizar también la lista local para asegurar actualización UI
    setLocalBets(prev => prev.filter(b => b.id !== bet.id));
    
    toast({
      title: "Apuesta eliminada",
      description: bet.status === "pending" 
        ? "Se ha cancelado la apuesta y devuelto el saldo" 
        : "Se ha eliminado el registro de la apuesta",
      variant: "default"
    })
  }
  
  // Función para forzar recarga de apuestas desde localStorage
  const forceRefreshFromStorage = () => {
    try {
      const storedData = localStorage.getItem("betting-store");
      if (storedData) {
        const parsed = JSON.parse(storedData);
        if (parsed.state && parsed.state.bets) {
          setLocalBets(parsed.state.bets);
          toast({
            title: "Lista actualizada",
            description: `Se cargaron ${parsed.state.bets.length} apuestas desde almacenamiento`,
            variant: "default"
          });
        }
      }
    } catch (e) {
      console.error("Error recargando apuestas:", e);
      toast({
        title: "Error",
        description: "No se pudieron recargar las apuestas",
        variant: "destructive"
      });
    }
  }

  return (
    <Card className="h-full border-blue-900 bg-gray-900">
      <CardContent className="p-0 h-full flex flex-col">
        <div className="border-b border-blue-900 bg-gray-800 bg-opacity-50 p-3 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Historial de Apuestas</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={forceRefreshFromStorage}
            className="h-6 w-6 text-blue-400 hover:text-blue-300"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>

        {localBets.length === 0 ? (
          <div className="flex flex-grow items-center justify-center text-gray-500">
            <p>No hay apuestas todavía</p>
          </div>
        ) : (
          <div className="custom-scrollbar overflow-y-auto flex-grow p-2">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-gray-900 text-left text-xs text-gray-400">
                <tr>
                  <th className="p-2">Hora</th>
                  <th className="p-2">Símbolo</th>
                  <th className="p-2">Dirección</th>
                  <th className="p-2">Cantidad</th>
                  <th className="p-2">Estado</th>
                  <th className="p-2">PNL</th>
                  <th className="p-2">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-sm text-white">
                {localBets.map((bet) => (
                  <tr 
                    key={bet.id} 
                    className="hover:bg-gray-800 cursor-pointer" 
                    onClick={() => handleViewDetails(bet)}
                  >
                    <td className="p-2 text-gray-400">{formatTime(bet.timestamp)}</td>
                    <td className="p-2">{bet.symbol}</td>
                    <td className="p-2">
                      {bet.direction === "up" ? (
                        <span className="flex items-center text-green-500">
                          <ArrowUp className="mr-1 h-3 w-3" />
                          <span className="mr-1">🐂</span> Toro
                        </span>
                      ) : (
                        <span className="flex items-center text-red-500">
                          <ArrowDown className="mr-1 h-3 w-3" />
                          <span className="mr-1">🐻</span> Oso
                        </span>
                      )}
                    </td>
                    <td className="p-2">
                      <span className="font-medium">{bet.amount.toLocaleString()}</span>
                      <span className="ml-1 text-xs text-gray-400">{bet.leverage}x</span>
                    </td>
                    <td className="p-2">
                      {bet.status === "pending" && (
                        <Badge variant="outline" className="bg-yellow-900 text-yellow-400">
                          Pendiente
                        </Badge>
                      )}
                      {bet.status === "won" && (
                        <Badge variant="outline" className="bg-green-900 text-green-400">
                          Ganada
                        </Badge>
                      )}
                      {bet.status === "lost" && (
                        <Badge variant="outline" className="bg-red-900 text-red-400">
                          Perdida
                        </Badge>
                      )}
                    </td>
                    <td className="p-2">
                      {bet.currentPnL !== undefined ? (
                        <span className={`font-medium ${
                          bet.currentPnL > 0 ? 'text-green-500' : 
                          bet.currentPnL < 0 ? 'text-red-500' : 
                          'text-gray-400'
                        } ${bet.status === "pending" ? "animate-pulse" : ""}`}>
                          {bet.currentPnL > 0 ? "+" : ""}
                          {bet.currentPnL.toFixed(2)}
                          <span className="ml-1 text-xs text-gray-400">
                            ({bet.currentPnLPercent !== undefined ? (bet.currentPnLPercent > 0 ? "+" : "") + bet.currentPnLPercent.toFixed(2) : 0}%)
                          </span>
                        </span>
                      ) : bet.status === "won" ? (
                        <span className="text-green-500">+{bet.potentialProfit.toFixed(2)}</span>
                      ) : bet.status === "lost" ? (
                        <span className="text-red-500">-{bet.amount.toFixed(2)}</span>
                      ) : (
                        <span className="text-gray-400">0.00</span>
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-blue-400 hover:text-blue-300 hover:bg-blue-950"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(bet);
                          }}
                        >
                          <Info className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-950"
                          onClick={(e) => handleDeleteBet(bet, e)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
      
      <BetDetailsModal 
        bet={selectedBet} 
        isOpen={isModalOpen} 
        onClose={handleModalClose} 
      />
    </Card>
  )
}

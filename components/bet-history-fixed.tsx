"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp, Info, Trash2 } from "lucide-react"
import { useBettingStore, type Bet } from "@/lib/betting-store"
import { useState } from "react"
import BetDetailsModal from "./bet-details-modal"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export default function BetHistory() {
  const { bets, deleteBet } = useBettingStore()
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { toast } = useToast()

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
    
    toast({
      title: "Apuesta eliminada",
      description: bet.status === "pending" 
        ? "Se ha cancelado la apuesta y devuelto el saldo" 
        : "Se ha eliminado el registro de la apuesta",
      variant: "default"
    })
  }

  return (
    <Card className="h-full border-blue-900 bg-gray-900">
      <CardContent className="p-0 h-full flex flex-col">
        <div className="border-b border-blue-900 bg-gray-800 bg-opacity-50 p-3">
          <h3 className="text-lg font-bold text-white">Historial de Apuestas</h3>
        </div>

        {bets.length === 0 ? (
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
                  <th className="p-2">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-sm text-white">
                {bets.map((bet) => (
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
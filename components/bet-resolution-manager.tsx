"use client"

import { useEffect, useState, useRef } from "react"
import { useBettingStore, BET_RESOLVED_EVENT, Bet } from "@/lib/betting-store"
import BetResultModal from "./bet-result-modal"

export default function BetResolutionManager() {
  const [resolvedBet, setResolvedBet] = useState<Bet | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { lastResolvedBet, clearLastResolvedBet } = useBettingStore()
  
  // Para evitar mostrar múltiples veces el mismo resultado
  const processedBetsRef = useRef<Set<string>>(new Set())
  
  // Escuchar eventos de resolución de apuestas
  useEffect(() => {
    const handleBetResolved = (event: CustomEvent<{ bet: Bet }>) => {
      if (event.detail && event.detail.bet) {
        const bet = event.detail.bet
        
        // Evitar procesar la misma apuesta varias veces
        if (processedBetsRef.current.has(bet.id)) {
          console.log("Apuesta ya procesada, ignorando:", bet.id)
          return
        }
        
        // Marcar esta apuesta como procesada
        processedBetsRef.current.add(bet.id)
        console.log("Mostrando modal para apuesta resuelta:", bet.id)
        
        setResolvedBet(bet)
        setIsModalOpen(true)
      }
    }
    
    // Escuchar el evento personalizado
    window.addEventListener(
      BET_RESOLVED_EVENT,
      handleBetResolved as EventListener
    )
    
    return () => {
      window.removeEventListener(
        BET_RESOLVED_EVENT,
        handleBetResolved as EventListener
      )
    }
  }, [])
  
  // También comprobar lastResolvedBet del store por si se perdió el evento
  useEffect(() => {
    if (
      lastResolvedBet && 
      !resolvedBet &&
      !processedBetsRef.current.has(lastResolvedBet.id) &&
      lastResolvedBet.status !== "pending"
    ) {
      // Marcar esta apuesta como procesada
      processedBetsRef.current.add(lastResolvedBet.id)
      console.log("Mostrando modal desde store para apuesta:", lastResolvedBet.id)
      
      setResolvedBet(lastResolvedBet)
      setIsModalOpen(true)
      
      // Limpiar para evitar mostrar el mismo modal varias veces
      clearLastResolvedBet()
    }
  }, [lastResolvedBet, resolvedBet, clearLastResolvedBet])
  
  // Limitar el número de apuestas en el historial de procesadas
  useEffect(() => {
    // Limpiar el historial cada minuto para evitar que crezca demasiado
    const interval = setInterval(() => {
      if (processedBetsRef.current.size > 20) {
        console.log("Limpiando historial de apuestas procesadas")
        processedBetsRef.current = new Set([...processedBetsRef.current].slice(-10))
      }
    }, 60000)
    
    return () => clearInterval(interval)
  }, [])
  
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setTimeout(() => {
      setResolvedBet(null)
    }, 300) // Esperar a que termine la animación
  }
  
  // Si no hay apuesta resuelta o el modal no está abierto, no renderizar nada
  if (!resolvedBet || !isModalOpen) return null
  
  return (
    <BetResultModal
      bet={resolvedBet}
      onClose={handleCloseModal}
    />
  )
} 
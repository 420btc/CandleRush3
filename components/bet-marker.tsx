"use client"

import type { Bet } from "@/lib/betting-store"
import { useEffect, useState } from "react"

interface BetMarkerProps {
  bet: Bet
  position: {
    top: string
    right: string
  }
}

export default function BetMarker({ bet, position }: BetMarkerProps) {
  // Estado para animar nuevas apuestas
  const [isNew, setIsNew] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  
  useEffect(() => {
    // Detectar si la apuesta es nueva (menos de 10 segundos)
    const isNewBet = Date.now() - new Date(bet.timestamp).getTime() < 10000;
    setIsNew(isNewBet && bet.status === "pending");
    
    // Iniciar animación de pulso para apuestas nuevas
    if (isNewBet && bet.status === "pending") {
      setIsPulsing(true);
      const timer = setTimeout(() => {
        setIsPulsing(false);
      }, 5000); // Duración total de la animación
      
      return () => clearTimeout(timer);
    }
  }, [bet]);
  
  // Calculate icon size based on bet amount
  // Base size of 24px, scaled by bet amount
  const baseSize = 24;
  const maxSize = 48;
  
  // Calculate size based on bet amount (logarithmic scale for better visualization)
  const normalizedSize = Math.min(
    baseSize + Math.log10(bet.amount / 1000) * 8, 
    maxSize
  );
  
  const iconSize = Math.max(normalizedSize, baseSize);
  
  // Calculate opacity based on status
  const opacity = bet.status === "pending" ? 0.9 : bet.status === "won" ? 0.7 : 0.4;
  
  // Colors based on bet status and direction
  const bullColor = bet.status === "won" ? "#26a69a" : bet.status === "lost" ? "#999999" : "#4caf50";
  const bearColor = bet.status === "won" ? "#ef5350" : bet.status === "lost" ? "#999999" : "#f44336";
  const backgroundColor = bet.direction === "up" ? bullColor : bearColor;
  
  // Determine emoji
  const emoji = bet.direction === "up" ? "🐂" : "🐻";
  
  // Calcular el offset vertical para alinear mejor con las velas
  const verticalOffset = bet.direction === "up" ? -5 : 5;
  
  return (
    <div
      className="absolute"
      style={{
        top: position.top,
        right: position.right,
        opacity: opacity,
        zIndex: 1000,
        transform: `translateY(calc(-${iconSize/2}px + ${verticalOffset}px))`,
        transition: "all 0.3s ease"
      }}
      title={`${bet.direction === "up" ? "Toro" : "Oso"} ${bet.amount.toLocaleString()} a ${bet.leverage}x en ${new Date(bet.timestamp).toLocaleTimeString()}`}
    >
      {/* Emoji container */}
      <div 
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: `${iconSize * 0.75}px`,
          backgroundColor: bet.status === "pending" ? "#222222dd" : "#00000033",
          border: `1px solid ${bet.status === "pending" ? "#FFFFFF88" : "#FFFFFF44"}`,
          borderRadius: "4px",
          padding: "2px",
          filter: isPulsing 
            ? "drop-shadow(0 0 6px rgba(255, 255, 255, 0.9))" 
            : bet.status === "pending" 
              ? "drop-shadow(0 0 4px rgba(255, 255, 255, 0.5))" 
              : "none",
          animation: isPulsing ? "pulse 1.5s infinite" : "none"
        }}
      >
        {emoji}
      </div>
      
      {/* Anillos de pulso para apuestas nuevas */}
      {isPulsing && (
        <>
          <div className="pulse-ring" style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: `${iconSize * 1.5}px`,
            height: `${iconSize * 1.5}px`,
            borderRadius: "50%",
            border: `2px solid ${backgroundColor}`,
            opacity: 0,
            animation: "pulse 2s infinite",
            animationDelay: "0.2s"
          }} />
          <div className="pulse-ring" style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: `${iconSize * 1.8}px`,
            height: `${iconSize * 1.8}px`,
            borderRadius: "50%",
            border: `2px solid ${backgroundColor}`,
            opacity: 0,
            animation: "pulse 2s infinite",
            animationDelay: "0.6s"
          }} />
        </>
      )}
      
      {/* Show bet amount for larger bets */}
      {bet.amount >= 5000 && (
        <div 
          className="absolute ml-1 text-xs font-bold px-1 rounded"
          style={{
            top: bet.direction === "up" ? "0" : "auto",
            bottom: bet.direction === "up" ? "auto" : "0",
            left: "100%",
            backgroundColor,
            color: "#FFFFFF",
            border: "1px solid #FFFFFF55",
            fontSize: `${Math.min(11 + Math.log10(bet.amount / 10000), 14)}px`
          }}
        >
          {(bet.amount / 1000).toFixed(0)}K
        </div>
      )}
      
      {/* Show direction arrow for pending bets */}
      {bet.status === "pending" && (
        <div 
          className="absolute mr-1 text-xs font-bold px-1 rounded"
          style={{
            top: bet.direction === "up" ? "0" : "auto",
            bottom: bet.direction === "up" ? "auto" : "0",
            right: "100%",
            backgroundColor,
            color: "#FFFFFF",
            border: "1px solid #FFFFFF55"
          }}
        >
          {bet.direction === "up" ? "▲" : "▼"}
        </div>
      )}
      
      {/* CSS global para las animaciones de pulso */}
      <style jsx global>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.7;
          }
          70% {
            transform: scale(1.5);
            opacity: 0.2;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        .pulse-ring {
          animation: pulse 2s infinite;
        }
      `}</style>
    </div>
  )
}

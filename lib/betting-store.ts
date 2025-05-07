"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { toast } from "@/components/ui/use-toast"

export type Bet = {
  id: string
  amount: number
  leverage: number
  direction: "up" | "down"
  timestamp: string
  symbol: string
  status: "pending" | "won" | "lost"
  potentialProfit: number
  // Required candle time for positioning
  candleTime: number
  // Datos de precios para análisis
  initialPrice?: number
  finalPrice?: number | null
  // PNL en tiempo real
  currentPnL?: number
  currentPnLPercent?: number
  // Último precio actualizado para cálculo de PNL
  lastUpdatedPrice?: number
}

type BettingStore = {
  balance: number
  bets: Bet[]
  placeBet: (bet: Bet) => Promise<void>
  resolveBet: (id: string, won: boolean) => Promise<void>
  deleteBet: (id: string) => void
  resetBalance: () => void
  clearBets: () => void
  updateBetPnL: (betId: string, currentPrice: number) => void
  updateAllBetsPnL: (currentPrice: number) => void
}

const CHART_EVENT = "update-tradingview-markers";

// Función para obtener el precio actual desde la API de Binance
const getCurrentPrice = async (symbol = "BTCUSDT") => {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    if (!response.ok) throw new Error("Error obteniendo precio");
    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error("Error obteniendo precio actual:", error);
    return null;
  }
};

// Función para obtener datos de la vela actual desde la API de Binance
const getCurrentCandle = async (symbol = "BTCUSDT", interval = "1m") => {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=1`);
    if (!response.ok) throw new Error("Error obteniendo datos de vela");
    const data = await response.json();
    
    if (data && data[0]) {
      return {
        openTime: data[0][0],
        open: parseFloat(data[0][1]),
        high: parseFloat(data[0][2]),
        low: parseFloat(data[0][3]),
        close: parseFloat(data[0][4]),
        volume: parseFloat(data[0][5]),
        closeTime: data[0][6]
      };
    }
    return null;
  } catch (error) {
    console.error("Error obteniendo vela actual:", error);
    return null;
  }
};

// Calcular PNL en base al precio actual y la apuesta
const calculatePnL = (bet: Bet, currentPrice: number): { pnl: number, pnlPercent: number } => {
  if (!bet.initialPrice) return { pnl: 0, pnlPercent: 0 };

  // Calcular diferencia de precio
  const priceDiff = currentPrice - bet.initialPrice;
  
  // PNL en base a dirección y apalancamiento
  let pnl = 0;
  if (bet.direction === "up") {
    // Posición larga: ganamos si el precio sube
    pnl = bet.amount * (priceDiff / bet.initialPrice) * bet.leverage;
  } else {
    // Posición corta: ganamos si el precio baja
    pnl = bet.amount * (-priceDiff / bet.initialPrice) * bet.leverage;
  }
  
  // Calcular porcentaje de PNL respecto a la inversión
  const pnlPercent = (pnl / bet.amount) * 100;
  
  return { pnl, pnlPercent };
};

export const useBettingStore = create<BettingStore>()(
  persist(
    (set, get) => ({
      balance: 1000000, // Initial balance
      bets: [],

      placeBet: async (bet: Bet) => {
        // Obtener precio de apertura real desde Binance
        let openPrice = null;
        try {
          // Intentar obtener el precio de la vela actual
          const candle = await getCurrentCandle(bet.symbol);
          if (candle) {
            openPrice = candle.open;
          } else {
            // Si no podemos obtener la vela, usar el precio actual
            openPrice = await getCurrentPrice(bet.symbol);
          }
        } catch (error) {
          console.error("Error obteniendo precio de apertura real:", error);
          // Intentar una segunda vez con solo el precio actual
          try {
            openPrice = await getCurrentPrice(bet.symbol);
          } catch (secondError) {
            console.error("Error en segundo intento:", secondError);
          }
        }
        
        // Si no pudimos obtener el precio real, usar un precio simulado
        // Esto permite que la apuesta funcione incluso sin conexión a Binance
        if (!openPrice) {
          console.log("Usando precio simulado para la apuesta");
          openPrice = 30000 + Math.random() * 2000; // Precio simulado entre 30000-32000
          
          toast({
            title: "Advertencia",
            description: "Usando precio simulado para la apuesta. La conexión a datos reales no está disponible.",
            variant: "default"
          });
        }
        
        // Calcular el PNL potencial basado en el apalancamiento
        const potentialProfitRate = 0.95 * bet.leverage; // 95% del apalancamiento para considerar fees
        const potentialProfit = bet.amount * potentialProfitRate;
        
        // Obtener tiempo de vela actual (redondeado al minuto)
        const candleTime = Math.floor(Date.now() / 60000) * 60000;
        
        // Crear la apuesta con datos reales
        const enhancedBet = {
          ...bet,
          initialPrice: openPrice,
          candleTime,
          potentialProfit,
          currentPnL: 0,
          currentPnLPercent: 0,
          lastUpdatedPrice: openPrice
        };
        
        // IMPORTANTE: Usar reemplazo completo del array para forzar actualización de UI
        const currentBets = [...get().bets];
        set((state) => ({
          balance: state.balance - bet.amount,
          bets: [enhancedBet, ...currentBets]
        }));
        
        // Mostrar confirmación con precio real
        toast({
          title: `Apuesta ${bet.direction === "up" ? "TORO" : "OSO"} colocada`,
          description: `Precio de apertura: $${openPrice.toFixed(2)} - Monto: ${bet.amount.toLocaleString()} - ${bet.leverage}x`,
          variant: "default"
        });
        
        // Disparar evento para actualizar gráfico
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(CHART_EVENT));
        }
        
        // Guardar explícitamente en localStorage para asegurar persistencia
        try {
          const allState = get();
          localStorage.setItem("betting-store", JSON.stringify({
            state: allState,
            version: 0
          }));
        } catch (e) {
          console.error("Error guardando estado:", e);
        }
      },

      resolveBet: async (id: string, won: boolean) => {
        const state = get();
        // Encontrar la apuesta a resolver
        const betToResolve = state.bets.find(b => b.id === id);
        if (!betToResolve) return;
        
        // Obtener precio de cierre real
        let closePrice = null;
        try {
          // Intentar obtener el precio actual
          closePrice = await getCurrentPrice(betToResolve.symbol);
        } catch (error) {
          console.error("Error obteniendo precio de cierre real:", error);
        }
        
        // Si no podemos obtener el precio de cierre, usar el último precio actualizado
        if (!closePrice && betToResolve.lastUpdatedPrice) {
          closePrice = betToResolve.lastUpdatedPrice;
        }
        
        // Actualizar la apuesta con el precio final
        const updatedBets = state.bets.map(bet => {
          if (bet.id === id) {
            const updatedBet = {
              ...bet,
              status: won ? "won" as const : "lost" as const,
              finalPrice: closePrice
            };
            
            // Calcular PNL final basado en precios reales si tenemos los datos
            if (updatedBet.initialPrice && closePrice) {
              const priceDiff = closePrice - updatedBet.initialPrice;
              const pnlMultiplier = updatedBet.direction === "up" ? 1 : -1;
              const finalPnL = updatedBet.amount * (priceDiff / updatedBet.initialPrice) * updatedBet.leverage * pnlMultiplier;
              
              updatedBet.currentPnL = won ? Math.abs(finalPnL) : -updatedBet.amount;
              updatedBet.currentPnLPercent = (updatedBet.currentPnL / updatedBet.amount) * 100;
            }
            
            return updatedBet;
          }
          return bet;
        });
        
        // Calcular balance actualizado
        let newBalance = state.balance;
        if (betToResolve && won) {
          newBalance += betToResolve.amount + betToResolve.potentialProfit;
        }
        
        // Actualizar el estado de forma síncrona
        set({
          balance: newBalance,
          bets: updatedBets
        });
        
        // Mostrar notificación con detalles reales
        if (betToResolve.initialPrice && closePrice) {
          const priceDiff = closePrice - betToResolve.initialPrice;
          const percentChange = (priceDiff / betToResolve.initialPrice * 100).toFixed(2);
          
          toast({
            title: won ? "¡Apuesta ganada! 🎉" : "Apuesta perdida",
            description: `${betToResolve.direction === "up" ? "Toro" : "Oso"} ${betToResolve.amount.toLocaleString()} - ${
              won ? `+${betToResolve.potentialProfit.toLocaleString()}` : `-${betToResolve.amount.toLocaleString()}`
            }. Cambio: ${priceDiff >= 0 ? "+" : ""}${priceDiff.toFixed(2)} (${percentChange}%)`,
            variant: won ? "default" : "destructive",
          });
        }
        
        // Disparar evento para actualizar gráfico
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(CHART_EVENT));
        }
      },
        
      deleteBet: (id: string) =>
        set((state) => {
          // Encontrar apuesta para posible reembolso
          const betToDelete = state.bets.find(b => b.id === id);
          let newBalance = state.balance;
          
          // Solo reembolsar si la apuesta está pendiente
          if (betToDelete && betToDelete.status === "pending") {
            newBalance += betToDelete.amount;
          }
          
          const updatedBets = state.bets.filter(bet => bet.id !== id);
          
          // Mostrar notificación
          toast({
            title: "Apuesta eliminada",
            description: betToDelete?.status === "pending" 
              ? `Se han reembolsado ${betToDelete.amount.toLocaleString()} a tu balance`
              : "Se ha eliminado la apuesta del historial",
            variant: "default"
          });
          
          // Actualizar gráfico para eliminar marcador
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent(CHART_EVENT));
            }, 100);
          }
          
          return {
            balance: newBalance,
            bets: updatedBets
          };
        }),

      resetBalance: () => set({ balance: 1000000 }),

      clearBets: () => set({ bets: [] }),
      
      // Función para actualizar el PNL de una apuesta específica
      updateBetPnL: (betId: string, currentPrice: number) =>
        set((state) => {
          // Actualizar el PNL de una apuesta específica
          const updatedBets = state.bets.map(bet => {
            if (bet.id === betId && bet.status === "pending" && bet.initialPrice) {
              // Calcular PNL actual
              const { pnl, pnlPercent } = calculatePnL(bet, currentPrice);
              
              return {
                ...bet,
                currentPnL: pnl,
                currentPnLPercent: pnlPercent,
                lastUpdatedPrice: currentPrice
              };
            }
            return bet;
          });
          
          return {
            ...state,
            bets: updatedBets
          };
        }),
      
      // Función para actualizar el PNL de todas las apuestas pendientes
      updateAllBetsPnL: (currentPrice: number) =>
        set((state) => {
          // Actualizar el PNL de todas las apuestas pendientes
          const updatedBets = state.bets.map(bet => {
            if (bet.status === "pending" && bet.initialPrice) {
              // Calcular PNL actual
              const { pnl, pnlPercent } = calculatePnL(bet, currentPrice);
              
              return {
                ...bet,
                currentPnL: pnl,
                currentPnLPercent: pnlPercent,
                lastUpdatedPrice: currentPrice
              };
            }
            return bet;
          });
          
          return {
            ...state,
            bets: updatedBets
          };
        }),
    }),
    {
      name: "candle-rush-storage",
    },
  ),
)

// Auto-resolver apuestas pendientes después de un retraso (para fines de demostración)
if (typeof window !== "undefined") {
  setInterval(async () => {
    const store = useBettingStore.getState();
    const pendingBets = store.bets.filter(bet => bet.status === "pending");
    
    // Actualizar PNL de todas las apuestas pendientes
    try {
      const currentPrice = await getCurrentPrice("BTCUSDT");
      if (currentPrice) {
        store.updateAllBetsPnL(currentPrice);
      }
    } catch (error) {
      console.error("Error actualizando PNL:", error);
    }

    // Resolver apuestas antiguas
    pendingBets.forEach(bet => {
      // Solo resolver apuestas que tengan al menos 60 segundos
      const betTime = new Date(bet.timestamp).getTime();
      const now = Date.now();

      if (now - betTime >= 60000) {
        // Obtener precio actual para determinar resultado
        getCurrentPrice(bet.symbol)
          .then(currentPrice => {
            if (currentPrice && bet.initialPrice) {
              // Determinar si gana o pierde basado en dirección y precios reales
              const priceDiff = currentPrice - bet.initialPrice;
              const won = (bet.direction === "up" && priceDiff > 0) || 
                       (bet.direction === "down" && priceDiff < 0);
              
              // Resolver la apuesta con el resultado real
              store.resolveBet(bet.id, won);
            }
          })
          .catch(err => {
            console.error("Error al resolver apuesta:", err);
          });
      }
    });
  }, 3000); // Actualizar cada 3 segundos
}

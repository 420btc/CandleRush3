"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowDown, ArrowUp } from "lucide-react"
import { fetchBinanceLiquidations } from "@/lib/binance-api"

type Liquidation = {
  symbol: string
  price: number
  quantity: number
  side: "buy" | "sell"
  timestamp: string
}

export default function LiquidationsPanel() {
  const [liquidations, setLiquidations] = useState<Liquidation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadLiquidations = async () => {
      setIsLoading(true)
      try {
        const data = await fetchBinanceLiquidations()
        if (data && data.length > 0) {
          setLiquidations(data)
        } else {
          // Fallback to mock data if the API returns empty data
          setLiquidations(generateMockLiquidations())
        }
      } catch (error) {
        console.error("Failed to fetch liquidations:", error)
        // Use mock data as fallback
        setLiquidations(generateMockLiquidations())
      } finally {
        setIsLoading(false)
      }
    }

    loadLiquidations()
    const interval = setInterval(loadLiquidations, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const generateMockLiquidations = (): Liquidation[] => {
    const symbols = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT"]
    const now = new Date()

    // Generate more realistic prices for each symbol
    const prices = {
      "BTC/USDT": 30000 + Math.random() * 2000,
      "ETH/USDT": 1800 + Math.random() * 200,
      "SOL/USDT": 100 + Math.random() * 20,
      "BNB/USDT": 300 + Math.random() * 30,
      "XRP/USDT": 0.5 + Math.random() * 0.1,
    }

    return Array.from({ length: 20 }, (_, i) => {
      const timestamp = new Date(now.getTime() - i * 60000) // Each 1 minute apart
      const symbol = symbols[Math.floor(Math.random() * symbols.length)]
      return {
        symbol: symbol,
        price: prices[symbol as keyof typeof prices],
        quantity: Math.random() * 10,
        side: Math.random() > 0.5 ? "buy" : "sell",
        timestamp: timestamp.toISOString(),
      }
    })
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  return (
    <Card className="h-full border-blue-900 bg-gray-900">
      <CardContent className="p-0 h-full flex flex-col">
        <div className="border-b border-blue-900 bg-gray-800 bg-opacity-50 p-3">
          <h3 className="text-lg font-bold text-white">Recent Liquidations</h3>
        </div>

        {isLoading ? (
          <div className="flex flex-grow items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="custom-scrollbar overflow-y-auto flex-grow p-2">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-gray-900 text-left text-xs text-gray-400">
                <tr>
                  <th className="p-2">Time</th>
                  <th className="p-2">Symbol</th>
                  <th className="p-2">Price</th>
                  <th className="p-2">Quantity</th>
                  <th className="p-2">Side</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-sm text-white">
                {liquidations.map((liq, index) => (
                  <tr key={index} className="hover:bg-gray-800">
                    <td className="p-2 text-gray-400">{formatTime(liq.timestamp)}</td>
                    <td className="p-2">{liq.symbol}</td>
                    <td className="p-2">${liq.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td className="p-2">{liq.quantity.toFixed(4)}</td>
                    <td className="p-2">
                      {liq.side === "buy" ? (
                        <span className="flex items-center text-green-500">
                          <ArrowUp className="mr-1 h-3 w-3" /> Long
                        </span>
                      ) : (
                        <span className="flex items-center text-red-500">
                          <ArrowDown className="mr-1 h-3 w-3" /> Short
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

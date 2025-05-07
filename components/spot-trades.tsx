"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowDown, ArrowUp } from "lucide-react"
import { fetchBinanceSpotTrades } from "@/lib/binance-api"

type SpotTrade = {
  symbol: string
  price: number
  quantity: number
  side: "buy" | "sell"
  timestamp: string
}

export default function SpotTrades() {
  const [trades, setTrades] = useState<SpotTrade[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadTrades = async () => {
      setIsLoading(true)
      try {
        const data = await fetchBinanceSpotTrades()
        if (data && data.length > 0) {
          setTrades(data)
        } else {
          // Fallback to mock data if the API returns empty data
          setTrades(generateMockTrades())
        }
      } catch (error) {
        console.error("Failed to fetch spot trades:", error)
        // Use mock data as fallback
        setTrades(generateMockTrades())
      } finally {
        setIsLoading(false)
      }
    }

    loadTrades()
    const interval = setInterval(loadTrades, 10000) // Refresh every 10 seconds

    return () => clearInterval(interval)
  }, [])

  const generateMockTrades = (): SpotTrade[] => {
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
      const timestamp = new Date(now.getTime() - i * 30000) // Each 30 seconds apart
      const symbol = symbols[Math.floor(Math.random() * symbols.length)]
      return {
        symbol: symbol,
        price: prices[symbol as keyof typeof prices],
        quantity: Math.random() * 5,
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
      <CardContent className="p-0">
        <div className="border-b border-blue-900 bg-gray-800 bg-opacity-50 p-3">
          <h3 className="text-lg font-bold text-white">Recent Spot Trades</h3>
        </div>

        {isLoading ? (
          <div className="flex h-[550px] items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="custom-scrollbar max-h-[550px] overflow-y-auto p-2">
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
                {trades.map((trade, index) => (
                  <tr key={index} className="hover:bg-gray-800">
                    <td className="p-2 text-gray-400">{formatTime(trade.timestamp)}</td>
                    <td className="p-2">{trade.symbol}</td>
                    <td className="p-2">${trade.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td className="p-2">{trade.quantity.toFixed(4)}</td>
                    <td className="p-2">
                      {trade.side === "buy" ? (
                        <span className="flex items-center text-green-500">
                          <ArrowUp className="mr-1 h-3 w-3" /> Buy
                        </span>
                      ) : (
                        <span className="flex items-center text-red-500">
                          <ArrowDown className="mr-1 h-3 w-3" /> Sell
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

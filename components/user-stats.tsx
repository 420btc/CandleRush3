"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useBettingStore } from "@/lib/betting-store"
import { useEffect, useState } from "react"

export default function UserStats() {
  const { bets, balance } = useBettingStore()
  const [chartData, setChartData] = useState<any[]>([])

  // Calculate stats
  const totalBets = bets.length
  const completedBets = bets.filter((bet) => bet.status !== "pending")
  const wonBets = bets.filter((bet) => bet.status === "won").length
  const lostBets = bets.filter((bet) => bet.status === "lost").length
  const pendingBets = bets.filter((bet) => bet.status === "pending").length
  const winRate = completedBets.length > 0 ? (wonBets / completedBets.length) * 100 : 0

  // Calculate profit/loss
  const totalWon = bets.filter((bet) => bet.status === "won").reduce((sum, bet) => sum + bet.potentialProfit, 0)

  const totalLost = bets.filter((bet) => bet.status === "lost").reduce((sum, bet) => sum + bet.amount, 0)

  const netProfit = totalWon - totalLost

  useEffect(() => {
    // Generate chart data based on actual bets
    const generateChartData = () => {
      // Group bets by day
      const betsByDay = new Map<string, { won: number; lost: number }>()

      // Get the last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        return date.toISOString().split("T")[0]
      }).reverse()

      // Initialize all days with zero values
      last7Days.forEach((day) => {
        betsByDay.set(day, { won: 0, lost: 0 })
      })

      // Count won and lost bets by day
      bets.forEach((bet) => {
        if (bet.status === "pending") return

        const day = new Date(bet.timestamp).toISOString().split("T")[0]
        if (betsByDay.has(day)) {
          const dayData = betsByDay.get(day)!
          if (bet.status === "won") {
            dayData.won += 1
          } else {
            dayData.lost += 1
          }
          betsByDay.set(day, dayData)
        }
      })

      // Convert to chart data format
      return last7Days.map((day) => ({
        day: day.slice(5), // MM-DD format
        won: betsByDay.get(day)?.won || 0,
        lost: betsByDay.get(day)?.lost || 0,
      }))
    }

    setChartData(generateChartData())
  }, [bets])

  return (
    <Card className="h-full border-blue-900 bg-gray-900">
      <CardContent className="p-0 h-full flex flex-col">
        <div className="border-b border-blue-900 bg-gray-800 bg-opacity-50 p-3">
          <h3 className="text-lg font-bold text-white">User Statistics</h3>
        </div>

        <div className="custom-scrollbar overflow-y-auto p-4 flex-grow">
          <div className="mb-4 grid grid-cols-4 gap-2">
            <div className="rounded bg-blue-900 bg-opacity-30 p-2 text-center">
              <p className="text-xs text-gray-400">Total Bets</p>
              <p className="text-xl font-bold text-white">{totalBets}</p>
            </div>
            <div className="rounded bg-green-900 bg-opacity-30 p-2 text-center">
              <p className="text-xs text-gray-400">Win Rate</p>
              <p className="text-xl font-bold text-green-400">{winRate.toFixed(1)}%</p>
            </div>
            <div className="rounded bg-yellow-900 bg-opacity-30 p-2 text-center">
              <p className="text-xs text-gray-400">Balance</p>
              <p className="text-xl font-bold text-yellow-400">{balance.toLocaleString()}</p>
            </div>
            <div className="rounded bg-blue-900 bg-opacity-30 p-2 text-center">
              <p className="text-xs text-gray-400">Net Profit</p>
              <p className={`text-xl font-bold ${netProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                {netProfit >= 0 ? "+" : ""}
                {netProfit.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="mb-2 text-sm font-medium text-gray-400">Performance (Last 7 Days)</h4>
            <div className="rounded border border-gray-800 bg-gray-800 bg-opacity-30 p-2">
              <ChartContainer
                config={{
                  won: {
                    label: "Won",
                    color: "hsl(var(--chart-1))",
                  },
                  lost: {
                    label: "Lost",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[200px]"
              >
                <BarChart accessibilityLayer data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="day" tickLine={false} tickMargin={10} axisLine={false} />
                  <YAxis tickLine={false} tickMargin={10} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
                  <Bar dataKey="won" fill="var(--color-won)" radius={4} />
                  <Bar dataKey="lost" fill="var(--color-lost)" radius={4} />
                </BarChart>
              </ChartContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded bg-gray-800 p-2">
              <p className="text-xs text-gray-400">Won Bets</p>
              <p className="text-lg font-bold text-green-400">{wonBets}</p>
            </div>
            <div className="rounded bg-gray-800 p-2">
              <p className="text-xs text-gray-400">Lost Bets</p>
              <p className="text-lg font-bold text-red-400">{lostBets}</p>
            </div>
            <div className="rounded bg-gray-800 p-2">
              <p className="text-xs text-gray-400">Pending Bets</p>
              <p className="text-lg font-bold text-yellow-400">{pendingBets}</p>
            </div>
            <div className="rounded bg-gray-800 p-2">
              <p className="text-xs text-gray-400">Total Won</p>
              <p className="text-lg font-bold text-green-400">{totalWon.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

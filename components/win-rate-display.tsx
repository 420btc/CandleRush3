"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useBettingStore } from "@/lib/betting-store"
import { useEffect, useState } from "react"
import { CircularProgressbar, buildStyles } from "react-circular-progressbar"
import "react-circular-progressbar/dist/styles.css"

export default function WinRateDisplay() {
  const { bets } = useBettingStore()
  const [winRate, setWinRate] = useState(0)
  const [totalBets, setTotalBets] = useState(0)
  const [wonBets, setWonBets] = useState(0)
  const [lostBets, setLostBets] = useState(0)

  useEffect(() => {
    // Calculate win rate
    const completedBets = bets.filter((bet) => bet.status !== "pending")
    setTotalBets(completedBets.length)

    const won = completedBets.filter((bet) => bet.status === "won").length
    setWonBets(won)

    const lost = completedBets.filter((bet) => bet.status === "lost").length
    setLostBets(lost)

    const rate = completedBets.length > 0 ? (won / completedBets.length) * 100 : 0
    setWinRate(rate)
  }, [bets])

  // Determine color based on win rate
  const getColor = () => {
    if (winRate >= 60) return "#10b981" // Green for good win rate
    if (winRate >= 45) return "#f59e0b" // Yellow for average win rate
    return "#ef4444" // Red for poor win rate
  }

  return (
    <Card className="h-full border-blue-900 bg-gray-900">
      <CardContent className="p-0 h-full flex flex-col">
        <div className="border-b border-blue-900 bg-gray-800 bg-opacity-50 p-1">
          <h3 className="text-base font-bold text-white">Win Rate</h3>
        </div>

        <div className="flex flex-col items-center justify-center p-1 flex-grow">
          <div className="w-24 h-24 mb-1">
            <CircularProgressbar
              value={winRate}
              text={`${winRate.toFixed(1)}%`}
              styles={buildStyles({
                textSize: "16px",
                pathColor: getColor(),
                textColor: getColor(),
                trailColor: "#1e293b",
              })}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 w-full">
            <div className="rounded bg-green-900 bg-opacity-30 p-1 text-center">
              <p className="text-xs text-gray-400">Won</p>
              <p className="text-lg font-bold text-green-400">{wonBets}</p>
            </div>
            <div className="rounded bg-red-900 bg-opacity-30 p-1 text-center">
              <p className="text-xs text-gray-400">Lost</p>
              <p className="text-lg font-bold text-red-400">{lostBets}</p>
            </div>
          </div>

          <div className="mt-1 text-center">
            <p className="text-xs text-gray-400">Total Completed Bets</p>
            <p className="text-base font-bold text-white">{totalBets}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

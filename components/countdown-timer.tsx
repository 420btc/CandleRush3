"use client"

import { useEffect, useState } from "react"

interface CountdownTimerProps {
  isBettingOpen: boolean
  timeUntilNextCandle: number
}

export default function CountdownTimer({ isBettingOpen, timeUntilNextCandle }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)

  useEffect(() => {
    if (isBettingOpen) {
      // If betting is open, count down from 10 seconds
      setTimeLeft(10 - (60 - timeUntilNextCandle))
    } else {
      // If betting is closed, show time until next betting window
      setTimeLeft(timeUntilNextCandle)
    }
  }, [isBettingOpen, timeUntilNextCandle])

  return (
    <div className="mb-4 flex justify-center">
      <div
        className={`rounded-lg px-6 py-3 text-center ${
          isBettingOpen ? "bg-green-900 bg-opacity-30 text-green-400" : "bg-blue-900 bg-opacity-30 text-blue-400"
        }`}
      >
        <div className="text-xs uppercase tracking-wider">
          {isBettingOpen ? "Betting Window Closes In" : "Next Betting Window In"}
        </div>
        <div className="text-3xl font-bold">{timeLeft}s</div>
      </div>
    </div>
  )
}

"use client"

import type { Bet } from "./betting-store"

// Function to determine if a bet is won based on opening and closing prices
export function resolveBet(bet: Bet, openPrice: number, closePrice: number): boolean {
  if (bet.direction === "up") {
    return closePrice > openPrice
  } else {
    return closePrice < openPrice
  }
}

// Calculate potential profit based on bet amount and leverage
export function calculatePotentialProfit(amount: number, leverage: number): number {
  // 95% payout for simplicity (5% fee)
  return amount * leverage * 0.95
}

// Calculate risk based on bet amount and leverage
export function calculateRisk(amount: number, leverage: number): number {
  return amount * leverage
}

// Calculate win rate from bet history
export function calculateWinRate(bets: Bet[]): number {
  const completedBets = bets.filter((bet) => bet.status !== "pending")
  if (completedBets.length === 0) return 0

  const wonBets = completedBets.filter((bet) => bet.status === "won")
  return (wonBets.length / completedBets.length) * 100
}

// Calculate net profit from bet history
export function calculateNetProfit(bets: Bet[]): number {
  const totalWon = bets.filter((bet) => bet.status === "won").reduce((sum, bet) => sum + bet.potentialProfit, 0)

  const totalLost = bets.filter((bet) => bet.status === "lost").reduce((sum, bet) => sum + bet.amount, 0)

  return totalWon - totalLost
}

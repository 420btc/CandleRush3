"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TradingChart from "@/components/trading-chart"
import BettingPanel from "@/components/betting-panel"
import LiquidationsPanel from "@/components/liquidations-panel"
import BetHistory from "@/components/bet-history"
import UserStats from "@/components/user-stats"
import SpotTrades from "@/components/spot-trades"
import Profile from "@/components/profile"
import WinRateDisplay from "@/components/win-rate-display"
import MiniChart from "@/components/mini-chart"
import { useBettingStore } from "@/lib/betting-store"

export default function Home() {
  const { balance } = useBettingStore()
  return (
    <main className="min-h-screen bg-black text-white overflow-y-auto">
      <div className="container mx-auto p-1 pb-2">
        <header className="mb-1 flex items-center justify-between rounded-lg bg-gradient-to-r from-blue-900 to-black p-2 shadow-lg">
          <h1 className="text-xl font-bold text-yellow-400 md:text-2xl">
            Candle Rush <span className="text-blue-500">3</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-blue-900 px-4 py-1 text-yellow-400 shadow-md border border-blue-800">
              <span className="font-bold">{balance.toLocaleString()}</span> FAKE
            </div>
            <button className="rounded-full bg-blue-600 px-4 py-1 font-medium text-white hover:bg-blue-700 shadow-md">
              Profile
            </button>
          </div>
        </header>

        {/* Main content area */}
        <div className="grid grid-cols-1 gap-1 lg:grid-cols-4">
          {/* Main trading chart - takes up most of the space */}
          <div className="lg:col-span-3 h-[calc(100vh-160px)]">
            <TradingChart />
          </div>

          {/* Right control console with stacked panels */}
          <div className="lg:col-span-1 flex flex-col gap-1 h-[calc(100vh-160px)]">
            {/* Betting panel */}
            <div className="h-[33%]">
              <BettingPanel />
            </div>
            
            {/* Win rate display */}
            <div className="h-[33%]">
              <WinRateDisplay />
            </div>
            
            {/* Mini chart */}
            <div className="h-[34%]">
              <MiniChart />
            </div>
          </div>
        </div>
        
        {/* Bottom panel with tabs */}
        <div className="mt-1">
          <Tabs defaultValue="liquidations" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-gray-800">
              <TabsTrigger value="liquidations" className="data-[state=active]:bg-blue-900 text-xs">
                Liquidations
              </TabsTrigger>
              <TabsTrigger value="bets" className="data-[state=active]:bg-blue-900 text-xs">
                Bets
              </TabsTrigger>
              <TabsTrigger value="stats" className="data-[state=active]:bg-blue-900 text-xs">
                Stats
              </TabsTrigger>
              <TabsTrigger value="spot" className="data-[state=active]:bg-blue-900 text-xs">
                Spot
              </TabsTrigger>
              <TabsTrigger value="profile" className="data-[state=active]:bg-blue-900 text-xs">
                Profile
              </TabsTrigger>
            </TabsList>
            <TabsContent value="liquidations" className="h-[300px] overflow-hidden">
              <LiquidationsPanel />
            </TabsContent>
            <TabsContent value="bets" className="h-[300px] overflow-hidden">
              <BetHistory />
            </TabsContent>
            <TabsContent value="stats" className="h-[300px] overflow-hidden">
              <UserStats />
            </TabsContent>
            <TabsContent value="spot" className="h-[300px] overflow-hidden">
              <SpotTrades />
            </TabsContent>
            <TabsContent value="profile" className="h-[300px] overflow-hidden">
              <Profile />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  )
}

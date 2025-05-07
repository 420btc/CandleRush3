"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useBettingStore } from "@/lib/betting-store"

export default function Profile() {
  const { balance, resetBalance, clearBets } = useBettingStore()

  return (
    <Card className="h-full border-blue-900 bg-gray-900">
      <CardContent className="p-0">
        <div className="border-b border-blue-900 bg-gray-800 bg-opacity-50 p-3">
          <h3 className="text-lg font-bold text-white">User Profile</h3>
        </div>

        <div className="custom-scrollbar max-h-[550px] overflow-y-auto p-4">
          <div className="mb-4 rounded bg-blue-900 bg-opacity-20 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-gray-400">Current Balance:</span>
              <span className="text-xl font-bold text-yellow-400">{balance.toLocaleString()} FAKE</span>
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="border-yellow-600 text-yellow-400 hover:bg-yellow-900 hover:bg-opacity-20"
                onClick={resetBalance}
              >
                Reset Balance
              </Button>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="mb-2 text-sm font-medium text-gray-400">Game Settings</h4>
            <div className="space-y-3 rounded bg-gray-800 p-3">
              <div className="flex items-center justify-between">
                <span>Sound Effects</span>
                <div className="relative h-6 w-12 cursor-pointer rounded-full bg-blue-900">
                  <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-blue-500"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Notifications</span>
                <div className="relative h-6 w-12 cursor-pointer rounded-full bg-gray-700">
                  <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-gray-400"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Auto-bet</span>
                <div className="relative h-6 w-12 cursor-pointer rounded-full bg-gray-700">
                  <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-gray-400"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full border-blue-600 text-blue-400 hover:bg-blue-900 hover:bg-opacity-20"
            >
              Export Bet History
            </Button>
            <Button
              variant="outline"
              className="w-full border-red-600 text-red-400 hover:bg-red-900 hover:bg-opacity-20"
              onClick={clearBets}
            >
              Clear Bet History
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

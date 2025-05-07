"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader } from "lucide-react"

declare global {
  interface Window {
    TradingView: any
  }
}

export default function MiniChart() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const tvWidgetRef = useRef<any>(null)

  useEffect(() => {
    // Check if TradingView script is already loaded
    if (window.TradingView) {
      initializeWidget()
    } else {
      // If not loaded yet, wait for the main chart to load it
      const checkInterval = setInterval(() => {
        if (window.TradingView) {
          clearInterval(checkInterval)
          initializeWidget()
        }
      }, 500)

      return () => clearInterval(checkInterval)
    }
  }, [])

  const initializeWidget = () => {
    if (!containerRef.current || !window.TradingView) return

    setIsLoading(true)

    const widget = new window.TradingView.widget({
      container_id: "mini-tradingview-widget",
      autosize: true,
      width: "100%",
      height: "100%",
      symbol: "BINANCE:BTCUSDT",
      interval: "15", // Use a different timeframe than the main chart
      timezone: "exchange",
      theme: "dark",
      style: "1",
      toolbar_bg: "#000000",
      enable_publishing: false,
      hide_top_toolbar: true,
      hide_side_toolbar: true,
      allow_symbol_change: false,
      save_image: false,
      studies: ["RSI@tv-basicstudies"], // Only show RSI for simplicity
      locale: "en",
      disabled_features: [
        "use_localstorage_for_settings",
        "header_widget",
        "left_toolbar",
        "context_menus",
        "control_bar",
        "timeframes_toolbar",
      ],
      enabled_features: [],
      overrides: {
        // Standard red and green candles
        "mainSeriesProperties.candleStyle.upColor": "#26a69a",
        "mainSeriesProperties.candleStyle.downColor": "#ef5350",
        "mainSeriesProperties.candleStyle.borderUpColor": "#26a69a",
        "mainSeriesProperties.candleStyle.borderDownColor": "#ef5350",
        "mainSeriesProperties.candleStyle.wickUpColor": "#26a69a",
        "mainSeriesProperties.candleStyle.wickDownColor": "#ef5350",
      },
      loading_screen: { backgroundColor: "#000000", foregroundColor: "#0066ff" },
    })

    tvWidgetRef.current = widget

    // Wait for the widget to be ready
    widget.onChartReady(() => {
      setIsLoading(false)
    })
  }

  return (
    <Card className="h-full border-blue-900 bg-gray-900">
      <CardContent className="p-0 h-full flex flex-col">
        <div className="border-b border-blue-900 bg-gray-800 bg-opacity-50 p-1">
          <h3 className="text-base font-bold text-white">BTC/USDT (15m)</h3>
        </div>

        <div className="relative w-full flex-grow">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <Loader className="h-5 w-5 animate-spin text-blue-500" />
            </div>
          )}
          <div id="mini-tradingview-widget" ref={containerRef} className="h-full w-full"></div>
        </div>
      </CardContent>
    </Card>
  )
}

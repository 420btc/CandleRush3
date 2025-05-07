import { fetchCandleData } from "@/lib/binance-api"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol") || "BTCUSDT"
  const interval = searchParams.get("interval") || "1m"
  const limit = Number.parseInt(searchParams.get("limit") || "100")

  try {
    const data = await fetchCandleData(symbol, interval, limit)
    return Response.json({ data })
  } catch (error) {
    console.error("Error fetching candle data:", error)
    return Response.json({ error: "Failed to fetch candle data" }, { status: 500 })
  }
}

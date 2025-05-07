import { fetchCurrentPrice } from "@/lib/binance-api"

export async function GET() {
  try {
    const priceData = await fetchCurrentPrice()
    return Response.json(priceData)
  } catch (error) {
    console.error("Error fetching price:", error)
    // Retornar un error más claro si no se pueden obtener datos reales
    return Response.json({ 
      error: "No se pudieron obtener datos reales de precio. Por favor, inténtelo más tarde.",
      isReal: false,
      timestamp: new Date().toISOString()
    }, { status: 503 }) // 503 Service Unavailable
  }
}

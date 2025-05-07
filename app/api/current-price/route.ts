import { fetchCurrentPrice } from "@/lib/binance-api"

export async function GET() {
  try {
    const priceData = await fetchCurrentPrice()
    return Response.json(priceData)
  } catch (error) {
    console.error("Error fetching price:", error)
    
    // Proporcionar un precio simulado como respaldo
    const simulatedPrice = 60000 + (Math.random() * 2000 - 1000)
    
    // Retornar datos simulados pero con una marca clara
    return Response.json({ 
      price: simulatedPrice,
      previousPrice: simulatedPrice * 0.98,
      change: simulatedPrice * 0.02,
      changePercent: 2.0,
      timestamp: new Date().toISOString(),
      isReal: false,
      simulatedData: true,
      error: "Se está utilizando un precio simulado. Por favor, inténtelo más tarde."
    }, { status: 200 }) // Devolver 200 para que la UI funcione
  }
}

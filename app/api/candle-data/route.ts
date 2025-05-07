import { fetchCandleData } from "@/lib/binance-api"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol") || "BTCUSDT"
  const interval = searchParams.get("interval") || "1m"
  const limit = Number.parseInt(searchParams.get("limit") || "100")

  try {
    const data = await fetchCandleData(symbol, interval, limit)
    return Response.json({ data, isReal: true })
  } catch (error) {
    console.error("Error fetching candle data:", error)
    
    // Generar datos simulados como respaldo
    const simulatedCandles = [];
    const now = Date.now();
    const basePrice = 60000 + (Math.random() * 5000 - 2500);
    
    // Crear velas simuladas para el período solicitado
    for (let i = 0; i < limit; i++) {
      const candleTime = now - ((limit - i) * getIntervalMs(interval));
      const volatility = basePrice * 0.005; // 0.5% de volatilidad
      
      // Generar movimiento de precio algo realista
      const open = basePrice + ((Math.random() * volatility * 2) - volatility);
      const close = open + ((Math.random() * volatility * 2) - volatility);
      const high = Math.max(open, close) + (Math.random() * volatility);
      const low = Math.min(open, close) - (Math.random() * volatility);
      const volume = Math.random() * 100;
      
      simulatedCandles.push({
        time: candleTime,
        open,
        high,
        low,
        close,
        volume,
        closeTime: candleTime + getIntervalMs(interval)
      });
    }
    
    return Response.json({ 
      data: simulatedCandles, 
      isReal: false,
      simulatedData: true,
      message: "Usando datos simulados porque no se pudo conectar con Binance"
    })
  }
}

// Función auxiliar para convertir intervalo en milisegundos
function getIntervalMs(interval: string): number {
  const unit = interval.charAt(interval.length - 1);
  const value = parseInt(interval.substring(0, interval.length - 1));
  
  switch (unit) {
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'w': return value * 7 * 24 * 60 * 60 * 1000;
    default: return 60 * 1000; // Por defecto 1 minuto
  }
}

"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp, Loader, Maximize2, Minimize2, Play, Pause } from "lucide-react"
import { useBettingStore } from "@/lib/betting-store"
import { Button } from "@/components/ui/button"
import BetMarker from "./bet-marker"

// Add a custom style for the glow effect
const shadowGlowStyle = {
  boxShadow: "0 0 10px rgba(0, 102, 255, 0.5)",
}

// Event name for chart update communication
const CHART_EVENT = "update-tradingview-markers";

declare global {
  interface Window {
    TradingView: any
  }
}

export default function TradingChart() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [priceChange, setPriceChange] = useState<number>(0)
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0)
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("")
  const [timeUntilNextCandle, setTimeUntilNextCandle] = useState<number>(0)
  const [candleOpen, setCandleOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [isRealData, setIsRealData] = useState<boolean>(true)
  const { bets } = useBettingStore()
  const tvWidgetRef = useRef<any>(null)
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const chartMarkersRef = useRef<Record<string, any>>({}) // Store chart shape IDs

  // Effect to listen for update events from betting panel
  useEffect(() => {
    const handleChartUpdate = () => {
      if (tvWidgetRef.current && tvWidgetRef.current._ready) {
        updateTradingViewMarkers();
      }
    };

    // Listen for chart update events
    window.addEventListener(CHART_EVENT, handleChartUpdate);

    return () => {
      window.removeEventListener(CHART_EVENT, handleChartUpdate);
    };
  }, [bets]);

  useEffect(() => {
    // Load TradingView widget script
    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/tv.js"
    script.async = true
    script.onload = initializeWidget
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  // Effect to update bet markers on TradingView chart
  useEffect(() => {
    if (tvWidgetRef.current && tvWidgetRef.current.chart) {
      // Check if chart is ready before trying to update markers
      if (tvWidgetRef.current._ready) {
        updateTradingViewMarkers();
      }
    }
  }, [bets]);

  useEffect(() => {
    // Handle candle timing and betting window
    const interval = setInterval(() => {
      const now = new Date()
      const secondsInCurrentMinute = now.getSeconds()
      const timeLeft = 60 - secondsInCurrentMinute
      setTimeUntilNextCandle(timeLeft)

      // Open betting window in the first 10 seconds of each minute
      setCandleOpen(secondsInCurrentMinute < 10)
    }, 1000)

    // Simplificado: Ya no necesitamos la API de Binance para el gráfico
    // TradingView ya proporciona sus propios datos de mercado
    // Solo mantenemos una actualización de estado local para la interfaz
    const simulatedPriceInterval = setInterval(() => {
      try {
        // Intentar obtener el precio de la API (opcional)
        fetch("/api/current-price")
          .then(response => response.json())
          .then(data => {
            if (data.error) {
              // Si hay error, usar datos simulados
              simulateLocalPrice();
              setIsRealData(false);
            } else if (data.price) {
              setCurrentPrice(data.price);
              setPriceChange(data.change);
              setPriceChangePercent(data.changePercent);
              setLastUpdateTime(data.timestamp);
              setIsRealData(data.isReal !== undefined ? data.isReal : true);
            }
          })
          .catch(() => {
            // En caso de error, simular datos localmente
            simulateLocalPrice();
            setIsRealData(false);
          });
      } catch (error) {
        simulateLocalPrice();
        setIsRealData(false);
      }
    }, 3000);

    // Función para simular precio localmente si la API falla
    const simulateLocalPrice = () => {
      if (currentPrice) {
        const volatility = 0.0002; // 0.02% volatilidad
        const randomChange = currentPrice * volatility * (Math.random() * 2 - 1);
        setCurrentPrice(prev => prev ? prev + randomChange : 30000);
        setPriceChange(randomChange);
        setPriceChangePercent(randomChange / (currentPrice || 30000) * 100);
        setLastUpdateTime(new Date().toISOString());
      } else {
        // Precio inicial si no hay ninguno
        setCurrentPrice(30000 + Math.random() * 1000);
      }
    };

    return () => {
      clearInterval(interval);
      clearInterval(simulatedPriceInterval);
    }
  }, [currentPrice]);

  const initializeWidget = () => {
    if (!containerRef.current || !window.TradingView) return

    setIsLoading(true)

    // Cargar configuración guardada del localStorage
    const savedConfig = localStorage.getItem('tradingview-chart-config');
    let chartConfig: { 
      symbol?: string; 
      interval?: string; 
      savedData?: any;
    } = {};
    
    // Si existe una configuración guardada, usarla
    if (savedConfig) {
      try {
        chartConfig = JSON.parse(savedConfig);
        console.log("Cargando configuración guardada del gráfico:", chartConfig);
      } catch (error) {
        console.error("Error al cargar la configuración guardada:", error);
      }
    }

    const widget = new window.TradingView.widget({
      container_id: "tradingview-widget",
      autosize: true,
      width: "100%",
      symbol: chartConfig.symbol || "BINANCE:BTCUSDT",
      interval: chartConfig.interval || "1",
      timezone: "exchange",
      theme: "dark",
      style: "1",
      toolbar_bg: "#000000",
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      save_image: false,
      studies: [
        "MAExp@tv-basicstudies", // EMA
        "MAExp@tv-basicstudies", // EMA
        "MAExp@tv-basicstudies", // EMA
        "MAExp@tv-basicstudies", // EMA
        "MACD@tv-basicstudies", // MACD
        "RSI@tv-basicstudies", // RSI
        "Volume@tv-basicstudies", // Volume (keep the existing one)
      ],
      locale: "es", // Cambiado a español
      drawings_access: { type: "black", tools: [{ name: "Regression Trend" }] },
      // Habilitar el uso del almacenamiento local para la configuración
      // disabled_features: ["use_localstorage_for_settings"],
      enabled_features: [
        "study_templates", 
        "save_chart_properties_to_local_storage"
      ],
      // Cargar configuración guardada si existe
      saved_data: chartConfig.savedData || null,
      // Configuración para guardar el estado
      client_id: "candle-rush-trading-app",
      user_id: "user_btc_trader",
      overrides: {
        // Configuración para tema negro completo
        "paneProperties.background": "#000000",
        "paneProperties.vertGridProperties.color": "#1E1E1E",
        "paneProperties.horzGridProperties.color": "#1E1E1E",
        "scalesProperties.backgroundColor": "#000000",
        "scalesProperties.lineColor": "#333333",
        "scalesProperties.textColor": "#AAA",
        "mainSeriesProperties.candleStyle.upColor": "#26a69a",
        "mainSeriesProperties.candleStyle.downColor": "#ef5350",
        "mainSeriesProperties.candleStyle.borderUpColor": "#26a69a",
        "mainSeriesProperties.candleStyle.borderDownColor": "#ef5350",
        "mainSeriesProperties.candleStyle.wickUpColor": "#26a69a",
        "mainSeriesProperties.candleStyle.wickDownColor": "#ef5350",
        "mainSeriesProperties.candleStyle.barColorsOnPrevClose": false,
        // Colores de los indicadores
        "chartProperties.paneProperties.backgroundType": "solid",
        "chartProperties.paneProperties.background": "#000000",
        "chartProperties.scalesProperties.backgroundColor": "#000000",
        "chartProperties.scalesProperties.lineColor": "#333333",
        "chartProperties.scalesProperties.textColor": "#AAA",
      },
      loading_screen: { backgroundColor: "#000000", foregroundColor: "#0066ff" },
      custom_css_url: "",
      // Activar auto guardado
      auto_save_delay: 5,
    })

    tvWidgetRef.current = widget

    // Wait for the widget to be ready
    widget.onChartReady(() => {
      console.log("TradingView widget está listo");
      
      // NO intentar cargar estudios del localStorage inicialmente
      // Vamos a aplicar forzadamente nuestras EMAs con los colores específicos
      
      // Limpiar cualquier estudio existente primero
      const allStudies = widget.chart().getAllStudies();
      if (allStudies && allStudies.length > 0) {
        allStudies.forEach((study: any) => {
          if (study && study.id) {
            try {
              widget.chart().removeStudy(study);
            } catch (e) {
              console.warn("Error al eliminar estudio:", e);
            }
          }
        });
      }
      
      // Esperar un momento para que se limpien los estudios
      setTimeout(() => {
        // Crear nuestros EMAs específicos de manera forzada
        createAndForceDefaultEMAs(widget);
        
        // Configurar un intervalo para guardar estudios regularmente
        // asegurándonos de que si el usuario los cambia, se restaurarán en la próxima carga
        const saveInterval = setInterval(() => {
          forcePreserveEMAs(widget);
        }, 10000); // cada 10 segundos
        
        // Limpiar intervalo al desmontar
        return () => {
          clearInterval(saveInterval);
        };
      }, 1000);
      
      // Initialize bet markers
      updateTradingViewMarkers();
      
      // Subscribe to chart range changes to update marker positions
      widget.chart().onVisibleRangeChanged().subscribe(null, () => {
        updateTradingViewMarkers();
      });
      
      // Also update after symbol or resolution change
      widget.chart().onIntervalChanged().subscribe(null, () => {
        updateTradingViewMarkers();
        
        // Guardar el nuevo intervalo
        try {
          const currentConfig = JSON.parse(localStorage.getItem('tradingview-chart-config') || '{}');
          currentConfig.interval = widget.chart().resolution();
          localStorage.setItem('tradingview-chart-config', JSON.stringify(currentConfig));
          
          // Forzar la preservación de EMAs después de cambiar el intervalo
          setTimeout(() => {
            forcePreserveEMAs(widget);
          }, 1000);
        } catch (error) {
          console.error("Error al guardar el nuevo intervalo:", error);
        }
      });
      
      // Guardar símbolo cuando cambie
      widget.chart().onSymbolChanged().subscribe(null, () => {
        try {
          const currentConfig = JSON.parse(localStorage.getItem('tradingview-chart-config') || '{}');
          currentConfig.symbol = widget.chart().symbol();
          localStorage.setItem('tradingview-chart-config', JSON.stringify(currentConfig));
          
          // Forzar la preservación de EMAs después de cambiar el símbolo
          setTimeout(() => {
            forcePreserveEMAs(widget);
          }, 1000);
        } catch (error) {
          console.error("Error al guardar el nuevo símbolo:", error);
        }
      });
      
      // Activar tema negro en todos los componentes
      applyDarkThemeToAllComponents(widget);
    });

    // Simulate initial price
    setCurrentPrice(30000 + Math.random() * 1000)
    setIsLoading(false)
  }
  
  // Función para aplicar tema oscuro a todos los componentes
  const applyDarkThemeToAllComponents = (widget: any) => {
    try {
      // Aplicar fondo negro a los diálogos y paneles
      const chartOptions = {
        "paneProperties.background": "#000000",
        "paneProperties.vertGridProperties.color": "#1E1E1E",
        "paneProperties.horzGridProperties.color": "#1E1E1E",
        "scalesProperties.backgroundColor": "#000000",
        "scalesProperties.lineColor": "#333333",
        "scalesProperties.textColor": "#AAA"
      };
      
      // Aplicar las opciones a todo el gráfico
      widget.applyOverrides(chartOptions);
      
      // Aplicar fondo negro a los estudios
      const studies = widget.chart().getAllStudies();
      if (studies && studies.length > 0) {
        studies.forEach((study: any) => {
          if (study && study.id) {
            widget.chart().getStudyById(study.id).applyOverrides({
              "plot.color": study.name.includes("Moving Average") ? undefined : "#AAA",
              "plot.linewidth": 2,
              "band.backgroundColor": "#1E1E1E80"
            });
          }
        });
      }
      
      console.log("Tema oscuro aplicado a todos los componentes");
    } catch (error) {
      console.error("Error al aplicar tema oscuro:", error);
    }
  };
  
  // Función para crear y forzar nuestros EMAs específicos por defecto
  const createAndForceDefaultEMAs = (widget: any) => {
    try {
      console.log("Creando EMAs predeterminados forzados");
      
      // EMA 10 (Azul)
      widget.chart().createStudy(
        "Moving Average Exponential", 
        false, 
        false,
        [10], 
        null, 
        { "plot.color": "#2196F3", "plot.linewidth": 2 }
      );
      
      // EMA 55 (Naranja)
      widget.chart().createStudy(
        "Moving Average Exponential", 
        false, 
        false,
        [55], 
        null, 
        { "plot.color": "#FF9800", "plot.linewidth": 2 }
      );
      
      // EMA 200 (Rosa)
      widget.chart().createStudy(
        "Moving Average Exponential", 
        false, 
        false,
        [200], 
        null, 
        { "plot.color": "#E91E63", "plot.linewidth": 2 }
      );
      
      // EMA 365 (Púrpura)
      widget.chart().createStudy(
        "Moving Average Exponential", 
        false, 
        false,
        [365], 
        null, 
        { "plot.color": "#9C27B0", "plot.linewidth": 2 }
      );

      // Add MACD
      widget.chart().createStudy("MACD", false, false, [12, 26, 9]);

      // Add RSI
      widget.chart().createStudy("Relative Strength Index", false, false, [14]);
      
      console.log("EMAs predeterminados creados correctamente");
      
      // Guardar el estado actual forzado
      localStorage.setItem('ema-preserved', 'true');
      
    } catch (error) {
      console.error("Error al crear EMAs forzados:", error);
    }
  };
  
  // Función para asegurar la preservación de las EMAs específicas que queremos
  const forcePreserveEMAs = (widget: any) => {
    try {
      // Verificar si tenemos las EMAs que queremos
      const allStudies = widget.chart().getAllStudies();
      let hasEma10 = false;
      let hasEma55 = false;
      let hasEma200 = false;
      let hasEma365 = false;
      let hasMacd = false;
      let hasRsi = false;
      
      if (allStudies && allStudies.length > 0) {
        for (const study of allStudies) {
          if (!study || !study.name) continue;
          
          if (study.name === "Moving Average Exponential") {
            // Intentar determinar de qué EMA se trata
            try {
              const studyObj = widget.chart().getStudyById(study.id);
              const inputs = studyObj?.inputs ? studyObj.inputs() : null;
              
              if (inputs && inputs.length && inputs.length > 0) {
                const period = inputs[0]; // Normalmente el primer input es el período
                
                if (period == 10) hasEma10 = true;
                else if (period == 55) hasEma55 = true;
                else if (period == 200) hasEma200 = true;
                else if (period == 365) hasEma365 = true;
              }
            } catch (e) {
              // Ignorar errores al obtener detalles
            }
          } else if (study.name === "MACD") {
            hasMacd = true;
          } else if (study.name === "Relative Strength Index") {
            hasRsi = true;
          }
        }
      }
      
      // Crear las EMAs faltantes
      if (!hasEma10) {
        widget.chart().createStudy(
          "Moving Average Exponential", 
          false, 
          false,
          [10], 
          null, 
          { "plot.color": "#2196F3", "plot.linewidth": 2 }
        );
        console.log("EMA 10 recreada");
      }
      
      if (!hasEma55) {
        widget.chart().createStudy(
          "Moving Average Exponential", 
          false, 
          false,
          [55], 
          null, 
          { "plot.color": "#FF9800", "plot.linewidth": 2 }
        );
        console.log("EMA 55 recreada");
      }
      
      if (!hasEma200) {
        widget.chart().createStudy(
          "Moving Average Exponential", 
          false, 
          false,
          [200], 
          null, 
          { "plot.color": "#E91E63", "plot.linewidth": 2 }
        );
        console.log("EMA 200 recreada");
      }
      
      if (!hasEma365) {
        widget.chart().createStudy(
          "Moving Average Exponential", 
          false, 
          false,
          [365], 
          null, 
          { "plot.color": "#9C27B0", "plot.linewidth": 2 }
        );
        console.log("EMA 365 recreada");
      }
      
      if (!hasMacd) {
        widget.chart().createStudy("MACD", false, false, [12, 26, 9]);
        console.log("MACD recreado");
      }
      
      if (!hasRsi) {
        widget.chart().createStudy("Relative Strength Index", false, false, [14]);
        console.log("RSI recreado");
      }
      
      // Marcar como preservado
      localStorage.setItem('ema-preserved', 'true');
      localStorage.setItem('ema-last-check', new Date().toISOString());
      
    } catch (error) {
      console.error("Error al preservar EMAs:", error);
    }
  };

  // Function to update TradingView markers directly on the chart
  const updateTradingViewMarkers = () => {
    if (!tvWidgetRef.current || !tvWidgetRef.current.chart) return;
    
    const chart = tvWidgetRef.current.chart();
    
    // First, remove existing markers
    Object.values(chartMarkersRef.current).forEach(markerId => {
      try {
        chart.removeEntity(markerId);
      } catch (error) {
        // Ignore errors from already removed shapes
      }
    });
    
    // Reset the markers reference
    chartMarkersRef.current = {};
    
    // Show only pending and recent bets
    const recentBets = bets
      .filter((bet) => bet.status === "pending" || new Date(bet.timestamp).getTime() > Date.now() - 10 * 60000)
      .slice(0, 10);
      
    // Draw new markers
    recentBets.forEach(bet => {
      const betTime = bet.candleTime || new Date(bet.timestamp).getTime();
      const betTimeStr = new Date(betTime).toISOString();
      
      // Determine marker text and colors based on bet
      // Use actual emojis that TradingView supports
      const bullEmoji = "🐂"; // Bull emoji
      const bearEmoji = "🐻"; // Bear emoji
      
      // Size based on bet amount (logarithmic scale)
      const baseSize = 14;
      const maxSize = 24;
      const normalizedSize = Math.min(
        baseSize + Math.log10(bet.amount / 1000) * 6, 
        maxSize
      );
      const fontSize = Math.max(normalizedSize, baseSize);
      
      // Colors based on bet status and direction
      const bullColor = bet.status === "won" ? "#26a69a" : bet.status === "lost" ? "#999999" : "#4caf50";
      const bearColor = bet.status === "won" ? "#ef5350" : bet.status === "lost" ? "#999999" : "#f44336";
      const color = bet.direction === "up" ? bullColor : bearColor;
      
      try {
        // We'll use price-based positioning for more accurate marker placement
        const pricedPoint = {
          time: betTimeStr,
          // Position at high/low prices for better visibility
          price: 0, // This will be ignored since we use channel instead
          channel: bet.direction === "up" ? "high+5" : "low-5" // Mejorado: posición más precisa con offset en las velas
        };
        
        // Add offset for better visibility
        const vertOffset = bet.direction === "up" ? 15 : -15;
        
        // First create a circle marker as background with improved styling
        const bgShapeId = chart.createMultipointShape(
          [pricedPoint],
          {
            shape: "circle",
            overrides: { 
              color: bet.status === "pending" ? color : "#00000033",
              backgroundColor: bet.status === "pending" ? "#222222dd" : "#00000022", // Mejorado: opacidad y contraste
              backgroundVisible: true,
              transparency: bet.status === "pending" ? 10 : 30, // Mejorado: más visible para apuestas pendientes
              borderWidth: 2,
              // Make sure it appears below the text
              zOrder: "bottom",
              size: fontSize * 1.2
            }
          }
        );
        
        // Store the shape ID with bet ID as key
        chartMarkersRef.current[`${bet.id}-bg`] = bgShapeId;
        
        // The marker text emoji (bull or bear)
        const markerText = bet.direction === "up" ? bullEmoji : bearEmoji;
        
        // Add emoji on top of the circle with improved styling
        const textShapeId = chart.createMultipointShape(
          [pricedPoint],
          {
            shape: "text",
            text: markerText,
            overrides: { 
              fontsize: fontSize,
              color: "#FFFFFF",
              bold: true,
              fixedSize: true,
              textAlign: "center",
              vertAlign: "middle",
              backgroundVisible: false,
              offsetY: 0,
              borderVisible: bet.status === "pending", // Mejorado: borde visible para apuestas pendientes
              borderColor: "#FFFFFF55",
              borderWidth: 1,
              // Make sure it appears on top
              zOrder: "top"
            }
          }
        );
        
        // Store the shape ID
        chartMarkersRef.current[bet.id] = textShapeId;
        
        // For newly placed bets, add a pulse animation effect
        const isNewBet = Date.now() - new Date(bet.timestamp).getTime() < 10000; // 10 seconds
        
        if (isNewBet && bet.status === "pending") {
          // Create a pulsing circle for new bets with improved styling
          for (let i = 1; i <= 3; i++) {
            setTimeout(() => {
              try {
                const pulseId = chart.createMultipointShape(
                  [pricedPoint],
                  {
                    shape: "circle",
                    overrides: {
                      color: color,
                      borderWidth: 3, // Mejorado: línea más gruesa
                      transparency: 70 - i * 10, // Mejorado: transparencia gradual
                      backgroundVisible: false,
                      zOrder: "bottom",
                      size: fontSize * (1.5 + i * 0.7) // Mejorado: efecto de pulso más visible
                    }
                  }
                );
                
                // Store the pulse shape id
                chartMarkersRef.current[`${bet.id}-pulse-${i}`] = pulseId;
                
                // Remove after animation completes
                setTimeout(() => {
                  try {
                    chart.removeEntity(pulseId);
                    delete chartMarkersRef.current[`${bet.id}-pulse-${i}`];
                  } catch (e) { /* ignore */ }
                }, 1200); // Mejorado: duración más larga para mejor visibilidad
              } catch (e) { /* ignore */ }
            }, i * 400); // Mejorado: espaciado entre pulsos
          }
        }
        
        // Add bet amount text if it's a significant bet with improved styling
        if (bet.amount >= 5000) {
          const amountText = `${(bet.amount/1000).toFixed(0)}K`;
          const amountShapeId = chart.createMultipointShape(
            [pricedPoint],
            {
              shape: "text",
              text: amountText,
              overrides: {
                fontsize: Math.min(11 + Math.log10(bet.amount / 10000), 14), // Mejorado: tamaño proporcional
                color: "#FFFFFF",
                bold: true,
                fixedSize: true,
                textAlign: "center",
                vertAlign: "middle",
                backgroundVisible: true,
                backgroundColor: color,
                borderVisible: true, // Mejorado: borde visible
                borderColor: "#FFFFFF55",
                borderWidth: 1,
                offsetX: bet.direction === "up" ? 25 : -25, // Mejorado: ajuste según dirección
                offsetY: bet.direction === "up" ? -5 : 5, // Mejorado: ajuste según dirección
                zOrder: "top"
              }
            }
          );
          
          // Store with a unique key
          chartMarkersRef.current[`${bet.id}-amount`] = amountShapeId;
        }
      } catch (error) {
        console.error("Error creating TradingView marker:", error);
      }
    });
    
    // Force chart redraw to reflect changes immediately
    if (chart.applyOverrides) {
      chart.applyOverrides({});
    }
  };

  const toggleChartSize = () => {
    setIsExpanded(!isExpanded)
  }

  const toggleSimulation = () => {
    if (isSimulating) {
      // Stop simulation
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current)
        simulationIntervalRef.current = null
      }
      setIsSimulating(false)
    } else {
      // Start simulation
      setIsSimulating(true)
      simulationIntervalRef.current = setInterval(() => {
        simulateNewCandle()
      }, 5000) // Generate a new candle every 5 seconds
    }
  }

  const simulateNewCandle = () => {
    if (!currentPrice) return

    // Generate a new simulated price
    const volatility = 0.005 // 0.5% price movement
    const randomChange = currentPrice * volatility * (Math.random() * 2 - 1)
    const newPrice = currentPrice + randomChange

    // Update the current price
    setCurrentPrice(newPrice)
    setPriceChange(randomChange)

    // In a real implementation, you would update the TradingView chart
    // This would require using the TradingView API to add a new candle
    console.log(`Simulated new candle: ${newPrice.toFixed(2)}`)
  }

  // This fallback function is used to position markers as a div overlay
  // when TradingView's direct charting API isn't available or fails
  const calculateCandlePositions = () => {
    // Only show pending and recent bets (last 10)
    const recentBets = bets
      .filter((bet) => bet.status === "pending" || new Date(bet.timestamp).getTime() > Date.now() - 10 * 60000)
      .slice(0, 10)

    return recentBets.map((bet) => {
      // For better positioning, we'll use the candleTime property
      // This is a more accurate way to position the marker on the correct candle

      // Calculate position based on bet timestamp relative to current time
      const now = Date.now()
      const betTime = bet.candleTime || new Date(bet.timestamp).getTime()
      const minutesAgo = Math.floor((now - betTime) / 60000)

      // Position from right to left (newer bets on the right)
      // Calculate more precise positioning based on time difference
      // This gives better visualization based on actual candle positions
      const visibleCandlesCount = 30; // Approximate visible candles on screen
      const horizontalPosition = `calc(100% - ${(minutesAgo * (100 / visibleCandlesCount))}%)`;
      
      // Adjust the vertical position based on the bet's direction
      // Up bets are placed at the bottom of candles, down bets at the top
      const verticalPosition = bet.direction === "up" ? "65%" : "35%";

      return {
        ...bet,
        position: {
          right: horizontalPosition,
          top: verticalPosition,
        },
      }
    })
  }

  const positionedBets = calculateCandlePositions()

  return (
    <Card className="border-blue-900 bg-gray-900 w-full h-full">
      <CardContent className="p-1 h-full flex flex-col">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold">BTC/USDT</h2>
            <Badge variant="outline" className="bg-blue-900 text-yellow-400 text-xs py-0">
              1m
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <div
              className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
                candleOpen ? "bg-green-900 bg-opacity-60 text-green-400" : "bg-blue-900 bg-opacity-60 text-blue-400"
              }`}
            >
              {candleOpen ? `Open: ${10 - (60 - timeUntilNextCandle)}s` : `Next: ${timeUntilNextCandle}s`}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-blue-800 bg-blue-900 bg-opacity-40 text-blue-400 hover:bg-blue-800 h-6 py-0 px-2"
              onClick={toggleChartSize}
            >
              {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`border-blue-800 ${
                isSimulating ? "bg-red-900 bg-opacity-40 text-red-400" : "bg-green-900 bg-opacity-40 text-green-400"
              } hover:bg-blue-800 h-6 py-0 px-2`}
              onClick={toggleSimulation}
            >
              {isSimulating ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              <span className="text-xs ml-1">{isSimulating ? "Stop" : "Auto"}</span>
            </Button>
          </div>
        </div>

        <div className="relative w-full flex-grow">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <Loader className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          )}
          <div id="tradingview-widget" ref={containerRef} className="h-full w-full"></div>

          {/* Fallback bet markers on chart - only used if TradingView API fails */}
          <div className="pointer-events-none absolute inset-0">
            {positionedBets.map((bet, index) => (
              <BetMarker key={index} bet={bet} position={bet.position} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

import { useState, useEffect } from "react";
import { Rolling24HourPrice, findCheapestWindow } from "@/utils/priceUtils";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";

interface PriceChartProps {
  rollingPrices: Rolling24HourPrice[];
  optimalWindow?: { startHour: number; endHour: number; avgPrice: number } | null;
  selectedHourWindow?: number | null;
  onSelectedHourWindowChange?: (hours: number | null) => void;
  selectedWindow?: { startIdx: number; endIdx: number; avgPrice: number } | null;
  currentHour: number;
}

const PriceChart = ({ 
  rollingPrices,
  optimalWindow, 
  selectedHourWindow,
  onSelectedHourWindowChange,
  selectedWindow,
  currentHour
}: PriceChartProps) => {
  const [manualSelectedIndices, setManualSelectedIndices] = useState<number[]>([]);

  // Reset manual selection when preset window changes
  useEffect(() => {
    if (selectedHourWindow && selectedWindow) {
      // Initialize with the selected window indices
      const indices = Array.from(
        { length: selectedHourWindow },
        (_, i) => selectedWindow.startIdx + i
      );
      setManualSelectedIndices(indices);
    } else {
      setManualSelectedIndices([]);
    }
  }, [selectedHourWindow, selectedWindow?.startIdx]);

  // Calculate the 4 cheapest consecutive hours - match by index in rolling array
  const cheapest4Indices = optimalWindow 
    ? rollingPrices
        .map((price, idx) => ({ ...price, idx }))
        .filter((_, i) => i >= 0 && i < rollingPrices.length)
        .slice()
        .sort((a, b) => {
          // Create a rolling window and find the cheapest consecutive 4 hours
          return a.price - b.price;
        })
        .slice(0, 4)
        .map(p => p.idx)
    : [];

  // Better approach: find the actual 4 cheapest consecutive hours in the rolling array
  let actualCheapest4Indices: number[] = [];
  if (rollingPrices.length >= 4) {
    let minSum = Infinity;
    let minStartIdx = 0;
    
    for (let i = 0; i <= rollingPrices.length - 4; i++) {
      const sum = rollingPrices.slice(i, i + 4).reduce((s, p) => s + p.price, 0);
      if (sum < minSum) {
        minSum = sum;
        minStartIdx = i;
      }
    }
    
    actualCheapest4Indices = [minStartIdx, minStartIdx + 1, minStartIdx + 2, minStartIdx + 3];
  }

  // Use manual selection if available, otherwise use preset window
  const effectiveSelectedIndices = manualSelectedIndices.length > 0 
    ? manualSelectedIndices 
    : (selectedWindow ? Array.from({ length: selectedHourWindow || 0 }, (_, i) => selectedWindow.startIdx + i) : []);
  
  // Calculate average price for effective selection
  const avgSelectedWindow = effectiveSelectedIndices.length > 0
    ? rollingPrices
        .filter((_, idx) => effectiveSelectedIndices.includes(idx))
        .reduce((sum, p) => sum + p.price, 0) / effectiveSelectedIndices.length / 100
    : null;

  // Average price for the 4 cheapest consecutive hours - calculate from actual indices
  const avgCheapest4 = actualCheapest4Indices.length === 4
    ? rollingPrices
        .filter((_, idx) => actualCheapest4Indices.includes(idx))
        .reduce((sum, p) => sum + p.price, 0) / 4 / 100
    : 0;

  // Calculate average price for the rolling 24 hours
  const avgRollingPrice = rollingPrices.length > 0
    ? rollingPrices.reduce((sum, p) => sum + p.price, 0) / rollingPrices.length / 100
    : 0;

  // Calculate time range for selected hours
  const selectedHoursTimeRange = effectiveSelectedIndices.length > 0 
    ? (() => {
        const sortedIndices = [...effectiveSelectedIndices].sort((a, b) => a - b);
        const startHour = rollingPrices[sortedIndices[0]]?.displayHour;
        const endHour = rollingPrices[sortedIndices[sortedIndices.length - 1]]?.displayHour;
        return `${startHour}-${endHour}`;
      })()
    : null;

  // Prepare chart data using the actual cheapest 4 consecutive indices
  const chartData = rollingPrices.map((hourData, idx) => ({
    hour: hourData.displayHour,
    hourNum: idx,
    pris: hourData.price / 100,
    isCheap: actualCheapest4Indices.includes(idx),
    isSelected: effectiveSelectedIndices.includes(idx),
    isNextDay: hourData.isNextDay
  }));

  // Handle bar click - toggle selection
  const handleBarClick = (data: any) => {
    const hourNum = data.hourNum;
    setManualSelectedIndices(prev => {
      if (prev.includes(hourNum)) {
        // Remove from selection
        return prev.filter(h => h !== hourNum);
      } else {
        // Add to selection
        return [...prev, hourNum].sort((a, b) => a - b);
      }
    });
  };

  // Get bar color based on status - priority: selected > cheap > normal
  const getBarColor = (entry: any) => {
    if (entry.isSelected) return "hsl(var(--chart-window))";
    if (entry.isCheap) return "hsl(var(--price-cheap))";
    return "hsl(var(--chart-normal))";
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-elegant">
          <p className="text-sm font-semibold mb-1">
            {data.hour}
            {data.isNextDay && <span className="ml-1 text-xs text-muted-foreground">(Imorgon)</span>}
          </p>
          <p className="text-sm font-bold" style={{ color: payload[0].color }}>
            {payload[0].value.toFixed(2)} kr/kWh (inkl. moms)
          </p>
          {data.isCheap && !data.isSelected && (
            <p className="text-xs mt-1 text-price-cheap">✓ Bland de 4 billigaste sammanhängande</p>
          )}
          {data.isSelected && (
            <p className="text-xs mt-1 text-chart-window">✓ Vald timme</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Klicka för att välja/avmarkera</p>
        </div>
      );
    }
    return null;
  };

  // Generate subtitle with time range based on available data
  const hasNextDayData = rollingPrices.some(p => p.isNextDay);
  const lastHour = rollingPrices.length > 0 ? rollingPrices[rollingPrices.length - 1] : null;
  
  let subtitle = '';
  if (hasNextDayData && lastHour?.isNextDay) {
    const endHour = lastHour.originalHour;
    subtitle = `Från ${currentHour.toString().padStart(2, '0')}:00 idag till ${endHour.toString().padStart(2, '0')}:00 imorgon`;
  } else if (lastHour) {
    const endHour = lastHour.originalHour;
    subtitle = `Från ${currentHour.toString().padStart(2, '0')}:00 till ${endHour.toString().padStart(2, '0')}:00 idag`;
  }

  return (
    <div className="bg-card rounded-xl shadow-elegant p-3 sm:p-4 lg:p-6 border border-border hover:shadow-glow transition-all duration-300">
      <div className="mb-4 sm:mb-5 lg:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
          <div>
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-foreground">
              Elpriser kommande 24 timmar
            </h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{subtitle}</p>
            {!hasNextDayData && (
              <div className="mt-2 flex items-start gap-1.5 text-[10px] sm:text-xs text-muted-foreground bg-muted/30 p-2 rounded-md">
                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <p className="leading-snug">
                  Visar dagens återstående timmar. Morgondagens priser publiceras 13:00-14:00 och då visas alla 24 timmar.
                </p>
              </div>
            )}
          </div>
          
          {/* Hour Selection Buttons */}
          <div className="flex flex-wrap gap-2">
            {[2, 4, 6, 8].map((hours) => (
              <Button
                key={hours}
                size="sm"
                variant={selectedHourWindow === hours ? "default" : "outline"}
                onClick={() => {
                  const newValue = selectedHourWindow === hours ? null : hours;
                  onSelectedHourWindowChange?.(newValue);
                }}
                className="h-8 px-3 text-xs font-semibold transition-all duration-300"
              >
                {hours} timmar
              </Button>
            ))}
            {manualSelectedIndices.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setManualSelectedIndices([]);
                  onSelectedHourWindowChange?.(null);
                }}
                className="h-8 px-3 text-xs font-semibold border-muted-foreground/30 hover:bg-destructive/10 hover:border-destructive/50"
              >
                Rensa
              </Button>
            )}
          </div>
        </div>
        
          <div className="flex flex-col gap-2 bg-muted/30 rounded-lg p-3">
          <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-foreground">
            Snitt 24h: <span className="text-sm sm:text-base lg:text-lg font-bold text-primary">{avgRollingPrice.toFixed(2)} kr/kWh</span>
          </p>
          <div className="flex items-center gap-2 text-[10px] sm:text-xs lg:text-sm">
            <div className="w-3 h-3 rounded bg-price-cheap"></div>
            <span className="text-muted-foreground">4 billigaste sammanhängande: <span className="font-semibold text-foreground">{avgCheapest4.toFixed(2)} kr/kWh</span></span>
          </div>
          {effectiveSelectedIndices.length > 0 && avgSelectedWindow && (
            <div className="flex items-center gap-2 text-[10px] sm:text-xs lg:text-sm">
              <div className="w-3 h-3 rounded bg-chart-window"></div>
              <span className="text-muted-foreground">
                Valt laddningsfönster {selectedHoursTimeRange} ({effectiveSelectedIndices.length}h): <span className="font-semibold text-foreground">{avgSelectedWindow.toFixed(2)} kr/kWh</span>
              </span>
            </div>
          )}
        </div>
      </div>


      <div>
          <ResponsiveContainer width="100%" height={300} className="sm:h-[350px] lg:h-[400px]">
            <BarChart data={chartData} margin={{ top: 50, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="hour"
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 8 }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={70}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 11 }}
            domain={[0, 'auto']}
            label={{
              value: "kr/kWh",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--accent) / 0.2)" }} />
          <ReferenceLine 
            y={avgRollingPrice} 
            stroke="hsl(var(--primary))" 
            strokeDasharray="5 5"
            strokeWidth={2.5}
          />
          <Bar 
            dataKey="pris" 
            radius={[4, 4, 0, 0]} 
            maxBarSize={40}
            onClick={handleBarClick}
            cursor="pointer"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarColor(entry)}
              />
            ))}
          </Bar>
            </BarChart>
          </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceChart;

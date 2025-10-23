import { useState } from "react";
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
  const [selectedHours, setSelectedHours] = useState<number[]>([]);

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

  // Calculate selected window indices based on the new index-based structure
  const selectedWindowIndices = selectedWindow
    ? Array.from({ length: selectedHourWindow || 0 }, (_, i) => selectedWindow.startIdx + i)
    : [];
  
  // Calculate average price for selected window
  const avgSelectedWindow = selectedWindow ? selectedWindow.avgPrice / 100 : null;

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

  // Calculate average price for manually selected hours
  const avgSelectedPrice = selectedHours.length > 0
    ? rollingPrices
        .filter((_, idx) => selectedHours.includes(idx))
        .reduce((sum, p) => sum + p.price, 0) / selectedHours.length / 100
    : null;

  // Prepare chart data using the actual cheapest 4 consecutive indices
  const chartData = rollingPrices.map((hourData, idx) => ({
    hour: hourData.displayHour,
    hourNum: idx,
    pris: hourData.price / 100,
    isCheap: actualCheapest4Indices.includes(idx),
    isSelectedWindow: selectedWindowIndices.includes(idx),
    isSelected: selectedHours.includes(idx),
    isNextDay: hourData.isNextDay
  }));

  // Handle bar click
  const handleBarClick = (data: any) => {
    if (selectedHourWindow) return;
    
    const hourNum = data.hourNum;
    setSelectedHours(prev => 
      prev.includes(hourNum) 
        ? prev.filter(h => h !== hourNum)
        : [...prev, hourNum]
    );
  };

  // Get bar color based on status - priority: selected > selectedWindow > cheap > normal
  const getBarColor = (entry: any) => {
    if (entry.isSelected) return "hsl(48, 100%, 50%)"; // Yellow for manually selected
    if (entry.isSelectedWindow) return "hsl(0, 84%, 60%)"; // Red for selected charging window
    if (entry.isCheap) return "hsl(142, 71%, 45%)"; // Green for 4 cheapest consecutive
    return "hsl(199, 89%, 48%)"; // Light blue for normal bars
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
          {data.isCheap && !data.isSelectedWindow && !data.isSelected && (
            <p className="text-xs mt-1" style={{ color: "hsl(142, 71%, 45%)" }}>✓ Bland de 4 billigaste sammanhängande</p>
          )}
          {data.isSelectedWindow && !data.isSelected && (
            <p className="text-xs mt-1" style={{ color: "hsl(0, 84%, 60%)" }}>✓ Valt laddningsfönster</p>
          )}
          {data.isSelected && (
            <p className="text-xs mt-1" style={{ color: "hsl(48, 100%, 50%)" }}>✓ Manuellt vald</p>
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
    <div className="bg-card rounded-lg shadow-card p-2 sm:p-3 lg:p-6 border border-border">
      <div className="mb-3 sm:mb-4 lg:mb-6">
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
                  setSelectedHours([]);
                }}
                className="h-8 px-3 text-xs font-semibold"
                style={selectedHourWindow === hours ? { 
                  backgroundColor: "hsl(0, 84%, 60%)", 
                  borderColor: "hsl(0, 84%, 60%)",
                  color: "white"
                } : undefined}
              >
                {hours} timmar
              </Button>
            ))}
            {selectedHours.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedHours([])}
                className="h-8 px-3 text-xs font-semibold border-muted-foreground/30 hover:bg-destructive/10 hover:border-destructive/50"
              >
                Rensa
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex flex-col gap-1 sm:gap-2">
          <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-foreground">
            Snitt 24h: <span className="text-sm sm:text-base lg:text-lg font-bold">{avgRollingPrice.toFixed(2)} kr/kWh</span>
          </p>
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs lg:text-sm">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: "hsl(142, 71%, 45%)" }}></div>
            <span className="text-muted-foreground">4 billigaste sammanhängande: {avgCheapest4.toFixed(2)} kr/kWh</span>
          </div>
          {selectedWindow && avgSelectedWindow && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs lg:text-sm">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: "hsl(0, 84%, 60%)" }}></div>
              <span className="text-muted-foreground">
                Valt laddningsfönster ({selectedHourWindow}h): {avgSelectedWindow.toFixed(2)} kr/kWh
              </span>
            </div>
          )}
          {selectedHours.length > 0 && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs lg:text-sm">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: "hsl(48, 100%, 50%)" }}></div>
              <span className="text-muted-foreground">Manuellt valda: ({selectedHours.length}h, snitt: {avgSelectedPrice?.toFixed(2)} kr/kWh)</span>
            </div>
          )}
        </div>
      </div>


      <ResponsiveContainer width="100%" height={250} className="sm:h-[350px] lg:h-[400px]">
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
  );
};

export default PriceChart;

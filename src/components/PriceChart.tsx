import { useState } from "react";
import { HourlyPrice, findCheapestWindow, findCheapestWindowAcrossDays } from "@/utils/priceUtils";
import { formatHour } from "@/utils/priceUtils";
import { Button } from "@/components/ui/button";
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
  todayPrices: HourlyPrice[];
  yesterdayPrices: HourlyPrice[];
  tomorrowPrices?: HourlyPrice[];
  optimalWindow?: { startHour: number; endHour: number; avgPrice: number };
  title?: string;
  date?: string;
}

const PriceChart = ({ todayPrices, yesterdayPrices, tomorrowPrices, optimalWindow, title = "Prisutveckling idag", date }: PriceChartProps) => {
  const [selectedHours, setSelectedHours] = useState<number[]>([]);
  const [selectedHourWindow, setSelectedHourWindow] = useState<number | null>(null);

  // Get the 4 cheapest consecutive hours (static green)
  const cheapestWindow = findCheapestWindow(todayPrices, 4);
  const cheapest4Hours = Array.from(
    { length: 4 }, 
    (_, i) => (cheapestWindow.startHour + i) % 24 // Handle wrap-around at midnight
  );

  // Get the selected hour window (dynamic red) - can span across days
  const selectedWindow = selectedHourWindow && tomorrowPrices
    ? findCheapestWindowAcrossDays(todayPrices, tomorrowPrices, selectedHourWindow)
    : selectedHourWindow 
    ? { ...findCheapestWindow(todayPrices, selectedHourWindow), spansToNextDay: false }
    : null;
  
  const selectedWindowHours = selectedWindow ? Array.from(
    { length: selectedHourWindow! },
    (_, i) => (selectedWindow.startHour + i) % 24 // Handle wrap-around at midnight
  ) : [];
  
  // Calculate average price for selected window hours
  const avgSelectedWindow = selectedWindow ? selectedWindow.avgPrice / 100 : null;

  // Average price for the 4 cheapest consecutive hours (convert from öre to kr)
  const avgCheapest4 = cheapestWindow.avgPrice / 100;

  // Calculate average price for today
  const avgTodayPrice = todayPrices.reduce((sum, p) => sum + p.price, 0) / todayPrices.length / 100;

  // Calculate average price for selected hours (use the prices being displayed)
  const avgSelectedPrice = selectedHours.length > 0
    ? todayPrices
        .filter(p => selectedHours.includes(p.hour))
        .reduce((sum, p) => sum + p.price, 0) / selectedHours.length / 100
    : null;

  // Debug logging
  if (selectedHours.length > 0) {
    console.log('Selected hours:', selectedHours);
    console.log('Prices for selected hours:', todayPrices.filter(p => selectedHours.includes(p.hour)));
    console.log('Average:', avgSelectedPrice);
  }

  // Combine data for chart - ensure we have exactly 24 hours (0-23)
  const chartData = Array.from({ length: 24 }, (_, i) => {
    const hourData = todayPrices.find(p => p.hour === i);
    return {
      hour: `${i.toString().padStart(2, '0')}:00`,
      hourNum: i,
      pris: hourData ? hourData.price / 100 : 0,
      isCheap: hourData && cheapest4Hours.includes(i), // 4 cheapest consecutive hours (green)
      isSelectedWindow: hourData && selectedWindowHours.includes(i), // Selected charging window (purple)
      isSelected: selectedHours.includes(i), // Manually selected (orange)
    };
  });

  // Handle bar click - disable manual selection when a window is selected
  const handleBarClick = (data: any) => {
    if (selectedHourWindow) return; // Don't allow manual selection when a window is active
    
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
          <p className="text-sm font-semibold mb-1">{data.hour}</p>
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

  return (
    <div className="bg-card rounded-lg shadow-card p-3 sm:p-4 lg:p-6 border border-border">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
          <h3 className="text-lg sm:text-xl font-bold text-foreground">
            {title} {date && <span className="text-sm sm:text-base text-muted-foreground">({date})</span>}
          </h3>
          
          {/* Hour Selection Buttons */}
          <div className="flex flex-wrap gap-2">
            {[2, 4, 6, 8].map((hours) => (
              <Button
                key={hours}
                size="sm"
                variant={selectedHourWindow === hours ? "default" : "outline"}
                onClick={() => {
                  setSelectedHourWindow(selectedHourWindow === hours ? null : hours);
                  setSelectedHours([]); // Clear manually selected hours when clicking a button
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
          </div>
        </div>
        
        <div className="flex flex-col gap-1 sm:gap-2">
          <p className="text-xs sm:text-sm font-medium text-foreground">
            Dagens snitt: <span className="text-base sm:text-lg font-bold">{avgTodayPrice.toFixed(2)} kr/kWh</span>
          </p>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(142, 71%, 45%)" }}></div>
            <span className="text-muted-foreground">4 billigaste sammanhängande: {avgCheapest4.toFixed(2)} kr/kWh</span>
          </div>
          {selectedWindow && avgSelectedWindow && (
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(0, 84%, 60%)" }}></div>
              <span className="text-muted-foreground">
                Valt laddningsfönster ({selectedHourWindow}h): {avgSelectedWindow.toFixed(2)} kr/kWh
                {selectedWindow.spansToNextDay && " (sträcker till nästa dag)"}
              </span>
            </div>
          )}
          {selectedHours.length > 0 && (
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(48, 100%, 50%)" }}></div>
              <span className="text-muted-foreground">Manuellt valda: ({selectedHours.length}h, snitt: {avgSelectedPrice?.toFixed(2)} kr/kWh)</span>
            </div>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300} className="sm:h-[400px]">
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
            y={avgTodayPrice} 
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

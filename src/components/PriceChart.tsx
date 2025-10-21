import { useState } from "react";
import { HourlyPrice, findCheapestWindow } from "@/utils/priceUtils";
import { formatHour } from "@/utils/priceUtils";
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
  optimalWindow?: { startHour: number; endHour: number; avgPrice: number };
  title?: string;
  date?: string;
}

const PriceChart = ({ todayPrices, yesterdayPrices, optimalWindow, title = "Prisutveckling idag", date }: PriceChartProps) => {
  const [selectedHours, setSelectedHours] = useState<number[]>([]);

  // Get the 4 cheapest consecutive hours
  const cheapestWindow = findCheapestWindow(todayPrices, 4);
  const cheapest4Hours = Array.from(
    { length: 4 }, 
    (_, i) => cheapestWindow.startHour + i
  );

  // Get hours from the optimal window (from ChargingPlanner)
  const optimalHours = optimalWindow ? Array.from(
    { length: (optimalWindow.endHour - optimalWindow.startHour + 1) },
    (_, i) => optimalWindow.startHour + i
  ) : [];

  // Average price for the 4 cheapest consecutive hours
  const avgCheapest4 = cheapestWindow.avgPrice;

  // Calculate average price for today
  const avgTodayPrice = todayPrices.reduce((sum, p) => sum + p.price, 0) / todayPrices.length / 100;

  // Calculate average price for selected hours
  const avgSelectedPrice = selectedHours.length > 0
    ? todayPrices
        .filter(p => selectedHours.includes(p.hour))
        .reduce((sum, p) => sum + p.price, 0) / selectedHours.length / 100
    : null;

  // Combine data for chart - ensure we have exactly 24 hours (0-23)
  const chartData = Array.from({ length: 24 }, (_, i) => {
    const hourData = todayPrices.find(p => p.hour === i);
    return {
      hour: `${i.toString().padStart(2, '0')}:00`,
      hourNum: i,
      pris: hourData ? hourData.price / 100 : 0,
      isCheap: hourData && cheapest4Hours.includes(i), // 4 cheapest consecutive hours
      isOptimal: hourData && optimalHours.includes(i), // Optimal window from ChargingPlanner
      isSelected: selectedHours.includes(i),
    };
  });

  // Handle bar click
  const handleBarClick = (data: any) => {
    const hourNum = data.hourNum;
    setSelectedHours(prev => 
      prev.includes(hourNum) 
        ? prev.filter(h => h !== hourNum)
        : [...prev, hourNum]
    );
  };

  // Get bar color based on status - priority: selected > optimal > cheap > normal
  const getBarColor = (entry: any) => {
    if (entry.isSelected) return "hsl(35, 91%, 55%)"; // Orange for manually selected
    if (entry.isOptimal) return "hsl(280, 70%, 60%)"; // Purple for optimal window from planner
    if (entry.isCheap) return "hsl(var(--price-cheap))"; // Green for 4 cheapest consecutive
    return "hsl(var(--primary) / 0.6)";
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
          {data.isCheap && !data.isOptimal && !data.isSelected && (
            <p className="text-xs text-price-cheap mt-1">✓ Bland de 4 billigaste sammanhängande</p>
          )}
          {data.isOptimal && !data.isSelected && (
            <p className="text-xs mt-1" style={{ color: "hsl(280, 70%, 60%)" }}>✓ Valt laddningsfönster</p>
          )}
          {data.isSelected && (
            <p className="text-xs mt-1" style={{ color: "hsl(35, 91%, 55%)" }}>✓ Manuellt vald</p>
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
        <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 sm:mb-3">
          {title} {date && <span className="text-sm sm:text-base text-muted-foreground">({date})</span>}
        </h3>
        <div className="flex flex-col gap-1 sm:gap-2">
          <p className="text-xs sm:text-sm font-medium text-foreground">
            Dagens snitt: <span className="text-base sm:text-lg font-bold">{avgTodayPrice.toFixed(2)} kr/kWh</span>
          </p>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <div className="w-3 h-3 rounded bg-price-cheap"></div>
            <span className="text-muted-foreground">4 billigaste sammanhängande: {(avgCheapest4 / 100).toFixed(2)} kr/kWh</span>
          </div>
          {optimalWindow && (
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(280, 70%, 60%)" }}></div>
              <span className="text-muted-foreground">
                Valt laddningsfönster ({optimalWindow.endHour - optimalWindow.startHour + 1}h): {(optimalWindow.avgPrice / 100).toFixed(2)} kr/kWh
              </span>
            </div>
          )}
          {selectedHours.length > 0 && (
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(35, 91%, 55%)" }}></div>
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

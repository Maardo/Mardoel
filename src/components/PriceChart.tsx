import { useState } from "react";
import { HourlyPrice, getCheapestHours } from "@/utils/priceUtils";
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
}

const PriceChart = ({ todayPrices, yesterdayPrices, optimalWindow, title = "Prisutveckling idag" }: PriceChartProps) => {
  const [selectedHours, setSelectedHours] = useState<number[]>([]);

  // Get the 4 cheapest hours
  const cheapest4Hours = [...todayPrices]
    .sort((a, b) => a.price - b.price)
    .slice(0, 4)
    .map(p => p.hour);

  // Calculate average price for the 4 cheapest hours
  const avgCheapest4 = Math.round(
    todayPrices
      .filter(p => cheapest4Hours.includes(p.hour))
      .reduce((sum, p) => sum + p.price, 0) / 4
  );

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
      isCheap: hourData && cheapest4Hours.includes(i), // Only mark as cheap if hour has data
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

  // Get bar color based on status - selected always takes priority
  const getBarColor = (entry: any) => {
    if (entry.isSelected) return "hsl(35, 91%, 55%)"; // Orange/yellow for selected
    if (entry.isCheap) return "hsl(var(--price-cheap))";
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
          {data.isCheap && (
            <p className="text-xs text-price-cheap mt-1">✓ Billigaste 4 timmarna</p>
          )}
          {data.isSelected && !data.isCheap && (
            <p className="text-xs text-accent mt-1">✓ Vald</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Klicka för att välja/avmarkera</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card rounded-lg shadow-card p-6 border border-border">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-price-cheap"></div>
            <span className="text-muted-foreground">Billigaste 4 timmarna (snitt: {(avgCheapest4 / 100).toFixed(2)} kr/kWh)</span>
          </div>
          {selectedHours.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(35, 91%, 55%)" }}></div>
              <span className="text-muted-foreground">({selectedHours.length} {selectedHours.length === 1 ? 'timma' : 'timmar'}, snitt: {avgSelectedPrice?.toFixed(2)} kr/kWh)</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>💡 Klicka på staplar för att beräkna anpassat snitt</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground mt-1">
            <span>Dagens snitt: {avgTodayPrice.toFixed(2)} kr/kWh</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 50, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="hour"
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 9 }}
            interval={1}
            height={40}
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

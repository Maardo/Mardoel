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
}

const PriceChart = ({ todayPrices, yesterdayPrices, optimalWindow }: PriceChartProps) => {
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

  // Combine data for chart
  const chartData = todayPrices.map((today) => ({
    hour: `${today.hour.toString().padStart(2, '0')}:00`,
    hourNum: today.hour,
    pris: today.price / 100, // Convert to kr (inkl. moms)
    isCheap: cheapest4Hours.includes(today.hour),
    isSelected: selectedHours.includes(today.hour),
  }));

  // Handle bar click
  const handleBarClick = (data: any) => {
    const hourNum = data.hourNum;
    setSelectedHours(prev => 
      prev.includes(hourNum) 
        ? prev.filter(h => h !== hourNum)
        : [...prev, hourNum]
    );
  };

  // Get bar color based on status
  const getBarColor = (entry: any) => {
    if (entry.isCheap) return "hsl(var(--price-cheap))";
    if (entry.isSelected) return "hsl(var(--accent))";
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
        <h3 className="text-xl font-bold text-foreground mb-3">Prisutveckling idag</h3>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-price-cheap"></div>
            <span className="text-muted-foreground">Billigaste 4 timmarna (snitt: {(avgCheapest4 / 100).toFixed(2)} kr/kWh)</span>
          </div>
          {selectedHours.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-accent"></div>
              <span className="text-muted-foreground">Valda timmar ({selectedHours.length} st, snitt: {avgSelectedPrice?.toFixed(2)} kr/kWh)</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>💡 Klicka på staplar för att beräkna anpassat snitt</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 40, left: 20, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="hour"
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 11 }}
            interval={1}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 12 }}
            domain={[0, 'auto']}
            label={{
              value: "kr/kWh (inkl. moms)",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 12, fill: "hsl(var(--muted-foreground))" },
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--accent) / 0.2)" }} />
          <ReferenceLine 
            y={avgTodayPrice} 
            stroke="hsl(var(--primary))" 
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{ 
              value: `Dagens snitt: ${avgTodayPrice.toFixed(2)} kr/kWh`, 
              position: "right",
              fill: "hsl(var(--muted-foreground))",
              fontSize: 12
            }}
          />
          <Bar 
            dataKey="pris" 
            radius={[6, 6, 0, 0]} 
            maxBarSize={50}
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

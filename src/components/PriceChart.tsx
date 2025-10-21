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
  Cell,
} from "recharts";

interface PriceChartProps {
  todayPrices: HourlyPrice[];
  yesterdayPrices: HourlyPrice[];
  optimalWindow?: { startHour: number; endHour: number; avgPrice: number };
}

const PriceChart = ({ todayPrices, yesterdayPrices, optimalWindow }: PriceChartProps) => {
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

  // Combine data for chart
  const chartData = todayPrices.map((today) => ({
    hour: formatHour(today.hour),
    hourNum: today.hour,
    pris: today.price / 100, // Convert to kr (inkl. moms)
    isCheap: cheapest4Hours.includes(today.hour),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const isCheap = payload[0].payload.isCheap;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-elegant">
          <p className="text-sm font-semibold mb-1">{payload[0].payload.hour}</p>
          <p className="text-sm font-bold" style={{ color: payload[0].color }}>
            {payload[0].value.toFixed(2)} kr/kWh (inkl. moms)
          </p>
          {isCheap && (
            <p className="text-xs text-price-cheap mt-1">✓ Billigaste 4 timmarna</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card rounded-lg shadow-card p-6 border border-border">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-foreground mb-2">Prisutveckling idag</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-price-cheap"></div>
            <span className="text-muted-foreground">Billigaste 4 timmarna (snitt: {(avgCheapest4 / 100).toFixed(2)} kr/kWh)</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="hour"
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 11 }}
            interval={1}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 12 }}
            label={{
              value: "kr/kWh (inkl. moms)",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 12, fill: "hsl(var(--muted-foreground))" },
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--accent) / 0.3)" }} />
          <Bar dataKey="pris" radius={[8, 8, 0, 0]} maxBarSize={40}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isCheap ? "hsl(var(--price-cheap))" : "hsl(var(--primary))"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;

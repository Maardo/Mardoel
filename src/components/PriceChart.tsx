import { HourlyPrice } from "@/utils/priceUtils";
import { formatHour } from "@/utils/priceUtils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface PriceChartProps {
  todayPrices: HourlyPrice[];
  yesterdayPrices: HourlyPrice[];
  optimalWindow?: { startHour: number; endHour: number };
}

const PriceChart = ({ todayPrices, yesterdayPrices, optimalWindow }: PriceChartProps) => {
  // Combine data for chart
  const chartData = todayPrices.map((today, index) => ({
    hour: formatHour(today.hour),
    idag: today.price / 100, // Convert to kr
    igår: yesterdayPrices[index]?.price / 100 || 0,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-elegant">
          <p className="text-sm font-semibold mb-1">{payload[0].payload.hour}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(2)} kr/kWh
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card rounded-lg shadow-card p-6">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Prishistorik</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="hour"
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 12 }}
            interval={2}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 12 }}
            label={{
              value: "kr/kWh",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 12, fill: "hsl(var(--muted-foreground))" },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 14 }}
            iconType="line"
          />
          {optimalWindow && (
            <>
              <ReferenceLine
                x={formatHour(optimalWindow.startHour)}
                stroke="hsl(var(--price-optimal-foreground))"
                strokeDasharray="3 3"
                label={{ value: "Start", position: "top", fontSize: 10 }}
              />
              <ReferenceLine
                x={formatHour(optimalWindow.endHour)}
                stroke="hsl(var(--price-optimal-foreground))"
                strokeDasharray="3 3"
                label={{ value: "Slut", position: "top", fontSize: 10 }}
              />
            </>
          )}
          <Line
            type="monotone"
            dataKey="idag"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", r: 3 }}
            activeDot={{ r: 5 }}
            name="Idag"
          />
          <Line
            type="monotone"
            dataKey="igår"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: "hsl(var(--muted-foreground))", r: 3 }}
            activeDot={{ r: 5 }}
            name="Igår"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;

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
  const chartData = todayPrices.map((today) => ({
    hour: formatHour(today.hour),
    pris: today.price / 100, // Convert to kr
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-elegant">
          <p className="text-sm font-semibold mb-1">{payload[0].payload.hour}</p>
          <p className="text-sm font-bold" style={{ color: payload[0].color }}>
            {payload[0].value.toFixed(2)} kr/kWh
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card rounded-lg shadow-card p-6 border border-border">
      <h3 className="text-xl font-bold mb-6 text-foreground">Prisutveckling idag</h3>
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
                stroke="hsl(var(--price-optimal))"
                strokeDasharray="3 3"
                strokeWidth={2}
                label={{ value: "Start", position: "top", fontSize: 10 }}
              />
              <ReferenceLine
                x={formatHour(optimalWindow.endHour)}
                stroke="hsl(var(--price-optimal))"
                strokeDasharray="3 3"
                strokeWidth={2}
                label={{ value: "Slut", position: "top", fontSize: 10 }}
              />
            </>
          )}
          <Line
            type="monotone"
            dataKey="pris"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            dot={{ fill: "hsl(var(--primary))", r: 4 }}
            activeDot={{ r: 6 }}
            name="Pris"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;

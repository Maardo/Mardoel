import { HourlyPrice } from "@/utils/priceUtils";
import { formatHour, formatPrice } from "@/utils/priceUtils";
import { cn } from "@/lib/utils";

interface PriceTableProps {
  prices: HourlyPrice[];
  title: string;
  cheapHours?: number[];
  expensiveHours?: number[];
  optimalWindow?: { startHour: number; endHour: number };
  currentHour?: number;
}

const PriceTable = ({
  prices,
  title,
  cheapHours = [],
  expensiveHours = [],
  optimalWindow,
  currentHour,
}: PriceTableProps) => {
  const getRowClass = (hour: number) => {
    if (optimalWindow && hour >= optimalWindow.startHour && hour <= optimalWindow.endHour) {
      return "bg-price-optimal text-price-optimal-foreground";
    }
    if (cheapHours.includes(hour)) {
      return "bg-price-cheap text-price-cheap-foreground";
    }
    if (expensiveHours.includes(hour)) {
      return "bg-price-expensive text-price-expensive-foreground";
    }
    return "";
  };

  return (
    <div className="bg-card rounded-lg shadow-card p-6">
      <h3 className="text-lg font-semibold mb-4 text-foreground">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 font-medium text-muted-foreground">Timme</th>
              <th className="text-right py-2 px-3 font-medium text-muted-foreground">Pris</th>
            </tr>
          </thead>
          <tbody>
            {prices.map((price) => (
              <tr
                key={price.hour}
                className={cn(
                  "border-b border-border/50 transition-colors",
                  getRowClass(price.hour),
                  currentHour === price.hour && "ring-2 ring-primary animate-pulse"
                )}
              >
                <td className="py-2 px-3 font-medium">
                  {formatHour(price.hour)}
                  {currentHour === price.hour && (
                    <span className="ml-2 text-xs font-semibold">(Nu)</span>
                  )}
                </td>
                <td className="text-right py-2 px-3 font-semibold">
                  {formatPrice(price.price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PriceTable;

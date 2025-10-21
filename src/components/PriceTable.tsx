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
    <div className="bg-card rounded-lg shadow-card p-6 border border-border">
      <h3 className="text-xl font-bold mb-6 text-foreground">{title}</h3>
      
      {/* Legend */}
      <div className="mb-6 pb-4 border-b border-border">
        <p className="text-sm font-semibold text-foreground mb-3">Färgkodning</p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-price-cheap"></div>
            <span className="text-xs text-muted-foreground">3 billigaste timmarna</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-price-expensive"></div>
            <span className="text-xs text-muted-foreground">3 dyraste timmarna</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-price-optimal"></div>
            <span className="text-xs text-muted-foreground">Bästa laddningsfönster</span>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="text-left py-4 px-4 font-bold text-base text-foreground uppercase tracking-wide">Timme</th>
              <th className="text-right py-4 px-4 font-bold text-base text-foreground uppercase tracking-wide">Pris (kr/kWh)</th>
            </tr>
          </thead>
          <tbody>
            {prices.map((price) => (
              <tr
                key={price.hour}
                className={cn(
                  "border-b border-border transition-all duration-200 hover:shadow-sm",
                  getRowClass(price.hour),
                  currentHour === price.hour && "ring-4 ring-primary/50 shadow-lg"
                )}
              >
                <td className="py-3.5 px-4 font-semibold text-base">
                  {formatHour(price.hour)}
                  {currentHour === price.hour && (
                    <span className="ml-2 text-sm font-bold uppercase">(Nu)</span>
                  )}
                </td>
                <td className="text-right py-3.5 px-4 font-bold text-lg">
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

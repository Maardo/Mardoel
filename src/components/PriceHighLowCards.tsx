import { HourlyPrice, formatPrice, formatHour } from "@/utils/priceUtils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceHighLowCardsProps {
  prices: HourlyPrice[];
}

const PriceHighLowCards = ({ prices }: PriceHighLowCardsProps) => {
  // Find highest and lowest prices for today
  const highestPrice = prices.reduce((max, p) => p.price > max.price ? p : max, prices[0]);
  const lowestPrice = prices.reduce((min, p) => p.price < min.price ? p : min, prices[0]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
      {/* Highest Price Card */}
      <div className="bg-card rounded-lg shadow-card p-4 border border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-price-expensive/10 rounded-lg">
            <TrendingUp className="w-5 h-5 text-price-expensive" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Dagens högsta pris</p>
            <p className="text-sm font-semibold text-foreground">
              Klockan {formatHour(highestPrice.hour)}
            </p>
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-foreground">
          {formatPrice(highestPrice.price)}
        </div>
        <p className="text-xs text-muted-foreground mt-1">(inkl. moms)</p>
      </div>

      {/* Lowest Price Card */}
      <div className="bg-card rounded-lg shadow-card p-4 border border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-price-cheap/10 rounded-lg">
            <TrendingDown className="w-5 h-5 text-price-cheap" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Dagens lägsta pris</p>
            <p className="text-sm font-semibold text-foreground">
              Klockan {formatHour(lowestPrice.hour)}
            </p>
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-foreground">
          {formatPrice(lowestPrice.price)}
        </div>
        <p className="text-xs text-muted-foreground mt-1">(inkl. moms)</p>
      </div>
    </div>
  );
};

export default PriceHighLowCards;

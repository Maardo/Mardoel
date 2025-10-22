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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
      {/* Highest Price Card */}
      <div className="bg-card rounded-xl shadow-card p-4 sm:p-5 border border-border hover:shadow-lg transition-shadow">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2.5 bg-price-expensive/10 rounded-xl">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-price-expensive" />
          </div>
          <div className="flex-1">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Dagens högsta pris</p>
            <p className="text-sm sm:text-base font-semibold text-foreground">
              Klockan {formatHour(highestPrice.hour)}
            </p>
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
          {formatPrice(highestPrice.price)}
        </div>
        <p className="text-xs text-muted-foreground">(inkl. moms)</p>
      </div>

      {/* Lowest Price Card */}
      <div className="bg-card rounded-xl shadow-card p-4 sm:p-5 border border-border hover:shadow-lg transition-shadow">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2.5 bg-price-cheap/10 rounded-xl">
            <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-price-cheap" />
          </div>
          <div className="flex-1">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Dagens lägsta pris</p>
            <p className="text-sm sm:text-base font-semibold text-foreground">
              Klockan {formatHour(lowestPrice.hour)}
            </p>
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
          {formatPrice(lowestPrice.price)}
        </div>
        <p className="text-xs text-muted-foreground">(inkl. moms)</p>
      </div>
    </div>
  );
};

export default PriceHighLowCards;

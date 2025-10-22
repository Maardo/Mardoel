import { HourlyPrice, formatPrice, formatHour } from "@/utils/priceUtils";
import { TrendingUp, TrendingDown, Zap, Clock } from "lucide-react";

interface PriceHighLowCardsProps {
  prices: HourlyPrice[];
  cheapest4Window: { startIdx: number; endIdx: number; avgPrice: number } | null;
  rollingPrices: any[];
}

const PriceHighLowCards = ({ prices, cheapest4Window, rollingPrices }: PriceHighLowCardsProps) => {
  // Find highest and lowest prices for today
  const highestPrice = prices.reduce((max, p) => p.price > max.price ? p : max, prices[0]);
  const lowestPrice = prices.reduce((min, p) => p.price < min.price ? p : min, prices[0]);
  
  // Current price
  const currentHour = new Date().getHours();
  const currentPrice = prices.find((p) => p.hour === currentHour);
  
  // Best 4-hour charging window
  const best4HourWindow = cheapest4Window && rollingPrices.length > 0 ? {
    startHour: rollingPrices[cheapest4Window.startIdx]?.displayHour || "00:00",
    endHour: rollingPrices[cheapest4Window.endIdx]?.displayHour || "04:00",
    avgPrice: cheapest4Window.avgPrice
  } : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
      {/* Current Price Card */}
      <div className="bg-card rounded-xl shadow-card p-4 sm:p-5 border border-border hover:shadow-lg transition-shadow">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Elpriset just nu</p>
            <p className="text-sm sm:text-base font-semibold text-foreground">
              Klockan {formatHour(currentHour)}
            </p>
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
          {currentPrice ? formatPrice(currentPrice.price) : "-"}
        </div>
        <p className="text-xs text-muted-foreground">(inkl. moms)</p>
      </div>

      {/* Best 4-Hour Charging Window Card */}
      <div className="bg-card rounded-xl shadow-card p-4 sm:p-5 border border-border hover:shadow-lg transition-shadow">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2.5 bg-price-optimal/10 rounded-xl">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-price-optimal" />
          </div>
          <div className="flex-1">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Bästa 4-timmars laddning</p>
            <p className="text-sm sm:text-base font-semibold text-foreground">
              {best4HourWindow ? `${best4HourWindow.startHour} - ${best4HourWindow.endHour}` : "Beräknar..."}
            </p>
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
          {best4HourWindow ? formatPrice(best4HourWindow.avgPrice) : "-"}
        </div>
        <p className="text-xs text-muted-foreground">(snitt inkl. moms)</p>
      </div>

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

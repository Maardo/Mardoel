import { HourlyPrice, Rolling24HourPrice, formatPrice, formatHour } from "@/utils/priceUtils";
import { TrendingUp, TrendingDown, Zap, Battery } from "lucide-react";

interface PriceHighLowCardsProps {
  prices: HourlyPrice[];
  cheapest4Window: { startIdx: number; endIdx: number; avgPrice: number } | null;
  rollingPrices: Rolling24HourPrice[];
}

const PriceHighLowCards = ({ prices, cheapest4Window, rollingPrices }: PriceHighLowCardsProps) => {
  // Find highest and lowest prices for today
  const highestPrice = prices.reduce((max, p) => p.price > max.price ? p : max, prices[0]);
  const lowestPrice = prices.reduce((min, p) => p.price < min.price ? p : min, prices[0]);
  
  // Get current hour price
  const currentHour = new Date().getHours();
  const currentPrice = prices.find(p => p.hour === currentHour) || prices[0];
  
  // Format cheapest 4-hour window
  const formatWindowTime = () => {
    if (!cheapest4Window || rollingPrices.length === 0) return "Ej tillgänglig";
    const startHour = rollingPrices[cheapest4Window.startIdx];
    const endHour = rollingPrices[cheapest4Window.endIdx];
    return `${startHour.displayHour}-${endHour.displayHour}`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* Current Price Card */}
      <div className="bg-card rounded-lg shadow-card p-4 border border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Elpriset just nu</p>
            <p className="text-sm font-semibold text-foreground">
              Klockan {formatHour(currentPrice.hour)}
            </p>
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-foreground">
          {formatPrice(currentPrice.price)}
        </div>
        <p className="text-xs text-muted-foreground mt-1">(inkl. moms)</p>
      </div>

      {/* Cheapest 4-Hour Window Card */}
      <div className="bg-card rounded-lg shadow-card p-4 border border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-price-cheap/10 rounded-lg">
            <Battery className="w-5 h-5 text-price-cheap" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Bästa 4-timmars laddning</p>
            <p className="text-sm font-semibold text-foreground">
              {formatWindowTime()}
            </p>
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-foreground">
          {cheapest4Window ? formatPrice(cheapest4Window.avgPrice) : "—"}
        </div>
        <p className="text-xs text-muted-foreground mt-1">(inkl. moms)</p>
      </div>

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

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
      {/* Current Price Card */}
      <div className="bg-gradient-current rounded-xl shadow-elegant p-4 sm:p-5 lg:p-6 border border-status-current/20 hover:shadow-glow transition-all duration-300">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="p-2 sm:p-3 bg-white/20 rounded-lg backdrop-blur-sm">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-status-current-foreground" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-status-current-foreground/90 font-medium">Elpriset just nu</p>
            <p className="text-sm sm:text-base font-semibold text-status-current-foreground">
              Klockan {formatHour(currentPrice.hour)}
            </p>
          </div>
        </div>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-status-current-foreground">
          {formatPrice(currentPrice.price)}
        </div>
        <p className="text-xs sm:text-sm text-status-current-foreground/80 mt-2 font-medium">(inkl. moms)</p>
      </div>

      {/* Cheapest 4-Hour Window Card */}
      <div className="bg-gradient-best rounded-xl shadow-elegant p-4 sm:p-5 lg:p-6 border border-status-best/20 hover:shadow-glow transition-all duration-300">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="p-2 sm:p-3 bg-white/20 rounded-lg backdrop-blur-sm">
            <Battery className="w-5 h-5 sm:w-6 sm:h-6 text-status-best-foreground" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-status-best-foreground/90 font-medium">Bästa 4-timmars laddning</p>
            <p className="text-sm sm:text-base font-semibold text-status-best-foreground">
              {formatWindowTime()}
            </p>
          </div>
        </div>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-status-best-foreground">
          {cheapest4Window ? formatPrice(cheapest4Window.avgPrice) : "—"}
        </div>
        <p className="text-xs sm:text-sm text-status-best-foreground/80 mt-2 font-medium">(inkl. moms)</p>
      </div>

      {/* Highest Price Card */}
      <div className="bg-gradient-high rounded-xl shadow-elegant p-4 sm:p-5 border border-status-high/20 hover:shadow-glow transition-all duration-300">
        <div className="flex items-center gap-2 sm:gap-3 mb-3">
          <div className="p-2 sm:p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-status-high-foreground" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-status-high-foreground/90 font-medium">Dagens högsta pris</p>
            <p className="text-xs sm:text-sm font-semibold text-status-high-foreground">
              Klockan {formatHour(highestPrice.hour)}
            </p>
          </div>
        </div>
        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-status-high-foreground">
          {formatPrice(highestPrice.price)}
        </div>
        <p className="text-[10px] sm:text-xs text-status-high-foreground/80 mt-1.5 font-medium">(inkl. moms)</p>
      </div>

      {/* Lowest Price Card */}
      <div className="bg-gradient-low rounded-xl shadow-elegant p-4 sm:p-5 border border-status-low/20 hover:shadow-glow transition-all duration-300">
        <div className="flex items-center gap-2 sm:gap-3 mb-3">
          <div className="p-2 sm:p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
            <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-status-low-foreground" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-status-low-foreground/90 font-medium">Dagens lägsta pris</p>
            <p className="text-xs sm:text-sm font-semibold text-status-low-foreground">
              Klockan {formatHour(lowestPrice.hour)}
            </p>
          </div>
        </div>
        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-status-low-foreground">
          {formatPrice(lowestPrice.price)}
        </div>
        <p className="text-[10px] sm:text-xs text-status-low-foreground/80 mt-1.5 font-medium">(inkl. moms)</p>
      </div>
    </div>
  );
};

export default PriceHighLowCards;

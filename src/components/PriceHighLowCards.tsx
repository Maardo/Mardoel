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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
      {/* Current Price Card - Blue - Larger */}
      <div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-950 dark:to-blue-900 rounded-lg shadow-card p-3 sm:p-5 lg:p-6 border border-blue-300 dark:border-blue-700">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
          <div className="p-2 sm:p-3 bg-blue-600/30 dark:bg-blue-500/20 rounded-lg">
            <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-blue-800 dark:text-blue-300" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 font-medium">Elpriset just nu</p>
            <p className="text-sm sm:text-base font-semibold text-blue-950 dark:text-blue-50">
              Klockan {formatHour(currentPrice.hour)}
            </p>
          </div>
        </div>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-950 dark:text-blue-50">
          {formatPrice(currentPrice.price)}
        </div>
        <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 mt-1 sm:mt-2 font-medium">(inkl. moms)</p>
      </div>

      {/* Cheapest 4-Hour Window Card - Strong Green - Larger */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-lg shadow-card p-3 sm:p-5 lg:p-6 border border-green-600 dark:border-green-500">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
          <div className="p-2 sm:p-3 bg-white/20 dark:bg-black/20 rounded-lg">
            <Battery className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-green-50 font-medium">Bästa 4-timmars laddning</p>
            <p className="text-sm sm:text-base font-semibold text-white">
              {formatWindowTime()}
            </p>
          </div>
        </div>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
          {cheapest4Window ? formatPrice(cheapest4Window.avgPrice) : "—"}
        </div>
        <p className="text-xs sm:text-sm text-green-50 mt-1 sm:mt-2 font-medium">(inkl. moms)</p>
      </div>

      {/* Highest Price Card - Strong Red */}
      <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 rounded-lg shadow-card p-3 sm:p-4 border border-red-600 dark:border-red-500">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="p-1.5 sm:p-2 bg-white/20 dark:bg-black/20 rounded-lg">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-red-50 font-medium">Dagens högsta pris</p>
            <p className="text-xs sm:text-sm font-semibold text-white">
              Klockan {formatHour(highestPrice.hour)}
            </p>
          </div>
        </div>
        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
          {formatPrice(highestPrice.price)}
        </div>
        <p className="text-[10px] sm:text-xs text-red-50 mt-1 font-medium">(inkl. moms)</p>
      </div>

      {/* Lowest Price Card - Dark Green */}
      <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-950 dark:to-emerald-900 rounded-lg shadow-card p-3 sm:p-4 border border-emerald-300 dark:border-emerald-700">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="p-1.5 sm:p-2 bg-emerald-700/30 dark:bg-emerald-600/20 rounded-lg">
            <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-900 dark:text-emerald-300" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-emerald-800 dark:text-emerald-200 font-medium">Dagens lägsta pris</p>
            <p className="text-xs sm:text-sm font-semibold text-emerald-950 dark:text-emerald-50">
              Klockan {formatHour(lowestPrice.hour)}
            </p>
          </div>
        </div>
        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-950 dark:text-emerald-50">
          {formatPrice(lowestPrice.price)}
        </div>
        <p className="text-[10px] sm:text-xs text-emerald-700 dark:text-emerald-300 mt-1 font-medium">(inkl. moms)</p>
      </div>
    </div>
  );
};

export default PriceHighLowCards;

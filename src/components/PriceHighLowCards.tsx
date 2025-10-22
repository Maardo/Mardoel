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
      {/* Current Price Card - Blue */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-lg shadow-card p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-blue-700 dark:text-blue-300">Elpriset just nu</p>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Klockan {formatHour(currentPrice.hour)}
            </p>
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100">
          {formatPrice(currentPrice.price)}
        </div>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">(inkl. moms)</p>
      </div>

      {/* Cheapest 4-Hour Window Card - Green */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 rounded-lg shadow-card p-4 border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Battery className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs text-green-700 dark:text-green-300">Bästa 4-timmars laddning</p>
            <p className="text-sm font-semibold text-green-900 dark:text-green-100">
              {formatWindowTime()}
            </p>
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100">
          {cheapest4Window ? formatPrice(cheapest4Window.avgPrice) : "—"}
        </div>
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">(inkl. moms)</p>
      </div>

      {/* Highest Price Card - Red */}
      <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 rounded-lg shadow-card p-4 border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-xs text-red-700 dark:text-red-300">Dagens högsta pris</p>
            <p className="text-sm font-semibold text-red-900 dark:text-red-100">
              Klockan {formatHour(highestPrice.hour)}
            </p>
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-red-900 dark:text-red-100">
          {formatPrice(highestPrice.price)}
        </div>
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">(inkl. moms)</p>
      </div>

      {/* Lowest Price Card - Dark Green */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 rounded-lg shadow-card p-4 border border-emerald-200 dark:border-emerald-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-emerald-600/20 rounded-lg">
            <TrendingDown className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">Dagens lägsta pris</p>
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
              Klockan {formatHour(lowestPrice.hour)}
            </p>
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-emerald-900 dark:text-emerald-100">
          {formatPrice(lowestPrice.price)}
        </div>
        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">(inkl. moms)</p>
      </div>
    </div>
  );
};

export default PriceHighLowCards;

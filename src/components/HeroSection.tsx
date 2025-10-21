import { HourlyPrice, formatPrice, formatHour, getCurrentHourStatus } from "@/utils/priceUtils";
import { Zap, TrendingUp, TrendingDown, Clock } from "lucide-react";

interface HeroSectionProps {
  prices: HourlyPrice[];
  optimalWindow: { startHour: number; endHour: number; avgPrice: number } | null;
}

const HeroSection = ({ prices, optimalWindow }: HeroSectionProps) => {
  const currentHour = new Date().getHours();
  const currentPrice = prices.find((p) => p.hour === currentHour);
  const status = getCurrentHourStatus(prices);

  const getStatusColor = () => {
    if (status === "cheap") return "text-price-cheap";
    if (status === "expensive") return "text-price-expensive";
    return "text-foreground";
  };

  const getStatusIcon = () => {
    if (status === "cheap") return <TrendingDown className="w-8 h-8" />;
    if (status === "expensive") return <TrendingUp className="w-8 h-8" />;
    return <Zap className="w-8 h-8" />;
  };

  const getStatusText = () => {
    if (status === "cheap") return "Lågt pris";
    if (status === "expensive") return "Högt pris";
    return "Normalt pris";
  };

  return (
    <div className="bg-gradient-hero text-primary-foreground py-4 sm:py-6 md:py-12 shadow-elegant">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-8">
          {/* Current Price */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-white/20">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className={getStatusColor()}>{getStatusIcon()}</div>
              <div>
                <p className="text-xs sm:text-sm text-primary-foreground/80">Just nu</p>
                <p className="text-sm sm:text-base lg:text-lg font-semibold">{getStatusText()}</p>
              </div>
            </div>
            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
              {currentPrice ? formatPrice(currentPrice.price) : "-"}
            </div>
            <p className="text-xs sm:text-sm text-primary-foreground/80">
              Klockan {formatHour(currentHour)} (inkl. moms)
            </p>
          </div>

          {/* Best Charging Window */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-white/20">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Clock className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-price-optimal" />
              <div>
                <p className="text-xs sm:text-sm text-primary-foreground/80">Bästa laddningstid</p>
                <p className="text-sm sm:text-base lg:text-lg font-semibold">4-timmars fönster</p>
              </div>
            </div>
            {optimalWindow ? (
              <>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                  {formatHour(optimalWindow.startHour)} - {formatHour(optimalWindow.endHour + 1)}
                </div>
                <p className="text-xs sm:text-sm text-primary-foreground/80">
                  Snittpris: {formatPrice(Math.round(optimalWindow.avgPrice))} (inkl. moms)
                </p>
              </>
            ) : (
              <div className="text-xl sm:text-2xl text-primary-foreground/60">Beräknar...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;

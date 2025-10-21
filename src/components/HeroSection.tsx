import { HourlyPrice, formatPrice, formatHour, getCurrentHourStatus } from "@/utils/priceUtils";
import { Zap, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface HeroSectionProps {
  prices: HourlyPrice[];
  optimalWindow: { startHour: number; endHour: number; avgPrice: number } | null;
  lastUpdated: string;
  onRefresh: () => void;
}

const HeroSection = ({ prices, optimalWindow, lastUpdated, onRefresh }: HeroSectionProps) => {
  const currentHour = new Date().getHours();
  const currentPrice = prices.find((p) => p.hour === currentHour);
  const status = getCurrentHourStatus(prices);
  const [timeAgo, setTimeAgo] = useState("");

  useEffect(() => {
    const updateTimeAgo = () => {
      const now = new Date();
      const updated = new Date(lastUpdated);
      const diff = Math.floor((now.getTime() - updated.getTime()) / 1000 / 60);

      if (diff < 1) {
        setTimeAgo("Just nu");
      } else if (diff < 60) {
        setTimeAgo(`${diff} min sedan`);
      } else {
        const hours = Math.floor(diff / 60);
        setTimeAgo(`${hours} ${hours === 1 ? "timme" : "timmar"} sedan`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

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
    <div className="bg-gradient-hero text-primary-foreground py-8 md:py-12 shadow-elegant">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Current Price */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <div className={getStatusColor()}>{getStatusIcon()}</div>
              <div>
                <p className="text-sm text-primary-foreground/80">Just nu</p>
                <p className="text-lg font-semibold">{getStatusText()}</p>
              </div>
            </div>
            <div className="text-5xl font-bold mb-2">
              {currentPrice ? formatPrice(currentPrice.price) : "-"}
            </div>
            <p className="text-sm text-primary-foreground/80">
              Klockan {formatHour(currentHour)} (inkl. moms)
            </p>
          </div>

          {/* Best Charging Window */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-8 h-8 text-price-optimal" />
              <div>
                <p className="text-sm text-primary-foreground/80">Bästa laddningstid</p>
                <p className="text-lg font-semibold">4-timmars fönster</p>
              </div>
            </div>
            {optimalWindow ? (
              <>
                <div className="text-4xl font-bold mb-2">
                  {formatHour(optimalWindow.startHour)} - {formatHour(optimalWindow.endHour + 1)}
                </div>
                <p className="text-sm text-primary-foreground/80">
                  Snittpris: {formatPrice(Math.round(optimalWindow.avgPrice))} (inkl. moms)
                </p>
              </>
            ) : (
              <div className="text-2xl text-primary-foreground/60">Beräknar...</div>
            )}
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-6 flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
          <div>
            <p className="text-xs text-primary-foreground/70">Senast uppdaterad</p>
            <p className="text-sm font-semibold">{timeAgo}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="bg-white/10 border-white/20 hover:bg-white/20 text-primary-foreground"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Uppdatera
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;

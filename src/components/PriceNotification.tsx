import { useEffect, useState } from "react";
import { HourlyPrice, getCurrentHourStatus } from "@/utils/priceUtils";
import { Zap, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

interface PriceNotificationProps {
  prices: HourlyPrice[];
}

const PriceNotification = ({ prices }: PriceNotificationProps) => {
  const [lastStatus, setLastStatus] = useState<string | null>(null);

  useEffect(() => {
    const checkCurrentPrice = () => {
      const status = getCurrentHourStatus(prices);
      const currentHour = new Date().getHours();
      const currentPrice = prices.find((p) => p.hour === currentHour);

      if (!currentPrice || status === lastStatus) return;

      if (status === "cheap") {
        toast.success("Lågt elpris just nu!", {
          description: `${(currentPrice.price / 100).toFixed(2)} kr/kWh - perfekt tid att ladda!`,
          icon: <TrendingDown className="w-5 h-5" />,
          duration: 5000,
        });
      } else if (status === "expensive") {
        toast.error("Högt elpris just nu!", {
          description: `${(currentPrice.price / 100).toFixed(2)} kr/kWh - undvik energikrävande aktiviteter`,
          icon: <TrendingUp className="w-5 h-5" />,
          duration: 5000,
        });
      }

      setLastStatus(status);
    };

    // Check immediately
    checkCurrentPrice();

    // Check every minute
    const interval = setInterval(checkCurrentPrice, 60000);

    return () => clearInterval(interval);
  }, [prices, lastStatus]);

  const status = getCurrentHourStatus(prices);

  if (status === "normal") return null;

  return (
    <div
      className={`rounded-lg p-4 mb-6 flex items-center gap-3 ${
        status === "cheap"
          ? "bg-price-cheap text-price-cheap-foreground"
          : "bg-price-expensive text-price-expensive-foreground"
      }`}
    >
      <Zap className="w-6 h-6 flex-shrink-0" />
      <div>
        <p className="font-semibold">
          {status === "cheap" ? "Lågt elpris just nu!" : "Högt elpris just nu!"}
        </p>
        <p className="text-sm opacity-90">
          {status === "cheap"
            ? "Perfekt tillfälle att ladda din elbil eller använda vitvaror"
            : "Undvik energikrävande aktiviteter för att spara pengar"}
        </p>
      </div>
    </div>
  );
};

export default PriceNotification;

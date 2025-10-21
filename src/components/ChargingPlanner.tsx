import { useState } from "react";
import { HourlyPrice, findCheapestWindow, formatHour, formatPrice } from "@/utils/priceUtils";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

interface ChargingPlannerProps {
  prices: HourlyPrice[];
  onWindowSelect: (window: { startHour: number; endHour: number; avgPrice: number }) => void;
}

const ChargingPlanner = ({ prices, onWindowSelect }: ChargingPlannerProps) => {
  const [selectedWindow, setSelectedWindow] = useState(2);
  const [result, setResult] = useState(findCheapestWindow(prices, 2));

  const windowOptions = [2, 3, 4, 6];

  const handleWindowChange = (hours: number) => {
    setSelectedWindow(hours);
    const newResult = findCheapestWindow(prices, hours);
    setResult(newResult);
    onWindowSelect({ 
      startHour: newResult.startHour, 
      endHour: newResult.endHour,
      avgPrice: newResult.avgPrice 
    });
  };

  return (
    <div className="bg-card rounded-lg shadow-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-price-optimal-foreground" />
        <h3 className="text-lg font-semibold text-foreground">Laddningsplanerare</h3>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Hitta det billigaste fönstret för att ladda din elbil
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {windowOptions.map((hours) => (
          <Button
            key={hours}
            variant={selectedWindow === hours ? "default" : "outline"}
            onClick={() => handleWindowChange(hours)}
            size="sm"
          >
            {hours} timmar
          </Button>
        ))}
      </div>

      <div className="bg-price-optimal rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-price-optimal-foreground">
            Bästa laddningstid
          </span>
          <Zap className="w-4 h-4 text-price-optimal-foreground" />
        </div>
        <p className="text-2xl font-bold text-price-optimal-foreground mb-1">
          {formatHour(result.startHour)} - {formatHour(result.endHour + 1)}
        </p>
        <p className="text-lg font-semibold text-price-optimal-foreground">
          {formatPrice(result.avgPrice)}
        </p>
        <p className="text-xs text-price-optimal-foreground/80 mt-2">
          Detta är den billigaste {selectedWindow}-timmarsperioden idag
        </p>
      </div>
    </div>
  );
};

export default ChargingPlanner;

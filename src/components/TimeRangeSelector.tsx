import { useState } from "react";
import { HourlyPrice, calculateAveragePrice, formatHour, formatPrice } from "@/utils/priceUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock } from "lucide-react";

interface TimeRangeSelectorProps {
  prices: HourlyPrice[];
}

const TimeRangeSelector = ({ prices }: TimeRangeSelectorProps) => {
  const [startHour, setStartHour] = useState(0);
  const [endHour, setEndHour] = useState(23);

  const avgPrice = calculateAveragePrice(prices, startHour, endHour);

  return (
    <div className="bg-card rounded-lg shadow-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Snittprisberäknare</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Starttid
          </label>
          <Select
            value={startHour.toString()}
            onValueChange={(value) => setStartHour(parseInt(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {Array.from({ length: 24 }, (_, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {formatHour(i)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Sluttid
          </label>
          <Select
            value={endHour.toString()}
            onValueChange={(value) => setEndHour(parseInt(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {Array.from({ length: 24 }, (_, i) => (
                <SelectItem key={i} value={i.toString()} disabled={i < startHour}>
                  {formatHour(i)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-muted rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground mb-1">Snittpris för vald period</p>
        <p className="text-2xl font-bold text-foreground">{formatPrice(avgPrice)}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {endHour - startHour + 1} timmar
        </p>
      </div>
    </div>
  );
};

export default TimeRangeSelector;

import { useState } from "react";
import { HourlyPrice, calculateSavings } from "@/utils/priceUtils";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Calculator, TrendingDown } from "lucide-react";

interface CostCalculatorProps {
  todayPrices: HourlyPrice[];
  cheapestWindow: { avgPrice: number };
}

const CostCalculator = ({ todayPrices, cheapestWindow }: CostCalculatorProps) => {
  const [kWh, setKWh] = useState(40); // Default för elbil

  const avgNormalPrice =
    todayPrices.reduce((sum, p) => sum + p.price, 0) / todayPrices.length;
  const savings = calculateSavings(avgNormalPrice, cheapestWindow.avgPrice, kWh);

  return (
    <div className="bg-card rounded-lg shadow-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Kostnadsberäkning</h3>
      </div>

      <div className="mb-4">
        <Label htmlFor="kwh-calculator" className="text-sm font-medium mb-2 block">
          Förbrukning: {kWh} kWh
        </Label>
        <Slider
          id="kwh-calculator"
          min={0}
          max={100}
          step={1}
          value={[kWh]}
          onValueChange={(value) => setKWh(value[0])}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground mt-1">
          T.ex. 40 kWh för en elbilsladdning
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Normal kostnad</span>
          <span className="font-semibold text-foreground">
            {((avgNormalPrice / 100) * kWh).toFixed(2)} kr
          </span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Optimerad kostnad</span>
          <span className="font-semibold text-foreground">
            {((cheapestWindow.avgPrice / 100) * kWh).toFixed(2)} kr
          </span>
        </div>

        <div className="bg-price-cheap rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-price-cheap-foreground" />
            <span className="font-semibold text-price-cheap-foreground">Du sparar</span>
          </div>
          <span className="text-xl font-bold text-price-cheap-foreground">
            {savings.toFixed(2)} kr
          </span>
        </div>
      </div>
    </div>
  );
};

export default CostCalculator;

import { useState } from "react";
import { HourlyPrice, Rolling24HourPrice, formatPrice, formatHour, calculateSavings } from "@/utils/priceUtils";
import { Car, WashingMachine, UtensilsCrossed, Flame, Bath, Clock, TrendingDown, Settings } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CostCardsSimpleProps {
  prices: HourlyPrice[];
  rollingPrices: Rolling24HourPrice[];
}

interface CostCategory {
  id: string;
  name: string;
  icon: any;
  kWhRange: [number, number];
  hours: number;
}

const categories: CostCategory[] = [
  { id: "car", name: "Ladda bilen", icon: Car, kWhRange: [10, 100], hours: 6 },
  { id: "laundry", name: "Tvättmaskin/Torktumlare", icon: WashingMachine, kWhRange: [1, 2], hours: 3 },
  { id: "dishwasher", name: "Diskmaskin", icon: UtensilsCrossed, kWhRange: [1, 2], hours: 2 },
  { id: "bath", name: "Ett bad", icon: Bath, kWhRange: [3, 5], hours: 1 },
];

const CostCardsSimple = ({ prices, rollingPrices }: CostCardsSimpleProps) => {
  const [selectedCategory, setSelectedCategory] = useState<CostCategory | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customStartHour, setCustomStartHour] = useState<number>(0);
  const [customDuration, setCustomDuration] = useState<number>(1);
  const [customKwh, setCustomKwh] = useState<number>(0);

  const calculateCost = (kWh: number) => {
    const avgPrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
    return ((avgPrice / 100) * kWh).toFixed(2);
  };

  const findCheapestWindow = (windowSize: number) => {
    if (rollingPrices.length < windowSize) return null;
    
    let minSum = Infinity;
    let minStartIdx = 0;
    
    for (let i = 0; i <= rollingPrices.length - windowSize; i++) {
      const sum = rollingPrices.slice(i, i + windowSize).reduce((s, p) => s + p.price, 0);
      if (sum < minSum) {
        minSum = sum;
        minStartIdx = i;
      }
    }
    
    return {
      startIdx: minStartIdx,
      endIdx: minStartIdx + windowSize - 1,
      avgPrice: Math.round(minSum / windowSize)
    };
  };

  const handleCardClick = (category: CostCategory) => {
    setSelectedCategory(category);
    setCustomDuration(category.hours);
    setCustomKwh((category.kWhRange[0] + category.kWhRange[1]) / 2);
    setDialogOpen(true);
  };

  const calculateCustomCost = () => {
    if (!selectedCategory || rollingPrices.length === 0) return null;
    
    const endIdx = customStartHour + customDuration - 1;
    if (endIdx >= rollingPrices.length) return null;
    
    const relevantPrices = rollingPrices.slice(customStartHour, customStartHour + customDuration);
    const avgPrice = relevantPrices.reduce((sum, p) => sum + p.price, 0) / relevantPrices.length;
    const cost = ((avgPrice / 100) * customKwh).toFixed(2);
    
    const avgNormalPrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
    const savings = calculateSavings(avgNormalPrice, avgPrice, customKwh);
    
    return {
      cost,
      avgPrice: Math.round(avgPrice),
      savings,
      startHour: rollingPrices[customStartHour].displayHour,
      endHour: formatHour(rollingPrices[endIdx].originalHour + 1)
    };
  };

  const getRecommendedTime = () => {
    if (!selectedCategory) return null;
    const window = findCheapestWindow(selectedCategory.hours);
    if (!window || rollingPrices.length === 0) return null;
    
    const startHour = rollingPrices[window.startIdx];
    const endIdx = window.endIdx;
    
    // Calculate end hour correctly (add 1 hour to the last hour in the window)
    let endHourNum = rollingPrices[endIdx].originalHour + 1;
    let endHourDisplay = formatHour(endHourNum);
    
    const avgKwh = (selectedCategory.kWhRange[0] + selectedCategory.kWhRange[1]) / 2;
    const avgNormalPrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
    const savings = calculateSavings(avgNormalPrice, window.avgPrice, avgKwh);
    
    return {
      timeRange: `${startHour.displayHour} - ${endHourDisplay}`,
      price: window.avgPrice,
      savings
    };
  };

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h2 className="text-base sm:text-lg font-semibold mb-4 sm:mb-5 text-foreground">Beräkna kostnader</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
          {categories.map((category) => {
            const Icon = category.icon;
            const minCost = calculateCost(category.kWhRange[0]);
            const maxCost = calculateCost(category.kWhRange[1]);

            return (
              <button
                key={category.id}
                onClick={() => handleCardClick(category)}
                className="bg-card rounded-xl shadow-card p-3 sm:p-4 lg:p-5 border border-border hover:border-primary hover:shadow-glow transition-all duration-300 cursor-pointer text-left group"
              >
                <div className="flex flex-col items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-2.5 sm:p-3 lg:p-3.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-all duration-300">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-foreground text-center leading-tight">
                    {category.name}
                  </h3>
                </div>
                <div className="text-center">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">
                    ({category.kWhRange[0]} - {category.kWhRange[1]} kWh)
                  </p>
                  <p className="text-sm sm:text-base lg:text-lg font-bold text-foreground">
                    {minCost} - {maxCost} kr
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCategory && <selectedCategory.icon className="w-5 h-5 text-primary" />}
              {selectedCategory?.name}
            </DialogTitle>
            <DialogDescription>
              Optimera din kostnad genom att välja rätt tid
            </DialogDescription>
          </DialogHeader>
          
          {selectedCategory && getRecommendedTime() && (
            <div className="space-y-3 sm:space-y-4">
              {/* Recommended Time Section */}
              <div>
                <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 flex items-center gap-2">
                  <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
                  Rekommenderad tid (billigast)
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="bg-card rounded-lg p-3 sm:p-4 border border-border">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Bästa tid</p>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">
                      {getRecommendedTime()?.timeRange}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                      {selectedCategory.hours} {selectedCategory.hours === 1 ? 'timme' : 'timmar'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="bg-card rounded-lg p-2 sm:p-3 border border-border">
                      <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-0.5 sm:mb-1">Pris</p>
                      <p className="text-sm sm:text-lg font-bold text-foreground">
                        {formatPrice(getRecommendedTime()!.price)}
                      </p>
                    </div>
                    <div className="bg-price-cheap rounded-lg p-2 sm:p-3">
                      <p className="text-[10px] sm:text-xs font-semibold text-price-cheap-foreground mb-0.5 sm:mb-1">Besparing</p>
                      <p className="text-sm sm:text-lg font-bold text-price-cheap-foreground">
                        {getRecommendedTime()!.savings.toFixed(2)} kr
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Custom Time Selection Section */}
              <div>
                <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 flex items-center gap-2">
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                  Välj egen tid
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <Label htmlFor="kwh-slider" className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
                      Förbrukning: {customKwh} kWh
                    </Label>
                    <Slider
                      id="kwh-slider"
                      min={selectedCategory.kWhRange[0]}
                      max={selectedCategory.kWhRange[1]}
                      step={selectedCategory.kWhRange[1] > 10 ? 5 : 0.5}
                      value={[customKwh]}
                      onValueChange={(value) => setCustomKwh(value[0])}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label htmlFor="start-hour-slider" className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
                      Starttid: {rollingPrices[customStartHour]?.displayHour}
                    </Label>
                    <Slider
                      id="start-hour-slider"
                      min={0}
                      max={Math.max(0, rollingPrices.length - customDuration)}
                      step={1}
                      value={[customStartHour]}
                      onValueChange={(value) => setCustomStartHour(value[0])}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label htmlFor="duration-slider" className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
                      Varaktighet: {customDuration} {customDuration === 1 ? 'timme' : 'timmar'}
                    </Label>
                    <Slider
                      id="duration-slider"
                      min={1}
                      max={Math.min(12, rollingPrices.length - customStartHour)}
                      step={1}
                      value={[customDuration]}
                      onValueChange={(value) => setCustomDuration(value[0])}
                      className="w-full"
                    />
                  </div>

                  {calculateCustomCost() && (
                    <div className="bg-muted/50 rounded-lg p-3 sm:p-4 border border-border">
                      <div className="space-y-1.5 sm:space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-muted-foreground">Tid:</span>
                          <span className="text-xs sm:text-sm font-semibold">
                            {calculateCustomCost()!.startHour} - {calculateCustomCost()!.endHour}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-muted-foreground">Genomsnittspris:</span>
                          <span className="text-xs sm:text-sm font-semibold">
                            {formatPrice(calculateCustomCost()!.avgPrice)}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <span className="text-sm sm:text-base font-semibold">Total kostnad:</span>
                          <span className="text-lg sm:text-xl font-bold text-primary">
                            {calculateCustomCost()!.cost} kr
                          </span>
                        </div>
                        {calculateCustomCost()!.savings > 0 && (
                          <div className="flex justify-between items-center text-price-cheap-foreground">
                            <span className="text-xs sm:text-sm">Besparing:</span>
                            <span className="text-xs sm:text-sm font-semibold">
                              {calculateCustomCost()!.savings.toFixed(2)} kr
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[10px] sm:text-xs text-muted-foreground bg-muted/50 rounded p-2 sm:p-3">
                <p>
                  Välj förbrukning, starttid och varaktighet för att se din beräknade kostnad.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CostCardsSimple;

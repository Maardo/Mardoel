import { useState } from "react";
import { HourlyPrice, Rolling24HourPrice, formatPrice, formatHour, calculateSavings } from "@/utils/priceUtils";
import { Car, WashingMachine, UtensilsCrossed, Flame, Bath, Clock, TrendingDown } from "lucide-react";
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
  { id: "laundry", name: "Tvättmaskin", icon: WashingMachine, kWhRange: [1, 2], hours: 2 },
  { id: "dishwasher", name: "Diskmaskin", icon: UtensilsCrossed, kWhRange: [1, 2], hours: 2 },
  { id: "oven", name: "Ugn", icon: Flame, kWhRange: [2, 3], hours: 1 },
  { id: "bath", name: "Ett bad", icon: Bath, kWhRange: [3, 5], hours: 1 },
];

const CostCardsSimple = ({ prices, rollingPrices }: CostCardsSimpleProps) => {
  const [selectedCategory, setSelectedCategory] = useState<CostCategory | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    setDialogOpen(true);
  };

  const getRecommendedTime = () => {
    if (!selectedCategory) return null;
    const window = findCheapestWindow(selectedCategory.hours);
    if (!window || rollingPrices.length === 0) return null;
    
    const startHour = rollingPrices[window.startIdx];
    const endHour = rollingPrices[window.endIdx];
    const avgKwh = (selectedCategory.kWhRange[0] + selectedCategory.kWhRange[1]) / 2;
    const avgNormalPrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
    const savings = calculateSavings(avgNormalPrice, window.avgPrice, avgKwh);
    
    return {
      timeRange: `${startHour.displayHour} - ${endHour.displayHour}`,
      price: window.avgPrice,
      savings
    };
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Beräkna kostnader</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            const avgKwh = (category.kWhRange[0] + category.kWhRange[1]) / 2;
            const cost = calculateCost(avgKwh);

            return (
              <button
                key={category.id}
                onClick={() => handleCardClick(category)}
                className="bg-card rounded-lg shadow-card p-4 border border-border hover:border-primary hover:shadow-elegant transition-all cursor-pointer text-left"
              >
                <div className="flex flex-col items-center gap-2 mb-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground text-center">
                    {category.name}
                  </h3>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">
                    {category.kWhRange[0]}-{category.kWhRange[1]} kWh
                  </p>
                  <p className="text-lg font-bold text-foreground">{cost} kr</p>
                  <p className="text-xs text-muted-foreground">just nu</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCategory && <selectedCategory.icon className="w-5 h-5 text-primary" />}
              {selectedCategory?.name}
            </DialogTitle>
            <DialogDescription>
              Rekommenderad tid för laddning baserat på lägsta elpriser
            </DialogDescription>
          </DialogHeader>
          
          {selectedCategory && getRecommendedTime() && (
            <div className="space-y-4">
              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Rekommenderad tid</p>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {getRecommendedTime()?.timeRange}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedCategory.hours} {selectedCategory.hours === 1 ? 'timme' : 'timmar'}
                </p>
              </div>

              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Genomsnittligt pris</p>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {formatPrice(getRecommendedTime()!.price)}
                </p>
              </div>

              <div className="bg-price-cheap rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-price-cheap-foreground" />
                  <p className="text-sm font-semibold text-price-cheap-foreground">Du sparar</p>
                </div>
                <p className="text-3xl font-bold text-price-cheap-foreground">
                  {getRecommendedTime()!.savings.toFixed(2)} kr
                </p>
                <p className="text-sm text-price-cheap-foreground/80 mt-1">
                  jämfört med genomsnittspris
                </p>
              </div>

              <div className="text-xs text-muted-foreground bg-muted/50 rounded p-3">
                <p>
                  Beräkningen baseras på {selectedCategory.kWhRange[0]}-{selectedCategory.kWhRange[1]} kWh 
                  förbrukning under {selectedCategory.hours} {selectedCategory.hours === 1 ? 'timme' : 'timmar'}.
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

import { useState } from "react";
import { HourlyPrice } from "@/utils/priceUtils";
import { Car, WashingMachine, Utensils, Microwave, Bath } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CostCardsProps {
  prices: HourlyPrice[];
}

interface CostCategory {
  id: string;
  name: string;
  icon: any;
  kWhRange: string;
  kWhMin: number;
  kWhMax: number;
}

const categories: CostCategory[] = [
  {
    id: "car",
    name: "Ladda din elbil",
    icon: Car,
    kWhRange: "40 - 100 kWh",
    kWhMin: 40,
    kWhMax: 100,
  },
  {
    id: "laundry",
    name: "Tvätta & torktumla",
    icon: WashingMachine,
    kWhRange: "2 - 4 kWh",
    kWhMin: 2,
    kWhMax: 4,
  },
  {
    id: "dishwasher",
    name: "Diskmaskin",
    icon: Utensils,
    kWhRange: "0.7 - 1.5 kWh",
    kWhMin: 0.7,
    kWhMax: 1.5,
  },
  {
    id: "oven",
    name: "Ugn i 30 min",
    icon: Microwave,
    kWhRange: "1.1 kWh",
    kWhMin: 1.1,
    kWhMax: 1.1,
  },
  {
    id: "bath",
    name: "Ett bad",
    icon: Bath,
    kWhRange: "7.5 kWh",
    kWhMin: 7.5,
    kWhMax: 7.5,
  },
];

const CostCards = ({ prices }: CostCardsProps) => {
  const [selectedCategory, setSelectedCategory] = useState<CostCategory | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const calculateCost = (kWh: number) => {
    const currentHour = new Date().getHours();
    
    // Get prices for current hour + next 2 hours
    const next3Hours = [currentHour, currentHour + 1, currentHour + 2]
      .map(h => h % 24)
      .map(h => prices.find(p => p.hour === h))
      .filter(Boolean) as HourlyPrice[];

    if (next3Hours.length === 0) return { min: 0, max: 0, avg: 0 };

    const avgPrice = next3Hours.reduce((sum, p) => sum + p.price, 0) / next3Hours.length;
    const costOre = avgPrice * kWh;
    const costKr = costOre / 100;

    return { cost: costKr };
  };

  const handleCardClick = (category: CostCategory) => {
    setSelectedCategory(category);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {categories.map((category) => {
          const Icon = category.icon;
          const minCost = calculateCost(category.kWhMin).cost;
          const maxCost = calculateCost(category.kWhMax).cost;
          const costText = category.kWhMin === category.kWhMax 
            ? `${minCost.toFixed(2)} kr`
            : `${minCost.toFixed(2)} - ${maxCost.toFixed(2)} kr`;

          return (
            <button
              key={category.id}
              onClick={() => handleCardClick(category)}
              className="bg-card rounded-lg shadow-card p-6 border border-border hover:shadow-elegant transition-all hover:scale-105 cursor-pointer text-center"
            >
              <Icon className="w-12 h-12 mx-auto mb-3 text-primary" />
              <h4 className="font-semibold text-foreground mb-1 text-sm">
                {category.name}
              </h4>
              <p className="text-xs text-muted-foreground mb-2">
                ({category.kWhRange})
              </p>
              <p className="text-lg font-bold text-primary">
                {costText}
              </p>
            </button>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCategory && <selectedCategory.icon className="w-6 h-6" />}
              {selectedCategory?.name}
            </DialogTitle>
            <DialogDescription>
              Kostnad baserat på priset nu och de kommande 2 timmarna
            </DialogDescription>
          </DialogHeader>
          {selectedCategory && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Förbrukning</p>
                <p className="text-lg font-semibold">{selectedCategory.kWhRange}</p>
              </div>
              <div className="bg-price-cheap/10 rounded-lg p-4 border-2 border-price-cheap">
                <p className="text-sm text-muted-foreground mb-1">Beräknad kostnad (inkl. moms)</p>
                <p className="text-3xl font-bold text-price-cheap">
                  {selectedCategory.kWhMin === selectedCategory.kWhMax 
                    ? `${calculateCost(selectedCategory.kWhMin).cost.toFixed(2)} kr`
                    : `${calculateCost(selectedCategory.kWhMin).cost.toFixed(2)} - ${calculateCost(selectedCategory.kWhMax).cost.toFixed(2)} kr`
                  }
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                * Kostnaden är beräknad baserat på genomsnittspriset för nuvarande timme och de kommande 2 timmarna.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CostCards;

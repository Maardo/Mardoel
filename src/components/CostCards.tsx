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
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

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
  const [startHour, setStartHour] = useState(new Date().getHours());
  const [duration, setDuration] = useState(3);

  const calculateCost = (kWh: number, customStartHour?: number, customDuration?: number) => {
    const start = customStartHour ?? new Date().getHours();
    const dur = customDuration ?? 3;
    
    // Get prices for selected hours
    const hours = Array.from({ length: dur }, (_, i) => (start + i) % 24);
    const selectedHours = hours
      .map(h => prices.find(p => p.hour === h))
      .filter(Boolean) as HourlyPrice[];

    if (selectedHours.length === 0) return { cost: 0, avgPrice: 0, totalCost: 0 };

    const avgPrice = selectedHours.reduce((sum, p) => sum + p.price, 0) / selectedHours.length;
    const totalCostOre = avgPrice * kWh;
    const totalCostKr = totalCostOre / 100;

    return { cost: totalCostKr, avgPrice: avgPrice / 100, totalCost: totalCostKr };
  };

  const handleCardClick = (category: CostCategory) => {
    setSelectedCategory(category);
    setStartHour(new Date().getHours());
    setDuration(3);
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
            <div className="space-y-6">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Förbrukning</p>
                <p className="text-lg font-semibold">{selectedCategory.kWhRange}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="start-hour" className="text-sm font-medium mb-2 block">
                    Starttimme: {startHour.toString().padStart(2, '0')}:00
                  </Label>
                  <Slider
                    id="start-hour"
                    min={0}
                    max={23}
                    step={1}
                    value={[startHour]}
                    onValueChange={(value) => setStartHour(value[0])}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="duration" className="text-sm font-medium mb-2 block">
                    Varaktighet: {duration} {duration === 1 ? 'timme' : 'timmar'}
                  </Label>
                  <Slider
                    id="duration"
                    min={1}
                    max={12}
                    step={1}
                    value={[duration]}
                    onValueChange={(value) => setDuration(value[0])}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="bg-price-cheap/10 rounded-lg p-4 border-2 border-price-cheap">
                <p className="text-sm text-muted-foreground mb-1">Beräknad kostnad (inkl. moms)</p>
                <p className="text-3xl font-bold text-price-cheap">
                  {selectedCategory.kWhMin === selectedCategory.kWhMax 
                    ? `${calculateCost(selectedCategory.kWhMin, startHour, duration).totalCost.toFixed(2)} kr`
                    : `${calculateCost(selectedCategory.kWhMin, startHour, duration).totalCost.toFixed(2)} - ${calculateCost(selectedCategory.kWhMax, startHour, duration).totalCost.toFixed(2)} kr`
                  }
                </p>
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Snittpris: {calculateCost(selectedCategory.kWhMin, startHour, duration).avgPrice.toFixed(2)} kr/kWh
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Period: {startHour.toString().padStart(2, '0')}:00 - {((startHour + duration) % 24).toString().padStart(2, '0')}:00
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CostCards;

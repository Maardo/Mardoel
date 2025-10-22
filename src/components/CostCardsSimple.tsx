import { HourlyPrice } from "@/utils/priceUtils";
import { Car, WashingMachine, Utensils, Microwave, Bath } from "lucide-react";

interface CostCardsSimpleProps {
  prices: HourlyPrice[];
}

interface CostCategory {
  id: string;
  name: string;
  icon: any;
  kWhRange: string;
  kWh: number;
}

const categories: CostCategory[] = [
  {
    id: "car",
    name: "Ladda din elbil",
    icon: Car,
    kWhRange: "10 - 100 kWh",
    kWh: 55,
  },
  {
    id: "laundry",
    name: "Tvätta & torktumla",
    icon: WashingMachine,
    kWhRange: "2 - 4 kWh",
    kWh: 3,
  },
  {
    id: "dishwasher",
    name: "Diskmaskin",
    icon: Utensils,
    kWhRange: "0.7 - 1.5 kWh",
    kWh: 1.1,
  },
  {
    id: "oven",
    name: "Ugn i 30 min",
    icon: Microwave,
    kWhRange: "1.1 kWh",
    kWh: 1.1,
  },
  {
    id: "bath",
    name: "Ett bad",
    icon: Bath,
    kWhRange: "7.5 kWh",
    kWh: 7.5,
  },
];

const CostCardsSimple = ({ prices }: CostCardsSimpleProps) => {
  const calculateCost = (kWh: number) => {
    const currentHour = new Date().getHours();
    const currentPrice = prices.find(p => p.hour === currentHour);
    
    if (!currentPrice) return { cost: 0, pricePerKwh: 0 };
    
    // Price is in öre/kWh, convert to kr
    const pricePerKwhKr = currentPrice.price / 100;
    const totalCostKr = pricePerKwhKr * kWh;
    
    return { cost: totalCostKr, pricePerKwh: pricePerKwhKr };
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
      {categories.map((category) => {
        const Icon = category.icon;
        const { cost } = calculateCost(category.kWh);

        return (
          <div
            key={category.id}
            className="bg-card rounded-xl shadow-card p-3 sm:p-4 lg:p-5 border border-border text-center hover:shadow-lg transition-all"
          >
            <Icon className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mx-auto mb-2 sm:mb-3 text-primary" />
            <h4 className="font-semibold text-foreground mb-1 text-xs sm:text-sm">
              {category.name}
            </h4>
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-2">
              ({category.kWhRange})
            </p>
            <p className="text-sm sm:text-base lg:text-lg font-bold text-primary">
              {cost.toFixed(2)} kr
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">just nu</p>
          </div>
        );
      })}
    </div>
  );
};

export default CostCardsSimple;

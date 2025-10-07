import { useState, useEffect } from "react";
import {
  fetchPriceData,
  getCheapestHours,
  getExpensiveHours,
  findCheapestWindow,
  PriceData,
} from "@/utils/priceUtils";
import PriceTable from "@/components/PriceTable";
import PriceChart from "@/components/PriceChart";
import TimeRangeSelector from "@/components/TimeRangeSelector";
import ChargingPlanner from "@/components/ChargingPlanner";
import CostCalculator from "@/components/CostCalculator";
import PriceNotification from "@/components/PriceNotification";
import LastUpdated from "@/components/LastUpdated";
import { Zap } from "lucide-react";

const Index = () => {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimalWindow, setOptimalWindow] = useState<{
    startHour: number;
    endHour: number;
  } | null>(null);

  const currentHour = new Date().getHours();
  const cheapHours = priceData ? getCheapestHours(priceData.today) : [];
  const expensiveHours = priceData ? getExpensiveHours(priceData.today) : [];

  const loadPrices = async () => {
    setLoading(true);
    const data = await fetchPriceData();
    setPriceData(data);
    setOptimalWindow(findCheapestWindow(data.today, 2));
    setLoading(false);
  };

  // Initial load
  useEffect(() => {
    loadPrices();
  }, []);

  // Auto-refresh every hour
  useEffect(() => {
    const interval = setInterval(() => {
      loadPrices();
    }, 3600000); // 1 hour

    return () => clearInterval(interval);
  }, []);

  if (loading || !priceData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Zap className="w-12 h-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">Laddar elpriser...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-hero text-primary-foreground py-8 shadow-elegant">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8" />
            <h1 className="text-3xl md:text-4xl font-bold">Elpriser SE3</h1>
          </div>
          <p className="text-primary-foreground/90">
            Aktuella elpriser och smart laddningsplanering för Sverige
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Price Notification */}
        <PriceNotification prices={priceData.today} />

        {/* Last Updated */}
        <div className="mb-6">
          <LastUpdated lastUpdated={priceData.lastUpdated} onRefresh={loadPrices} />
        </div>

        {/* Legend */}
        <div className="bg-card rounded-lg shadow-card p-4 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Färgkodning</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-price-cheap"></div>
              <span className="text-sm text-muted-foreground">3 billigaste timmarna</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-price-expensive"></div>
              <span className="text-sm text-muted-foreground">3 dyraste timmarna</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-price-optimal"></div>
              <span className="text-sm text-muted-foreground">Bästa laddningsfönster</span>
            </div>
          </div>
        </div>

        {/* Tools Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChargingPlanner
            prices={priceData.today}
            onWindowSelect={setOptimalWindow}
          />
          <TimeRangeSelector prices={priceData.today} />
        </div>

        {/* Cost Calculator */}
        <div className="mb-6">
          <CostCalculator
            todayPrices={priceData.today}
            cheapestWindow={findCheapestWindow(priceData.today, 2)}
          />
        </div>

        {/* Chart */}
        <div className="mb-6">
          <PriceChart
            todayPrices={priceData.today}
            yesterdayPrices={priceData.yesterday}
            optimalWindow={optimalWindow}
          />
        </div>

        {/* Price Table */}
        <div className="mb-6">
          <PriceTable
            prices={priceData.today}
            title="Dagens priser"
            cheapHours={cheapHours}
            expensiveHours={expensiveHours}
            optimalWindow={optimalWindow}
            currentHour={currentHour}
          />
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Live-priser från Nord Pool via Lovable Cloud. Data uppdateras automatiskt varje timme.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

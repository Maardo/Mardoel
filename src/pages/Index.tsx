import { useState, useEffect } from "react";
import {
  generateMockPriceData,
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
  const [priceData, setPriceData] = useState<PriceData>(generateMockPriceData());
  const [optimalWindow, setOptimalWindow] = useState<{
    startHour: number;
    endHour: number;
  }>(findCheapestWindow(generateMockPriceData().today, 2));

  const currentHour = new Date().getHours();
  const cheapHours = getCheapestHours(priceData.today);
  const expensiveHours = getExpensiveHours(priceData.today);

  const handleRefresh = () => {
    const newData = generateMockPriceData();
    setPriceData(newData);
  };

  // Auto-refresh every hour
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 3600000); // 1 hour

    return () => clearInterval(interval);
  }, []);

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
          <LastUpdated lastUpdated={priceData.lastUpdated} onRefresh={handleRefresh} />
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

        {/* Price Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PriceTable
            prices={priceData.today}
            title="Dagens priser"
            cheapHours={cheapHours}
            expensiveHours={expensiveHours}
            optimalWindow={optimalWindow}
            currentHour={currentHour}
          />
          <PriceTable
            prices={priceData.yesterday}
            title="Gårdagens priser"
          />
        </div>

        {/* API Integration Instructions */}
        <div className="mt-8 bg-muted rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-3">
            Integration med Node.js Backend
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              För att koppla mot live-data från Nord Pool, ersätt <code className="bg-background px-2 py-1 rounded">generateMockPriceData()</code> med ett fetch-anrop till din Node.js-proxy:
            </p>
            <pre className="bg-background p-3 rounded overflow-x-auto mt-2">
{`// I utils/priceUtils.ts
export const fetchPriceData = async (): Promise<PriceData> => {
  const response = await fetch('/api/prices/se3');
  return await response.json();
};`}
            </pre>
            <p className="mt-2">
              Backend-proxy bör returnera samma format som <code className="bg-background px-2 py-1 rounded">PriceData</code> interfacet.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Data är mockad för demo. Koppla till Nord Pool API via Node.js-proxy för live-priser.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

import { useState, useMemo } from "react";
import { findCheapestWindow, createRolling24HourView } from "@/utils/priceUtils";
import PriceChart from "@/components/PriceChart";
import PriceHighLowCards from "@/components/PriceHighLowCards";
import CostCardsSimple from "@/components/CostCardsSimple";
import RegionSelector, { Region } from "@/components/RegionSelector";
import CostSettings from "@/components/CostSettings";
import { Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { usePriceData } from "@/hooks/usePriceData";
import { useCostSettings } from "@/hooks/useCostSettings";
const Index = () => {
  const [selectedRegion, setSelectedRegion] = useLocalStorage<Region>("elpriser-region", "SE3");
  const [selectedHourWindow, setSelectedHourWindow] = useState<number | null>(null);
  const {
    data: priceData,
    isLoading,
    refetch,
    isRefetching
  } = usePriceData(selectedRegion);
  const {
    settings,
    setSettings,
    calculateRealPrice
  } = useCostSettings();
  const currentHour = new Date().getHours();

  // Memoized rolling 24-hour view with real cost calculation
  const rolling24Hours = useMemo(() => {
    if (!priceData) return [];
    const rolling = createRolling24HourView(priceData.today, priceData.tomorrow, currentHour);
    return settings.showRealCost ? rolling.map(p => ({
      ...p,
      price: calculateRealPrice(p.price)
    })) : rolling;
  }, [priceData, currentHour, settings.showRealCost, calculateRealPrice]);

  // Memoized today prices with real cost
  const adjustedTodayPrices = useMemo(() => {
    if (!priceData) return [];
    return settings.showRealCost ? priceData.today.map(p => ({
      ...p,
      price: calculateRealPrice(p.price)
    })) : priceData.today;
  }, [priceData, settings.showRealCost, calculateRealPrice]);

  // Memoized cheapest 4-hour window calculation
  const cheapest4Window = useMemo(() => {
    if (rolling24Hours.length < 4) return null;
    let minSum = Infinity;
    let minStartIdx = 0;
    for (let i = 0; i <= rolling24Hours.length - 4; i++) {
      const sum = rolling24Hours.slice(i, i + 4).reduce((s, p) => s + p.price, 0);
      if (sum < minSum) {
        minSum = sum;
        minStartIdx = i;
      }
    }
    return {
      startIdx: minStartIdx,
      endIdx: minStartIdx + 3,
      avgPrice: Math.round(minSum / 4)
    };
  }, [rolling24Hours]);

  // Memoized selected window calculation
  const selectedWindow = useMemo(() => {
    if (!selectedHourWindow || rolling24Hours.length < selectedHourWindow) return null;
    let minSum = Infinity;
    let minStartIdx = 0;
    for (let i = 0; i <= rolling24Hours.length - selectedHourWindow; i++) {
      const sum = rolling24Hours.slice(i, i + selectedHourWindow).reduce((s, p) => s + p.price, 0);
      if (sum < minSum) {
        minSum = sum;
        minStartIdx = i;
      }
    }
    return {
      startIdx: minStartIdx,
      endIdx: minStartIdx + selectedHourWindow - 1,
      avgPrice: Math.round(minSum / selectedHourWindow)
    };
  }, [rolling24Hours, selectedHourWindow]);

  // Memoized optimal window for today
  const optimalWindow = useMemo(() => {
    if (!priceData) return null;
    return findCheapestWindow(adjustedTodayPrices, 4);
  }, [priceData, adjustedTodayPrices]);
  const loading = isLoading || isRefetching;
  if (isLoading || !priceData) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Zap className="w-12 h-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">Laddar elpriser...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-hero text-primary-foreground py-6 sm:py-8 shadow-elegant border-b-2 border-primary/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4">
            {/* Top row with title and buttons */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <Zap className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Elpriser Sverige</h1>
                  <p className="text-xs sm:text-sm text-primary-foreground/80">
                    Live spotpriser och smart laddning
                    {settings.showRealCost}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <CostSettings settings={settings} onSettingsChange={setSettings} />
                <Button onClick={() => refetch()} size="sm" variant="secondary" disabled={loading} className="backdrop-blur-sm hover:scale-105 transition-all duration-300 shadow-lg">
                  <RefreshCw className={`w-4 h-4 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Uppdatera</span>
                </Button>
              </div>
            </div>
            
            {/* Region selector row */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-primary-foreground/80 font-medium">Välj elområde:</span>
              <RegionSelector selectedRegion={selectedRegion} onRegionChange={setSelectedRegion} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 lg:py-8">
        {/* High/Low Price Cards */}
        <PriceHighLowCards prices={adjustedTodayPrices} cheapest4Window={cheapest4Window} rollingPrices={rolling24Hours} />

        {/* Cost Cards */}
        <CostCardsSimple prices={adjustedTodayPrices} rollingPrices={rolling24Hours} />

        {/* Price Chart Section */}
        <div className="mb-4 sm:mb-6">
          {rolling24Hours.length > 0 && <PriceChart rollingPrices={rolling24Hours} optimalWindow={null} selectedHourWindow={selectedHourWindow} onSelectedHourWindowChange={setSelectedHourWindow} selectedWindow={selectedWindow} currentHour={currentHour} />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Live spotpriser via Elpriset Just Nu API. Data uppdateras automatiskt var 15:e minut.
          </p>
          <div className="text-xs mt-2">
            {priceData.tomorrow ? "✓ Morgondagens priser tillgängliga" : "⏳ Väntar på morgondagens priser (publiceras 13:00-14:00)"}
          </div>
          <p className="text-xs mt-2 opacity-60">
            Made by Mardo
          </p>
        </div>
      </footer>
    </div>;
};
export default Index;
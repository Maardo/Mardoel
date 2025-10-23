import { useState, useEffect } from "react";
import {
  fetchPriceData,
  findCheapestWindow,
  PriceData,
  createRolling24HourView,
} from "@/utils/priceUtils";
import PriceChart from "@/components/PriceChart";
import PriceHighLowCards from "@/components/PriceHighLowCards";
import CostCardsSimple from "@/components/CostCardsSimple";
import { Zap, Info, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimalWindow, setOptimalWindow] = useState<{
    startHour: number;
    endHour: number;
    avgPrice: number;
  } | null>(null);
  const [selectedHourWindow, setSelectedHourWindow] = useState<number | null>(null);

  const currentHour = new Date().getHours();
  
  // Create rolling 24-hour view
  const rolling24Hours = priceData 
    ? createRolling24HourView(priceData.today, priceData.tomorrow, currentHour)
    : [];

  // Calculate optimal window for the rolling view (using index-based calculation)
  let cheapest4Window: { startIdx: number; endIdx: number; avgPrice: number } | null = null;
  if (rolling24Hours.length >= 4) {
    let minSum = Infinity;
    let minStartIdx = 0;
    
    for (let i = 0; i <= rolling24Hours.length - 4; i++) {
      const sum = rolling24Hours.slice(i, i + 4).reduce((s, p) => s + p.price, 0);
      if (sum < minSum) {
        minSum = sum;
        minStartIdx = i;
      }
    }
    
    cheapest4Window = {
      startIdx: minStartIdx,
      endIdx: minStartIdx + 3,
      avgPrice: Math.round(minSum / 4)
    };
  }

  // Calculate selected window - find cheapest consecutive hours by index in rolling array
  let selectedWindow: { startIdx: number; endIdx: number; avgPrice: number } | null = null;
  if (selectedHourWindow && rolling24Hours.length >= selectedHourWindow) {
    let minSum = Infinity;
    let minStartIdx = 0;
    
    for (let i = 0; i <= rolling24Hours.length - selectedHourWindow; i++) {
      const sum = rolling24Hours.slice(i, i + selectedHourWindow).reduce((s, p) => s + p.price, 0);
      if (sum < minSum) {
        minSum = sum;
        minStartIdx = i;
      }
    }
    
    selectedWindow = {
      startIdx: minStartIdx,
      endIdx: minStartIdx + selectedHourWindow - 1,
      avgPrice: Math.round(minSum / selectedHourWindow)
    };
  }

  const loadPrices = async () => {
    setLoading(true);
    const data = await fetchPriceData();
    setPriceData(data);
    
    // Calculate optimal window for hero section (today only)
    const todayOptimal = findCheapestWindow(data.today, 4);
    setOptimalWindow(todayOptimal);
    
    setLoading(false);
  };

  // Initial load
  useEffect(() => {
    loadPrices();
  }, []);

  // Auto-refresh every 15 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadPrices();
    }, 900000); // 15 minutes

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
      <header className="bg-gradient-hero text-primary-foreground py-4 sm:py-6 shadow-elegant">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 sm:w-8 sm:h-8" />
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Elpriser SE3</h1>
                <p className="text-xs sm:text-sm text-primary-foreground/90">
                  Aktuella elpriser och smart laddningsplanering
                </p>
              </div>
            </div>
            <Button 
              onClick={loadPrices} 
              size="sm" 
              variant="outline"
              disabled={loading}
              className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Uppdatera</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 lg:py-8">
        {/* High/Low Price Cards */}
        <PriceHighLowCards 
          prices={priceData.today} 
          cheapest4Window={cheapest4Window}
          rollingPrices={rolling24Hours}
        />

        {/* Cost Cards */}
        <CostCardsSimple 
          prices={priceData.today} 
          rollingPrices={rolling24Hours}
        />

        {/* Info Alert */}
        <Alert className="mb-4 border-primary/20 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm leading-relaxed">
            När morgondagens priser inte finns tillgängliga (före ~13:00), visar den dagens återstående timmar. 
            När morgondagens priser finns tillgängliga kommer den visa alla 24 timmar framåt. 
            Morgondagens elpriser publiceras normalt mellan 13:00-14:00. När de finns tillgängliga kommer alla 24 timmar att visas i grafen.
          </AlertDescription>
        </Alert>

        {/* Rolling 24-Hour Price Chart */}
        {rolling24Hours.length > 0 && (
          <PriceChart
            rollingPrices={rolling24Hours}
            optimalWindow={null}
            selectedHourWindow={selectedHourWindow}
            onSelectedHourWindowChange={setSelectedHourWindow}
            selectedWindow={selectedWindow}
            currentHour={currentHour}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Live spotpriser via Elpriset Just Nu API. Data uppdateras automatiskt var 15:e minut.
          </p>
          <div className="text-xs mt-2">
            {priceData.tomorrow 
              ? "✓ Morgondagens priser tillgängliga" 
              : "⏳ Väntar på morgondagens priser (publiceras 13:00-14:00)"}
          </div>
          <p className="text-xs mt-2 opacity-60">
            Made by Mardo
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

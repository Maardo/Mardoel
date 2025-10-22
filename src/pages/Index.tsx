import { useState, useEffect } from "react";
import {
  fetchPriceData,
  findCheapestWindow,
  PriceData,
  createRolling24HourView,
} from "@/utils/priceUtils";
import PriceChart from "@/components/PriceChart";
import PriceNotification from "@/components/PriceNotification";
import HeroSection from "@/components/HeroSection";
import CostCards from "@/components/CostCards";
import PriceHighLowCards from "@/components/PriceHighLowCards";
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

  // Calculate optimal window for the rolling view
  const cheapest4Window = rolling24Hours.length > 0 
    ? findCheapestWindow(rolling24Hours, 4)
    : null;

  // Calculate selected window
  const selectedWindow = selectedHourWindow && rolling24Hours.length > 0
    ? findCheapestWindow(rolling24Hours, selectedHourWindow)
    : null;

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

      {/* Hero Section */}
      <HeroSection
        prices={priceData.today}
        optimalWindow={optimalWindow}
      />

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-3 sm:py-8">
        {/* Price Notification */}
        <PriceNotification prices={priceData.today} />

        {/* High/Low Price Cards */}
        <PriceHighLowCards prices={priceData.today} />

        {/* Cost Cards */}
        <CostCards prices={priceData.today} />

        {/* Rolling 24-Hour Price Chart */}
        {rolling24Hours.length > 0 ? (
          <PriceChart
            rollingPrices={rolling24Hours}
            optimalWindow={cheapest4Window}
            selectedHourWindow={selectedHourWindow}
            onSelectedHourWindowChange={setSelectedHourWindow}
            selectedWindow={selectedWindow}
            currentHour={currentHour}
          />
        ) : (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Kompletta 24-timmars priser visas efter kl 13:00 när morgondagens priser publiceras.
              För tillfället visas endast dagens återstående timmar.
            </AlertDescription>
          </Alert>
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

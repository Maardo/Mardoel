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

import PriceNotification from "@/components/PriceNotification";
import HeroSection from "@/components/HeroSection";
import CostCards from "@/components/CostCards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap } from "lucide-react";

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
  const cheapHours = priceData ? getCheapestHours(priceData.today) : [];
  const expensiveHours = priceData ? getExpensiveHours(priceData.today) : [];

  // Calculate selected window and hours for both charts
  const selectedWindowData = selectedHourWindow && priceData?.tomorrow
    ? (() => {
        const { findCheapestWindowAcrossDays } = require("@/utils/priceUtils");
        const window = findCheapestWindowAcrossDays(priceData.today, priceData.tomorrow, selectedHourWindow);
        
        // Determine which hours belong to today and which to tomorrow
        const todayHours: number[] = [];
        const tomorrowHours: number[] = [];
        
        for (let i = 0; i < selectedHourWindow; i++) {
          const hour = window.startHour + i;
          if (hour < 24) {
            todayHours.push(hour);
          } else {
            tomorrowHours.push(hour - 24); // Normalize back to 0-23
          }
        }
        
        return { window, todayHours, tomorrowHours };
      })()
    : selectedHourWindow && priceData
    ? (() => {
        const window = findCheapestWindow(priceData.today, selectedHourWindow);
        const todayHours = Array.from({ length: selectedHourWindow }, (_, i) => window.startHour + i);
        return { window: { ...window, spansToNextDay: false }, todayHours, tomorrowHours: [] };
      })()
    : null;

  const loadPrices = async () => {
    setLoading(true);
    const data = await fetchPriceData();
    setPriceData(data);
    setOptimalWindow(findCheapestWindow(data.today, 4)); // 4-hour window
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
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 sm:w-8 sm:h-8" />
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Elpriser SE3</h1>
              <p className="text-xs sm:text-sm text-primary-foreground/90">
                Aktuella elpriser och smart laddningsplanering
              </p>
            </div>
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

        {/* Cost Cards */}
        <CostCards prices={priceData.today} />

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="flex flex-col gap-3 mb-6">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 gap-3 h-auto bg-transparent">
              <TabsTrigger 
                value="overview" 
                className="text-base sm:text-lg h-12 border-2 border-border data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-md"
              >
                Översikt
              </TabsTrigger>
              <TabsTrigger 
                value="tomorrow" 
                className="text-base sm:text-lg h-12 border-2 border-border data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-md"
              >
                Morgondagens priser
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <PriceChart
              todayPrices={priceData.today}
              yesterdayPrices={priceData.yesterday}
              tomorrowPrices={priceData.tomorrow}
              optimalWindow={optimalWindow}
              date={new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })}
              selectedHourWindow={selectedHourWindow}
              onSelectedHourWindowChange={setSelectedHourWindow}
              selectedWindowHours={selectedWindowData?.todayHours || []}
              selectedWindow={selectedWindowData?.window}
            />
            
          </TabsContent>

          {/* Tomorrow Tab */}
          <TabsContent value="tomorrow" className="space-y-6">
            {priceData.tomorrow && priceData.tomorrow.length > 0 ? (
              <PriceChart
                todayPrices={priceData.tomorrow}
                yesterdayPrices={priceData.today}
                tomorrowPrices={undefined}
                optimalWindow={findCheapestWindow(priceData.tomorrow, 4)}
                title="Prisutveckling imorgon"
                date={new Date(new Date().setDate(new Date().getDate() + 1)).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })}
                selectedHourWindow={selectedHourWindow}
                onSelectedHourWindowChange={setSelectedHourWindow}
                selectedWindowHours={selectedWindowData?.tomorrowHours || []}
                selectedWindow={selectedWindowData?.window}
              />
            ) : (
              <div className="bg-card rounded-lg shadow-card p-8 border border-border text-center">
                <p className="text-muted-foreground">
                  Morgondagens priser är inte tillgängliga än. De publiceras vanligtvis runt kl 13:00.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Live spotpriser via Elpriset Just Nu API. Data uppdateras automatiskt var 15:e minut.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

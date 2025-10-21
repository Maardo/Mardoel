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
import ChargingPlanner from "@/components/ChargingPlanner";
import CostCalculator from "@/components/CostCalculator";
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

  const currentHour = new Date().getHours();
  const cheapHours = priceData ? getCheapestHours(priceData.today) : [];
  const expensiveHours = priceData ? getExpensiveHours(priceData.today) : [];

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
        lastUpdated={priceData.lastUpdated}
        onRefresh={loadPrices}
      />

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Price Notification */}
        <PriceNotification prices={priceData.today} />

        {/* Cost Cards */}
        <CostCards prices={priceData.today} />

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-3 mb-6 h-auto bg-transparent">
            <TabsTrigger 
              value="overview" 
              className="text-base sm:text-lg h-12 border-2 border-border data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-md"
            >
              Översikt
            </TabsTrigger>
            <TabsTrigger 
              value="planning" 
              className="text-base sm:text-lg h-12 border-2 border-border data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-md"
            >
              Planering
            </TabsTrigger>
            <TabsTrigger 
              value="tomorrow" 
              className="text-base sm:text-lg h-12 border-2 border-border data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-md"
            >
              Morgondagens priser
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <PriceChart
              todayPrices={priceData.today}
              yesterdayPrices={priceData.yesterday}
              optimalWindow={optimalWindow}
            />
          </TabsContent>

          {/* Tomorrow Tab */}
          <TabsContent value="tomorrow" className="space-y-6">
            {priceData.tomorrow && priceData.tomorrow.length > 0 ? (
              <PriceChart
                todayPrices={priceData.tomorrow}
                yesterdayPrices={priceData.today}
                optimalWindow={findCheapestWindow(priceData.tomorrow, 4)}
                title="Prisutveckling imorgon"
              />
            ) : (
              <div className="bg-card rounded-lg shadow-card p-8 border border-border text-center">
                <p className="text-muted-foreground">
                  Morgondagens priser är inte tillgängliga än. De publiceras vanligtvis runt kl 13:00.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Planning Tab */}
          <TabsContent value="planning" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChargingPlanner
                prices={priceData.today}
                onWindowSelect={setOptimalWindow}
              />
              <CostCalculator
                todayPrices={priceData.today}
                cheapestWindow={findCheapestWindow(priceData.today, 4)}
              />
            </div>
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

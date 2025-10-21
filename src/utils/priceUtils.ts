// Utility functions for electricity price calculations and data handling
import { supabase } from "@/integrations/supabase/client";

export interface HourlyPrice {
  hour: number;
  price: number; // öre/kWh (inkl. moms)
  timestamp: string;
}

// VAT rate for Sweden
export const VAT_RATE = 1.25;

export interface PriceData {
  today: HourlyPrice[];
  yesterday: HourlyPrice[];
  tomorrow?: HourlyPrice[];
  lastUpdated: string;
}

// Mock data generator - replace with actual API call to Node.js proxy
// Fetch live price data from backend
export const fetchPriceData = async (): Promise<PriceData> => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-nordpool-prices');
    
    if (error) {
      console.error('Error fetching prices:', error);
      throw error;
    }
    
    // Add VAT to all prices
    return {
      today: data.today.map((p: HourlyPrice) => ({ ...p, price: Math.round(p.price * VAT_RATE) })),
      yesterday: data.yesterday.map((p: HourlyPrice) => ({ ...p, price: Math.round(p.price * VAT_RATE) })),
      tomorrow: data.tomorrow ? data.tomorrow.map((p: HourlyPrice) => ({ ...p, price: Math.round(p.price * VAT_RATE) })) : undefined,
      lastUpdated: data.lastUpdated,
    };
  } catch (error) {
    console.error('Failed to fetch live prices, using mock data:', error);
    return generateMockPriceData();
  }
};

export const generateMockPriceData = (): PriceData => {
  const now = new Date();
  const today = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    price: Math.round((50 + Math.random() * 150 + Math.sin(i / 3) * 50) * VAT_RATE), // Include VAT
    timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), i).toISOString(),
  }));

  const yesterday = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    price: Math.round((60 + Math.random() * 140 + Math.sin(i / 3) * 45) * VAT_RATE), // Include VAT
    timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, i).toISOString(),
  }));

  const tomorrow = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    price: Math.round((55 + Math.random() * 145 + Math.sin(i / 3) * 48) * VAT_RATE), // Include VAT
    timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, i).toISOString(),
  }));

  return {
    today,
    yesterday,
    tomorrow,
    lastUpdated: now.toISOString(),
  };
};

// Calculate average price for a time range
export const calculateAveragePrice = (
  prices: HourlyPrice[],
  startHour: number,
  endHour: number
): number => {
  const relevantPrices = prices.filter(
    (p) => p.hour >= startHour && p.hour <= endHour
  );
  if (relevantPrices.length === 0) return 0;
  return Math.round(
    relevantPrices.reduce((sum, p) => sum + p.price, 0) / relevantPrices.length
  );
};

// Find the cheapest consecutive hours window
export const findCheapestWindow = (
  prices: HourlyPrice[],
  windowSize: number
): { startHour: number; endHour: number; avgPrice: number } => {
  let cheapestSum = Infinity;
  let cheapestStart = 0;

  for (let i = 0; i <= 24 - windowSize; i++) {
    const windowSum = prices
      .slice(i, i + windowSize)
      .reduce((sum, p) => sum + p.price, 0);
    if (windowSum < cheapestSum) {
      cheapestSum = windowSum;
      cheapestStart = i;
    }
  }

  return {
    startHour: cheapestStart,
    endHour: cheapestStart + windowSize - 1,
    avgPrice: Math.round(cheapestSum / windowSize),
  };
};

// Get the 3 cheapest hours
export const getCheapestHours = (prices: HourlyPrice[]): number[] => {
  return [...prices]
    .sort((a, b) => a.price - b.price)
    .slice(0, 3)
    .map((p) => p.hour);
};

// Get the 3 most expensive hours
export const getExpensiveHours = (prices: HourlyPrice[]): number[] => {
  return [...prices]
    .sort((a, b) => b.price - a.price)
    .slice(0, 3)
    .map((p) => p.hour);
};

// Calculate cost savings
export const calculateSavings = (
  normalPrice: number,
  cheapPrice: number,
  kWh: number
): number => {
  return Math.round((normalPrice - cheapPrice) * kWh) / 100; // Convert öre to SEK
};

// Format price for display
export const formatPrice = (price: number): string => {
  return `${(price / 100).toFixed(2)} kr/kWh`;
};

// Format time
export const formatHour = (hour: number): string => {
  return `${hour.toString().padStart(2, "0")}:00`;
};

// Check if current hour is in cheap or expensive list
export const getCurrentHourStatus = (
  prices: HourlyPrice[]
): "cheap" | "expensive" | "normal" => {
  const currentHour = new Date().getHours();
  const cheapHours = getCheapestHours(prices);
  const expensiveHours = getExpensiveHours(prices);

  if (cheapHours.includes(currentHour)) return "cheap";
  if (expensiveHours.includes(currentHour)) return "expensive";
  return "normal";
};

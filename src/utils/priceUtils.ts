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

export interface Rolling24HourPrice extends HourlyPrice {
  displayHour: string;
  isNextDay: boolean;
  originalHour: number;
}

// Mock data generator - replace with actual API call to Node.js proxy
// Helper function to aggregate multiple price points per hour into a single average
const aggregateHourlyPrices = (prices: HourlyPrice[]): HourlyPrice[] => {
  const hourMap = new Map<number, { sum: number; count: number; timestamp: string }>();
  
  prices.forEach(p => {
    if (!hourMap.has(p.hour)) {
      hourMap.set(p.hour, { sum: 0, count: 0, timestamp: p.timestamp });
    }
    const hourData = hourMap.get(p.hour)!;
    hourData.sum += p.price;
    hourData.count += 1;
  });
  
  return Array.from(hourMap.entries()).map(([hour, data]) => ({
    hour,
    price: Math.round(data.sum / data.count), // Average price for the hour
    timestamp: data.timestamp
  }));
};

// Fetch live price data from backend
export const fetchPriceData = async (): Promise<PriceData> => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-nordpool-prices');
    
    if (error) {
      console.error('Error fetching prices:', error);
      throw error;
    }
    
    // Add VAT to all prices and aggregate multiple prices per hour
    return {
      today: aggregateHourlyPrices(data.today.map((p: HourlyPrice) => ({ ...p, price: Math.round(p.price * VAT_RATE) }))),
      yesterday: aggregateHourlyPrices(data.yesterday.map((p: HourlyPrice) => ({ ...p, price: Math.round(p.price * VAT_RATE) }))),
      tomorrow: data.tomorrow ? aggregateHourlyPrices(data.tomorrow.map((p: HourlyPrice) => ({ ...p, price: Math.round(p.price * VAT_RATE) }))) : undefined,
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

// Create a rolling 24-hour view starting from current hour
export const createRolling24HourView = (
  todayPrices: HourlyPrice[],
  tomorrowPrices: HourlyPrice[] | undefined,
  currentHour: number
): Rolling24HourPrice[] => {
  const rolling24: Rolling24HourPrice[] = [];
  
  // Add remaining hours from today (current hour to 23:00)
  for (let i = currentHour; i < 24; i++) {
    const priceData = todayPrices.find(p => p.hour === i);
    if (priceData) {
      rolling24.push({
        ...priceData,
        displayHour: formatHour(i),
        isNextDay: false,
        originalHour: i
      });
    }
  }
  
  // Add hours from tomorrow (00:00 to current hour - 1) if available
  if (tomorrowPrices && tomorrowPrices.length > 0) {
    for (let i = 0; i < currentHour; i++) {
      const priceData = tomorrowPrices.find(p => p.hour === i);
      if (priceData) {
        rolling24.push({
          ...priceData,
          displayHour: `${formatHour(i)} +1`,
          isNextDay: true,
          originalHour: i
        });
      }
    }
  }
  
  return rolling24;
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
  // Sort prices by hour to ensure correct order
  const sortedPrices = [...prices].sort((a, b) => a.hour - b.hour);
  
  let cheapestSum = Infinity;
  let cheapestStart = 0;

  for (let i = 0; i <= sortedPrices.length - windowSize; i++) {
    const windowSum = sortedPrices
      .slice(i, i + windowSize)
      .reduce((sum, p) => sum + p.price, 0);
    if (windowSum < cheapestSum) {
      cheapestSum = windowSum;
      cheapestStart = sortedPrices[i].hour; // Use actual hour, not index
    }
  }

  return {
    startHour: cheapestStart,
    endHour: cheapestStart + windowSize - 1,
    avgPrice: Math.round(cheapestSum / windowSize),
  };
};

// Find the cheapest consecutive hours window across two days
export const findCheapestWindowAcrossDays = (
  todayPrices: HourlyPrice[],
  tomorrowPrices: HourlyPrice[],
  windowSize: number
): { startHour: number; endHour: number; avgPrice: number; spansToNextDay: boolean } => {
  // Combine prices - add 24 to tomorrow's hours to make them sequential
  const combinedPrices = [
    ...todayPrices.map(p => ({ ...p, originalHour: p.hour })),
    ...tomorrowPrices.map(p => ({ ...p, hour: p.hour + 24, originalHour: p.hour }))
  ];
  
  let cheapestSum = Infinity;
  let cheapestStart = 0;

  // Find the cheapest window in the combined array
  for (let i = 0; i <= combinedPrices.length - windowSize; i++) {
    const windowSum = combinedPrices
      .slice(i, i + windowSize)
      .reduce((sum, p) => sum + p.price, 0);
    if (windowSum < cheapestSum) {
      cheapestSum = windowSum;
      cheapestStart = combinedPrices[i].hour; // This could be 0-47
    }
  }

  const endHour = cheapestStart + windowSize - 1;
  const spansToNextDay = endHour >= 24;

  return {
    startHour: cheapestStart,
    endHour: endHour,
    avgPrice: Math.round(cheapestSum / windowSize),
    spansToNextDay
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
  // Handle hours >= 24 by wrapping to next day
  const normalizedHour = hour % 24;
  return `${normalizedHour.toString().padStart(2, "0")}:00`;
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

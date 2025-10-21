import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NordPoolPrice {
  HourUTC: string;
  PriceArea: string;
  SpotPriceDKK: number;
  SpotPriceEUR: number;
  SpotPriceSEK: number;
}

interface HourlyPrice {
  hour: number;
  price: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching electricity prices for SE3...');

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Using Elpriset Just Nu API - free and reliable for Swedish electricity prices
    const todayUrl = `https://www.elprisetjustnu.se/api/v1/prices/${todayStr.split('-')[0]}/${todayStr.split('-')[1]}-${todayStr.split('-')[2]}_SE3.json`;
    const yesterdayUrl = `https://www.elprisetjustnu.se/api/v1/prices/${yesterdayStr.split('-')[0]}/${yesterdayStr.split('-')[1]}-${yesterdayStr.split('-')[2]}_SE3.json`;

    console.log('Fetching from:', todayUrl);

    // Fetch both in parallel
    const [todayResponse, yesterdayResponse] = await Promise.all([
      fetch(todayUrl, {
        headers: {
          'Accept': 'application/json',
        }
      }),
      fetch(yesterdayUrl, {
        headers: {
          'Accept': 'application/json',
        }
      })
    ]);

    if (!todayResponse.ok) {
      console.error('API error (today):', todayResponse.status, todayResponse.statusText);
      throw new Error(`API returned ${todayResponse.status}`);
    }

    const todayData = await todayResponse.json();
    const yesterdayData = yesterdayResponse.ok ? await yesterdayResponse.json() : null;

    console.log('Successfully fetched price data');
    console.log(`Today: ${todayData?.length || 0} prices`);

    // Transform the data
    const transformPrices = (data: any[]): HourlyPrice[] => {
      if (!Array.isArray(data) || data.length === 0) {
        console.warn('No price entries in response');
        return [];
      }

      return data
        .map((entry: any) => {
          const date = new Date(entry.time_start);
          // API returns SEK per kWh, convert to öre per kWh
          const price = Math.round(entry.SEK_per_kWh * 100);
          
          return {
            hour: date.getHours(),
            price: price,
            timestamp: entry.time_start,
          };
        })
        .sort((a: HourlyPrice, b: HourlyPrice) => a.hour - b.hour);
    };

    const todayPrices = transformPrices(todayData);
    const yesterdayPrices = yesterdayData ? transformPrices(yesterdayData) : [];

    // Fallback if no data
    if (todayPrices.length === 0) {
      console.warn('No prices found, using fallback data');
      throw new Error('No price data available');
    }

    const response = {
      today: todayPrices,
      yesterday: yesterdayPrices,
      lastUpdated: new Date().toISOString(),
    };

    console.log(`Returning ${todayPrices.length} today prices and ${yesterdayPrices.length} yesterday prices`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error fetching Nord Pool prices:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        message: 'Failed to fetch Nord Pool prices. Using fallback data.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

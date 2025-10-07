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
    console.log('Fetching Nord Pool prices for SE3...');

    // Fetch today's prices
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Fetch yesterday's prices
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Nord Pool API endpoints
    const todayUrl = `https://dataportal-api.nordpoolgroup.com/api/DayAheadPrices?date=${todayStr}&market=DayAhead&deliveryArea=SE3&currency=SEK`;
    const yesterdayUrl = `https://dataportal-api.nordpoolgroup.com/api/DayAheadPrices?date=${yesterdayStr}&market=DayAhead&deliveryArea=SE3&currency=SEK`;

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
      console.error('Nord Pool API error (today):', todayResponse.status, todayResponse.statusText);
      throw new Error(`Nord Pool API returned ${todayResponse.status}`);
    }

    const todayData = await todayResponse.json();
    const yesterdayData = yesterdayResponse.ok ? await yesterdayResponse.json() : null;

    console.log('Successfully fetched Nord Pool data');

    // Transform the data
    const transformPrices = (data: any): HourlyPrice[] => {
      if (!data?.multiAreaEntries) {
        console.warn('No multiAreaEntries in response');
        return [];
      }

      return data.multiAreaEntries
        .filter((entry: any) => entry.deliveryArea === 'SE3')
        .map((entry: any) => {
          const date = new Date(entry.deliveryStart);
          return {
            hour: date.getHours(),
            price: Math.round(entry.entryPerArea[0]?.spotPrice || 0), // Price in öre/kWh
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

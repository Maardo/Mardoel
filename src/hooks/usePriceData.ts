import { useQuery } from "@tanstack/react-query";
import { fetchPriceData, PriceData } from "@/utils/priceUtils";
import { Region } from "@/components/RegionSelector";

export function usePriceData(region: Region) {
  return useQuery<PriceData>({
    queryKey: ["priceData", region],
    queryFn: () => fetchPriceData(region),
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 15 * 60 * 1000, // Auto-refetch every 15 minutes
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

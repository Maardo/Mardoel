import { useLocalStorage } from "./useLocalStorage";

export interface CostSettings {
  networkFee: number; // öre/kWh
  supplierMarkup: number; // öre/kWh
  showRealCost: boolean;
}

const DEFAULT_SETTINGS: CostSettings = {
  networkFee: 0,
  supplierMarkup: 0,
  showRealCost: false,
};

export function useCostSettings() {
  const [settings, setSettings] = useLocalStorage<CostSettings>(
    "elpriser-cost-settings",
    DEFAULT_SETTINGS
  );

  const totalAddition = settings.networkFee + settings.supplierMarkup;

  const calculateRealPrice = (spotPrice: number): number => {
    if (!settings.showRealCost) return spotPrice;
    return spotPrice + totalAddition;
  };

  return {
    settings,
    setSettings,
    totalAddition,
    calculateRealPrice,
  };
}

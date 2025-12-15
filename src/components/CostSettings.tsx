import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CostSettings as CostSettingsType } from "@/hooks/useCostSettings";

interface CostSettingsProps {
  settings: CostSettingsType;
  onSettingsChange: (settings: CostSettingsType) => void;
}

const CostSettings = ({ settings, onSettingsChange }: CostSettingsProps) => {
  const [open, setOpen] = useState(false);

  const handleNetworkFeeChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    onSettingsChange({ ...settings, networkFee: Math.round(numValue * 100) / 100 });
  };

  const handleSupplierMarkupChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    onSettingsChange({ ...settings, supplierMarkup: Math.round(numValue * 100) / 100 });
  };

  const handleShowRealCostChange = (checked: boolean) => {
    onSettingsChange({ ...settings, showRealCost: checked });
  };

  const totalAddition = settings.networkFee + settings.supplierMarkup;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Inställningar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kostnadsinställningar</DialogTitle>
          <DialogDescription>
            Lägg till nätavgift och elhandlarpåslag för att se verklig kostnad.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="networkFee">Nätavgift (öre/kWh)</Label>
            <Input
              id="networkFee"
              type="number"
              min="0"
              step="0.1"
              value={settings.networkFee || ""}
              onChange={(e) => handleNetworkFeeChange(e.target.value)}
              placeholder="T.ex. 35"
            />
            <p className="text-xs text-muted-foreground">
              Hittas på din elnätsfaktura
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplierMarkup">Elhandlarpåslag (öre/kWh)</Label>
            <Input
              id="supplierMarkup"
              type="number"
              min="0"
              step="0.1"
              value={settings.supplierMarkup || ""}
              onChange={(e) => handleSupplierMarkupChange(e.target.value)}
              placeholder="T.ex. 5"
            />
            <p className="text-xs text-muted-foreground">
              Ditt elbolags påslag utöver spotpris
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="showRealCost">Visa verklig kostnad</Label>
              <p className="text-xs text-muted-foreground">
                Inkludera alla tillägg i prisvisningen
              </p>
            </div>
            <Switch
              id="showRealCost"
              checked={settings.showRealCost}
              onCheckedChange={handleShowRealCostChange}
            />
          </div>

          {settings.showRealCost && totalAddition > 0 && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium">
                Totalt tillägg: {totalAddition.toFixed(1)} öre/kWh
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Detta läggs på spotpriset i alla beräkningar
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CostSettings;

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type Region = "SE1" | "SE2" | "SE3" | "SE4";

interface RegionSelectorProps {
  selectedRegion: Region;
  onRegionChange: (region: Region) => void;
}

const REGIONS: { value: Region; label: string }[] = [
  { value: "SE1", label: "SE1 - Luleå" },
  { value: "SE2", label: "SE2 - Sundsvall" },
  { value: "SE3", label: "SE3 - Stockholm" },
  { value: "SE4", label: "SE4 - Malmö" },
];

const RegionSelector = ({ selectedRegion, onRegionChange }: RegionSelectorProps) => {
  return (
    <Select value={selectedRegion} onValueChange={(value) => onRegionChange(value as Region)}>
      <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20 transition-all">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-card border-border">
        {REGIONS.map((region) => (
          <SelectItem 
            key={region.value} 
            value={region.value}
            className="cursor-pointer hover:bg-accent"
          >
            {region.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default RegionSelector;

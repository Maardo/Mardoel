import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LastUpdatedProps {
  lastUpdated: string;
  onRefresh: () => void;
}

const LastUpdated = ({ lastUpdated, onRefresh }: LastUpdatedProps) => {
  const [timeAgo, setTimeAgo] = useState("");

  useEffect(() => {
    const updateTimeAgo = () => {
      const now = new Date();
      const updated = new Date(lastUpdated);
      const diff = Math.floor((now.getTime() - updated.getTime()) / 1000 / 60);

      if (diff < 1) {
        setTimeAgo("Just nu");
      } else if (diff < 60) {
        setTimeAgo(`${diff} min sedan`);
      } else {
        const hours = Math.floor(diff / 60);
        setTimeAgo(`${hours} ${hours === 1 ? "timme" : "timmar"} sedan`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className="flex items-center justify-between bg-muted rounded-lg p-4">
      <div>
        <p className="text-sm text-muted-foreground">Senast uppdaterad</p>
        <p className="font-semibold text-foreground">{timeAgo}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRefresh}>
        <RefreshCw className="w-4 h-4 mr-2" />
        Uppdatera
      </Button>
    </div>
  );
};

export default LastUpdated;

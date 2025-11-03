import { useEffect, useState } from "react";
import { getHealth } from "@/lib/api";
import { Activity } from "lucide-react";

export default function HealthIndicator() {
  const [healthy, setHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    const status = await getHealth();
    setHealthy(status);
  };

  return (
    <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 glass-card px-4 py-2 rounded-full">
      <div className="flex items-center gap-2 text-sm">
        <Activity className="w-4 h-4 text-muted-foreground" />
        <span className="text-muted-foreground">Backend:</span>
        {healthy === null ? (
          <span className="text-muted-foreground">Checking...</span>
        ) : healthy ? (
          <>
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-success-foreground">Connected</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 rounded-full bg-destructive" />
            <span className="text-destructive-foreground">Offline</span>
          </>
        )}
      </div>
    </footer>
  );
}

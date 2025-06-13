"use client";

import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

interface OfflineIndicatorProps {
  isOffline: boolean;
}

export function OfflineIndicator({ isOffline }: OfflineIndicatorProps) {
  const [showIndicator, setShowIndicator] = useState(isOffline);
  
  useEffect(() => {
    setShowIndicator(isOffline);
  }, [isOffline]);

  if (!showIndicator) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-2 rounded-lg bg-orange-100 px-4 py-2 shadow-lg border border-orange-200">
        <WifiOff className="h-5 w-5 text-orange-600" />
        <div className="text-sm">
          <p className="font-medium text-orange-900">Offline Mode</p>
          <p className="text-orange-700">Using cached data</p>
        </div>
      </div>
    </div>
  );
}
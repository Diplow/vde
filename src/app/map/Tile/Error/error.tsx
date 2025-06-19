"use client";

import React from "react";
import { Button } from "~/components/ui/button";
import { DynamicBaseTileLayout } from "~/app/map/Tile/Base";

export interface ErrorTileProps {
  title: string;
  message: string;
  onRetry?: () => void;
  showTimestamp?: boolean;
}

export default function ErrorTile({ 
  title, 
  message, 
  onRetry, 
  showTimestamp = false 
}: ErrorTileProps) {
  const timestamp = React.useMemo(() => new Date().toISOString(), []);
  
  return (
    <DynamicBaseTileLayout 
      coordId="error" 
      scale={3}
      color={{ color: "rose", tint: "50" }}
    >
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-semibold text-rose-700">
            {title}
          </h2>
          <p className="mb-6 text-gray-700">
            {message}
          </p>
          {showTimestamp && (
            <div className="mb-4 text-sm text-gray-600">
              Error details have been logged. Please contact your administrator
              with this timestamp: {timestamp}
            </div>
          )}
          {onRetry && (
            <Button onClick={onRetry} variant="destructive">
              Try Again
            </Button>
          )}
        </div>
      </div>
    </DynamicBaseTileLayout>
  );
}

// Named exports for index.ts
export const DynamicErrorTile = ErrorTile;
export type DynamicErrorTileProps = ErrorTileProps;
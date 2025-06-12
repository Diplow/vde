import React from "react";
import { Button } from "~/components/ui/button";

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  showTimestamp?: boolean;
}

/**
 * Displays error states with retry functionality
 */
export function ErrorState({ 
  title, 
  message, 
  onRetry, 
  showTimestamp = false 
}: ErrorStateProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="rounded-lg bg-card p-8 text-center shadow-xl">
        <h2 className="mb-4 text-2xl font-semibold text-destructive">
          {title}
        </h2>
        <p className="mb-6 text-muted-foreground">
          {message}
        </p>
        {showTimestamp && (
          <div className="text-sm text-muted-foreground mb-4">
            Error details have been logged. Please contact your administrator with this timestamp: {new Date().toISOString()}
          </div>
        )}
        {onRetry && (
          <Button onClick={onRetry}>
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

export function MapCreationError({ message }: { message: string }) {
  return (
    <ErrorState 
      title="Workspace Creation Failed"
      message={message}
      showTimestamp
    />
  );
}

export function MapFetchError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <ErrorState 
      title="Map Error"
      message={`${message}. Please try again later or contact support if the problem persists.`}
      onRetry={onRetry}
    />
  );
}
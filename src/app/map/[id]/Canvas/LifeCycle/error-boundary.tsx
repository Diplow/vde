import { AlertCircle } from "lucide-react";
import { cn } from "~/lib/utils";

interface MapErrorBoundaryProps {
  error: Error;
  onRetry: () => void;
  className?: string;
}

export function MapErrorBoundary({
  error,
  onRetry,
  className,
}: MapErrorBoundaryProps) {
  return (
    <div className={cn("grid h-full place-items-center", className)}>
      <div className="text-center" role="alert">
        <div className="mb-4">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          Failed to load map
        </h3>
        <p className="mb-4 text-sm text-gray-600">
          {error.message || "An unexpected error occurred"}
        </p>
        <button
          onClick={onRetry}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Try Again
        </button>

        {/* Fallback instructions */}
        <noscript>
          <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm text-amber-800">
              JavaScript is required for interactive features. Please enable
              JavaScript or refresh the page.
            </p>
          </div>
        </noscript>
      </div>
    </div>
  );
}

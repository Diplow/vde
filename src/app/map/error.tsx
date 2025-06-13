"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid h-screen place-items-center">
      <div>
        <p className="mb-2 text-rose-600">Error loading map data:</p>
        <pre className="mb-4 whitespace-pre-wrap rounded bg-rose-100 p-2 text-sm">
          {error.message}
        </pre>
        <button
          onClick={reset}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

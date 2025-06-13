import { Info } from "lucide-react";

export function StaticIndicator() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-2 rounded-lg bg-blue-100 px-4 py-2 shadow-lg border border-blue-200">
        <Info className="h-5 w-5 text-blue-600" />
        <div className="text-sm">
          <p className="font-medium text-blue-900">Static Mode</p>
          <p className="text-blue-700">No JavaScript required</p>
        </div>
      </div>
    </div>
  );
}
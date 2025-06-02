import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { CreateItemFormFields } from "./form-fields.static";
import type { HexCoord } from "~/lib/domains/mapping/utils/hex-coordinates";
import type { MapItemAPIContract } from "~/server/api/types/contracts";

interface StaticCreateItemFormProps {
  targetCoords: HexCoord;
  parentItem: MapItemAPIContract | null;
  returnUrl: string;
  rootItemId: string;
}

export function StaticCreateItemForm({
  targetCoords,
  parentItem,
  returnUrl,
  rootItemId,
}: StaticCreateItemFormProps) {
  const coordsDisplay = `${targetCoords.userId},${targetCoords.groupId}:${targetCoords.path.join(",")}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={returnUrl}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Back to Map
        </Link>
      </div>

      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Create New Item</h1>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin size={16} />
          <span>Position: {coordsDisplay}</span>
        </div>

        {parentItem && (
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-700">
              Creating child of:{" "}
              <span className="font-normal">{parentItem.name}</span>
            </p>
          </div>
        )}
      </div>

      {/* Form */}
      <CreateItemFormFields
        targetCoords={targetCoords}
        parentId={parentItem?.id}
        returnUrl={returnUrl}
        rootItemId={rootItemId}
      />
    </div>
  );
}

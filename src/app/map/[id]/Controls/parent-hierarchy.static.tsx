import { ChevronDown } from "lucide-react";
import type { HexTileData } from "../State/types";
import { HierarchyTile } from "../Tile/hierarchy-tile.static";
import {
  _getParentHierarchy,
  _shouldShowHierarchy,
} from "../State/hierarchy.utils";

interface ParentHierarchyProps {
  centerCoordId: string;
  items: Record<string, HexTileData>;
}

export const ParentHierarchy = ({
  centerCoordId,
  items,
}: ParentHierarchyProps) => {
  const hierarchy = _getParentHierarchy(centerCoordId, items);

  if (!_shouldShowHierarchy(hierarchy)) {
    return null;
  }

  return (
    <div className="fixed right-4 top-1/2 z-30 -translate-y-1/2">
      <div className="flex flex-col items-center gap-2 rounded-lg bg-transparent px-3 py-4">
        {hierarchy.map((item, index) => (
          <div
            key={item.metadata.coordId}
            className="flex flex-col items-center gap-1"
          >
            <HierarchyTile
              item={item}
              isLast={index === hierarchy.length - 1}
              hierarchy={hierarchy}
              itemIndex={index}
            />
            {index < hierarchy.length - 1 && (
              <ChevronDown size={16} className="flex-shrink-0 text-zinc-400" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

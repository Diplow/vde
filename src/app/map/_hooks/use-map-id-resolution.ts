import { useEffect, useState } from "react";
import { api } from "~/commons/trpc/react";

interface ResolvedMapInfo {
  centerCoordinate: string;
  userId: number;
  groupId: number;
  rootItemId: number;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Resolves a map identifier (either mapItemId or coordinate) to actual coordinates
 * This ensures the cache only ever sees proper coordinates, not mapItemIds
 */
export function useMapIdResolution(centerParam: string): ResolvedMapInfo {
  const [resolvedInfo, setResolvedInfo] = useState<ResolvedMapInfo>({
    centerCoordinate: "",
    userId: 0,
    groupId: 0,
    rootItemId: 0,
    isLoading: true,
    error: null,
  });

  // Check if this is already a coordinate format
  const isCoordinate = centerParam.includes(",");
  
  // Use tRPC to fetch root item if it's a mapItemId
  const { data: rootItem, isLoading, error } = api.map.getRootItemById.useQuery(
    { mapItemId: parseInt(centerParam) },
    { 
      enabled: !isCoordinate && /^\d+$/.test(centerParam),
      staleTime: Infinity, // Cache forever since root items don't change
    }
  );

  useEffect(() => {
    if (isCoordinate) {
      // Already a coordinate, parse it
      const parts = centerParam.split(",");
      const userIdStr = parts[0];
      const rest = parts[1];
      const groupIdStr = rest ? rest.split(":")[0] : "0";
      
      setResolvedInfo({
        centerCoordinate: centerParam,
        userId: parseInt(userIdStr ?? "0"),
        groupId: parseInt(groupIdStr ?? "0"),
        rootItemId: parseInt(userIdStr ?? "0"), // For coordinates, rootItemId is usually the userId
        isLoading: false,
        error: null,
      });
    } else if (rootItem) {
      // Resolved from mapItemId to actual item
      const coords = rootItem.coordinates.split(",");
      const userIdStr = coords[0];
      const rest = coords[1];
      const groupIdStr = rest ? rest.split(":")[0] : "0";
      
      setResolvedInfo({
        centerCoordinate: rootItem.coordinates,
        userId: parseInt(userIdStr ?? "0"),
        groupId: parseInt(groupIdStr ?? "0"),
        rootItemId: parseInt(centerParam),
        isLoading: false,
        error: null,
      });
    } else if (error) {
      setResolvedInfo(prev => ({
        ...prev,
        isLoading: false,
        error: new Error(error.message || "Failed to resolve map ID"),
      }));
    }
  }, [centerParam, isCoordinate, rootItem, error]);

  return {
    ...resolvedInfo,
    isLoading: !isCoordinate && isLoading,
  };
}
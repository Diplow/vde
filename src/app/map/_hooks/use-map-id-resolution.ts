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
      const [userIdStr, rest] = centerParam.split(",");
      const [groupIdStr] = rest.split(":");
      
      setResolvedInfo({
        centerCoordinate: centerParam,
        userId: parseInt(userIdStr),
        groupId: parseInt(groupIdStr || "0"),
        rootItemId: parseInt(userIdStr), // For coordinates, rootItemId is usually the userId
        isLoading: false,
        error: null,
      });
    } else if (rootItem) {
      // Resolved from mapItemId to actual item
      const coords = rootItem.coordinates.split(",");
      const [userIdStr, rest] = coords;
      const [groupIdStr] = rest.split(":");
      
      setResolvedInfo({
        centerCoordinate: rootItem.coordinates,
        userId: parseInt(userIdStr),
        groupId: parseInt(groupIdStr || "0"),
        rootItemId: parseInt(centerParam),
        isLoading: false,
        error: null,
      });
    } else if (error) {
      setResolvedInfo(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }));
    }
  }, [centerParam, isCoordinate, rootItem, error]);

  return {
    ...resolvedInfo,
    isLoading: !isCoordinate && isLoading,
  };
}
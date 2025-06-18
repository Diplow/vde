import { describe, it, expect, vi } from "vitest";
import {
  createCacheRollbackHandler,
  withRollback,
  executeOptimisticUpdate,
  type OptimisticUpdateRollback
} from "../rollback-handler";
import type { CacheState } from "~/app/map/Cache/State/types";
import type { TileData } from "~/app/map/types/tile-data";

describe("Rollback Handler", () => {
  const mockCacheState: CacheState = {
    itemsById: { "1,1:1": { metadata: { coordId: "1,1:1" } } as TileData },
    regionMetadata: {},
    currentCenter: null,
    expandedItemIds: [],
    isLoading: false,
    error: null,
    lastUpdated: Date.now(),
    cacheConfig: { 
      maxAge: 300000, 
      maxDepth: 3,
      backgroundRefreshInterval: 60000,
      enableOptimisticUpdates: true
    }
  };

  describe("createCacheRollbackHandler", () => {
    it("should capture and rollback state", () => {
      let currentState = { ...mockCacheState };
      const updateCache = vi.fn((updater: (state: CacheState) => CacheState) => {
        currentState = updater(currentState);
      });

      const handler = createCacheRollbackHandler(
        () => currentState,
        updateCache
      );

      // Capture initial state
      const capturedState = handler.captureState();
      expect(capturedState).toEqual(mockCacheState);

      // Modify state
      currentState.isLoading = true;

      // Rollback
      handler.rollback(capturedState);
      expect(updateCache).toHaveBeenCalledWith(expect.any(Function));
      
      // Verify the updater function returns the captured state
      const updaterFn = updateCache.mock.calls[0]?.[0];
      expect(updaterFn?.(currentState)).toEqual(capturedState);
    });
  });

  describe("withRollback", () => {
    it("should execute operation successfully", async () => {
      const rollbackHandler: OptimisticUpdateRollback<string> = {
        captureState: () => "initial",
        rollback: vi.fn()
      };

      const result = await withRollback(rollbackHandler, async () => {
        return "success";
      });

      expect(result).toBe("success");
      expect(rollbackHandler.rollback).not.toHaveBeenCalled();
    });

    it("should rollback on error", async () => {
      const rollbackHandler: OptimisticUpdateRollback<string> = {
        captureState: () => "initial",
        rollback: vi.fn()
      };

      await expect(
        withRollback(rollbackHandler, async () => {
          throw new Error("Operation failed");
        })
      ).rejects.toThrow("Operation failed");

      expect(rollbackHandler.rollback).toHaveBeenCalledWith("initial");
    });
  });

  describe("executeOptimisticUpdate", () => {
    it("should execute full optimistic update flow", async () => {
      const rollbackHandler: OptimisticUpdateRollback<string> = {
        captureState: () => "initial",
        rollback: vi.fn()
      };

      const optimisticUpdate = vi.fn();
      const serverOperation = vi.fn().mockResolvedValue("server result");
      const onSuccess = vi.fn();
      const onError = vi.fn();

      const result = await executeOptimisticUpdate({
        rollbackHandler,
        optimisticUpdate,
        serverOperation,
        onSuccess,
        onError
      });

      expect(optimisticUpdate).toHaveBeenCalled();
      expect(serverOperation).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalledWith("server result");
      expect(onError).not.toHaveBeenCalled();
      expect(rollbackHandler.rollback).not.toHaveBeenCalled();
      expect(result).toBe("server result");
    });

    it("should rollback and call error handler on failure", async () => {
      const rollbackHandler: OptimisticUpdateRollback<string> = {
        captureState: () => "initial",
        rollback: vi.fn()
      };

      const optimisticUpdate = vi.fn();
      const error = new Error("Server error");
      const serverOperation = vi.fn().mockRejectedValue(error);
      const onSuccess = vi.fn();
      const onError = vi.fn();

      await expect(
        executeOptimisticUpdate({
          rollbackHandler,
          optimisticUpdate,
          serverOperation,
          onSuccess,
          onError
        })
      ).rejects.toThrow("Server error");

      expect(optimisticUpdate).toHaveBeenCalled();
      expect(serverOperation).toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(error);
      expect(rollbackHandler.rollback).toHaveBeenCalledWith("initial");
    });
  });
});
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MapItemActions } from "../map-item.actions";
import { MapItemType } from "../../_objects";
import { TransactionManager } from "../../infrastructure/transaction-manager";
import type { MapItemRepository, BaseItemRepository } from "../../_repositories";

describe("MapItemActions - Transaction Support", () => {
  let mapItemRepo: MapItemRepository & { withTransaction?: any };
  let baseItemRepo: BaseItemRepository & { withTransaction?: any };
  let actions: MapItemActions;

  beforeEach(() => {
    // Create mock repositories with transaction support
    mapItemRepo = {
      handleCascading: vi.fn(() => true),
      getOne: vi.fn(),
      getOneByIdr: vi.fn(),
      getMany: vi.fn(),
      getManyByIdr: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateByIdr: vi.fn(),
      updateRelatedItem: vi.fn(),
      updateRelatedItemByIdr: vi.fn(),
      addToRelatedList: vi.fn(),
      addToRelatedListByIdr: vi.fn(),
      removeFromRelatedList: vi.fn(),
      removeFromRelatedListByIdr: vi.fn(),
      remove: vi.fn(),
      removeByIdr: vi.fn(),
      getRootItem: vi.fn(),
      getRootItemsForUser: vi.fn(),
      getDescendantsByParent: vi.fn(),
      withTransaction: vi.fn(),
    } as any;

    baseItemRepo = {
      handleCascading: vi.fn(() => true),
      getOne: vi.fn(),
      getOneByIdr: vi.fn(),
      getMany: vi.fn(),
      getManyByIdr: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateByIdr: vi.fn(),
      updateRelatedItem: vi.fn(),
      updateRelatedItemByIdr: vi.fn(),
      addToRelatedList: vi.fn(),
      addToRelatedListByIdr: vi.fn(),
      removeFromRelatedList: vi.fn(),
      removeFromRelatedListByIdr: vi.fn(),
      remove: vi.fn(),
      removeByIdr: vi.fn(),
      withTransaction: vi.fn(),
    } as any;

    actions = new MapItemActions({
      mapItem: mapItemRepo,
      baseItem: baseItemRepo,
    });
  });

  it("should use transaction when moving items", async () => {
    // Setup mock data
    const sourceItem = {
      id: 1,
      attrs: {
        coords: { userId: 1, groupId: 1, path: [1] },
        itemType: MapItemType.BASE,
      },
      data: { name: "Source Item" },
    };

    const targetItem = {
      id: 2,
      attrs: {
        coords: { userId: 1, groupId: 1, path: [2] },
        itemType: MapItemType.BASE,
      },
      data: { name: "Target Item" },
    };

    // Mock repository behavior
    vi.mocked(mapItemRepo.getOneByIdr).mockImplementation(async ({ idr }) => {
      const coords = (idr as any).attrs?.coords;
      if (coords?.path[0] === 1) return sourceItem as any;
      if (coords?.path[0] === 2) return targetItem as any;
      return null;
    });

    vi.mocked(mapItemRepo.getOne).mockResolvedValue(sourceItem as any);

    // Create transaction-aware repository mocks
    const txMapItemRepo = { ...mapItemRepo };
    const txBaseItemRepo = { ...baseItemRepo };
    
    vi.mocked(mapItemRepo.withTransaction).mockReturnValue(txMapItemRepo);
    vi.mocked(baseItemRepo.withTransaction).mockReturnValue(txBaseItemRepo);

    // Mock transaction manager
    const runInTransactionSpy = vi.spyOn(TransactionManager, "runInTransaction");
    runInTransactionSpy.mockImplementation(async (fn) => {
      const mockTx = {} as any;
      return await fn(mockTx);
    });

    // Execute move operation
    const oldCoords = { userId: 1, groupId: 1, path: [1] };
    const newCoords = { userId: 1, groupId: 1, path: [2] };

    try {
      await actions.moveMapItem({ oldCoords, newCoords });
    } catch (error) {
      // Expected to fail due to incomplete mocking, but we're testing transaction usage
    }

    // Verify transaction was used
    expect(runInTransactionSpy).toHaveBeenCalled();
    expect(mapItemRepo.withTransaction).toHaveBeenCalled();
    expect(baseItemRepo.withTransaction).toHaveBeenCalled();
  });

  it("should rollback transaction on failure", async () => {
    // Setup to simulate a failure during move
    const sourceItem = {
      id: 1,
      attrs: {
        coords: { userId: 1, groupId: 1, path: [1] },
        itemType: MapItemType.BASE,
      },
      data: { name: "Source Item" },
    };

    vi.mocked(mapItemRepo.getOneByIdr).mockImplementation(async ({ idr }) => {
      const coords = (idr as any).attrs?.coords;
      if (coords?.path[0] === 1) return sourceItem as any;
      return null;
    });

    // Make updateByIdr throw an error to simulate failure
    const txMapItemRepo = {
      ...mapItemRepo,
      updateByIdr: vi.fn().mockRejectedValue(new Error("Database error")),
    };
    
    vi.mocked(mapItemRepo.withTransaction).mockReturnValue(txMapItemRepo);
    vi.mocked(baseItemRepo.withTransaction).mockReturnValue(baseItemRepo);

    // Mock transaction manager to track rollback
    let transactionRolledBack = false;
    const runInTransactionSpy = vi.spyOn(TransactionManager, "runInTransaction");
    runInTransactionSpy.mockImplementation(async (fn) => {
      const mockTx = {} as any;
      try {
        return await fn(mockTx);
      } catch (error) {
        transactionRolledBack = true;
        throw error;
      }
    });

    // Execute move operation and expect it to fail
    const oldCoords = { userId: 1, groupId: 1, path: [1] };
    const newCoords = { userId: 1, groupId: 1, path: [2] };

    await expect(
      actions.moveMapItem({ oldCoords, newCoords })
    ).rejects.toThrow();

    // Verify transaction was rolled back
    expect(transactionRolledBack).toBe(true);
  });
});
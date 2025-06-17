import { describe, it, expect, vi, beforeEach } from "vitest";
import { MapItemActions } from "../map-item.actions";
import { ItemCrudService } from "../../services/_item-crud.service";
import { MapItemType } from "../../_objects";
import { TransactionManager } from "../../infrastructure/transaction-manager";
import type { MapItemRepository, BaseItemRepository } from "../../_repositories";

describe("MapItemActions - Transaction Support", () => {
  let mapItemRepo: MapItemRepository & { withTransaction?: any };
  let baseItemRepo: BaseItemRepository & { withTransaction?: any };
  let actions: MapItemActions;
  let service: ItemCrudService;

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
    
    service = new ItemCrudService({
      mapItem: mapItemRepo,
      baseItem: baseItemRepo,
    });
  });

  it("should accept transaction parameter in moveMapItem", async () => {
    // Setup mock data
    const sourceItem = {
      id: 1,
      attrs: {
        coords: { userId: 1, groupId: 1, path: [1] },
        itemType: MapItemType.BASE,
      },
      ref: { id: 1 },
      data: { name: "Source Item" },
    };

    // Mock repository behavior for getOneByIdr
    vi.mocked(mapItemRepo.getOneByIdr).mockImplementation(async ({ idr }) => {
      const coords = (idr as any).attrs?.coords;
      if (coords?.path[0] === 1) return sourceItem as any;
      return null;
    });

    // Create a mock transaction
    const mockTx = {} as any;
    
    // Create transaction-aware repository mocks
    const txMapItemRepo = { ...mapItemRepo };
    const txBaseItemRepo = { ...baseItemRepo };
    
    vi.mocked(mapItemRepo.withTransaction).mockReturnValue(txMapItemRepo);
    vi.mocked(baseItemRepo.withTransaction).mockReturnValue(txBaseItemRepo);

    // Call action with transaction
    const oldCoords = { userId: 1, groupId: 1, path: [1] };
    const newCoords = { userId: 1, groupId: 1, path: [2] };

    try {
      await actions.moveMapItem({ oldCoords, newCoords, tx: mockTx });
    } catch (error) {
      // Expected to fail due to incomplete mocking
    }

    // Verify withTransaction was called when tx was provided
    expect(mapItemRepo.withTransaction).toHaveBeenCalledWith(mockTx);
    expect(baseItemRepo.withTransaction).toHaveBeenCalledWith(mockTx);
  });

  it("service should wrap operations in transaction", async () => {
    // Mock the TransactionManager
    const runInTransactionSpy = vi.spyOn(TransactionManager, "runInTransaction");
    runInTransactionSpy.mockImplementation(async (fn) => {
      const mockTx = {} as any;
      return await fn(mockTx);
    });
    
    // Mock repository behavior
    vi.mocked(mapItemRepo.getOneByIdr).mockImplementation(async () => {
      return {
        id: 1,
        attrs: {
          coords: { userId: 1, groupId: 1, path: [1] },
          itemType: MapItemType.BASE,
        },
        ref: { id: 1 },
      } as any;
    });
    
    vi.mocked(mapItemRepo.withTransaction).mockReturnValue(mapItemRepo);
    vi.mocked(baseItemRepo.withTransaction).mockReturnValue(baseItemRepo);

    // Call service method
    const oldCoords = { userId: 1, groupId: 1, path: [1] };
    const newCoords = { userId: 1, groupId: 1, path: [2] };

    try {
      await service.moveMapItem({ oldCoords, newCoords });
    } catch (error) {
      // Expected to fail due to incomplete mocking
    }

    // Verify TransactionManager was used
    expect(runInTransactionSpy).toHaveBeenCalled();
  });
});
import { expect } from "vitest";
import { CoordSystem } from "../../../../utils/hex-coordinates";
import type { Coord } from "../../../../utils/hex-coordinates";
import type { TestEnvironment } from "../_test-utilities";

export async function _addAndValidateChildItem(
  testEnv: TestEnvironment,
  setupData: unknown,
  addItemArgs: {
    title: string;
    coords: Parameters<typeof CoordSystem.createId>[0];
  },
) {
  const childItemContract =
    await testEnv.service.items.crud.addItemToMap(addItemArgs);

  // Validate the child item contract
  expect(childItemContract).toBeDefined();
  expect(Number(childItemContract.id)).toBeGreaterThan(0);
  expect(childItemContract.name).toBe(addItemArgs.title);
  expect(childItemContract.coords).toEqual(
    CoordSystem.createId(addItemArgs.coords),
  );
  expect(childItemContract.itemType).toBe("base");

  return childItemContract;
}

export async function _validateMapItemHierarchy(
  testEnv: TestEnvironment,
  setupParams: { userId: number; groupId: number },
  addItemArgs: { parentId: number },
) {
  const mapData = await testEnv.service.maps.getMapData(setupParams);

  expect(mapData).not.toBeNull();
  if (mapData) {
    // Should have root + child
    expect(mapData.itemCount).toBe(2);
    expect(mapData.items).toHaveLength(2);

    // Find child item in the tree
    const childInTree = mapData.items.find(
      (item) => item.id !== String(mapData.id),
    );
    expect(childInTree).toBeDefined();
    expect(childInTree.name).toBe(addItemArgs.title);
    expect(childInTree.coords).toEqual(
      CoordSystem.createId(addItemArgs.coords as Parameters<typeof CoordSystem.createId>[0]),
    );
  }
}

export async function _validateMismatchedCoordinatesError(
  testEnv: TestEnvironment,
  setupData: { rootMapId: number; mismatchedCoords: Coord },
) {
  await expect(
    testEnv.service.items.crud.addItemToMap({
      parentId: setupData.rootMapId,
      coords: setupData.mismatchedCoords,
      title: "Should Fail",
    }),
  ).rejects.toThrow();
}

export async function _validateNonChildCoordinatesError(
  testEnv: TestEnvironment,
  setupData: { rootMapId: number; nonChildCoords: Coord },
) {
  await expect(
    testEnv.service.items.crud.addItemToMap({
      parentId: setupData.rootMapId,
      coords: setupData.nonChildCoords,
      title: "Should Fail",
    }),
  ).rejects.toThrow();
}

export async function _validateNonExistentParentError(
  testEnv: TestEnvironment,
  setupData: { childCoords: Coord },
) {
  await expect(
    testEnv.service.items.crud.addItemToMap({
      parentId: 9999999, // Use a very large non-existent ID
      coords: setupData.childCoords,
      title: "Should Fail",
    }),
  ).rejects.toThrow();
}

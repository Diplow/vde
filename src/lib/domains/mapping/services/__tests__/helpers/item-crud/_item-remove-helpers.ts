import { expect } from "vitest";
import { HexDirection, CoordSystem } from "../../../../utils/hex-coordinates";
import type { HexCoord } from "../../../../utils/hex-coordinates";
import type { TestEnvironment } from "../_test-utilities";
import {
  _setupBasicMap,
  _createUniqueTestParams,
  _createTestCoordinates,
} from "../_test-utilities";

export async function _setupItemHierarchyForRemoval(
  testEnv: TestEnvironment,
  setupParams: { userId: number; groupId: number },
) {
  const setupData = await _setupBasicMap(testEnv.service, setupParams);

  // Add child items to the root map
  const child1Coords = _createTestCoordinates({
    userId: setupParams.userId,
    groupId: setupParams.groupId,
    path: [HexDirection.East],
  });

  const child1 = await testEnv.service.items.crud.addItemToMap({
    parentId: setupData.id,
    coords: child1Coords,
    title: "Child 1",
  });

  const child2Coords = _createTestCoordinates({
    userId: setupParams.userId,
    groupId: setupParams.groupId,
    path: [HexDirection.West],
  });

  await testEnv.service.items.crud.addItemToMap({
    parentId: setupData.id,
    coords: child2Coords,
    title: "Child 2",
  });

  return { setupParams, setupData, child1, child1Coords, child2Coords };
}

export async function _validateItemRemovalAndHierarchy(
  testEnv: TestEnvironment,
  setupData: any,
) {
  let mapData = await testEnv.service.maps.getMapData(setupData.setupParams);
  expect(mapData.itemCount).toBe(3); // root + 2 children

  await testEnv.service.items.crud.removeItem({
    coords: setupData.child1Coords,
  });

  mapData = await testEnv.service.maps.getMapData(setupData.setupParams);
  expect(mapData.itemCount).toBe(2); // root + 1 child
}

export async function _validateRootItemRemoval(
  testEnv: TestEnvironment,
  setupParams: { userId: number; groupId: number },
) {
  const setupData = await _setupBasicMap(testEnv.service, setupParams);
  const rootCoords = CoordSystem.getCenterCoord(
    setupParams.userId,
    setupParams.groupId,
  );

  await testEnv.service.items.crud.removeItem({ coords: rootCoords });

  await expect(testEnv.service.maps.getMapData(setupParams)).rejects.toThrow();
}

export async function _validateRemoveNonExistentItemError(
  testEnv: TestEnvironment,
  setupParams: { userId: number; groupId: number },
) {
  const nonExistentCoords = _createTestCoordinates({
    userId: setupParams.userId,
    groupId: setupParams.groupId,
    path: [HexDirection.SouthWest, HexDirection.West],
  });

  await expect(
    testEnv.service.items.crud.removeItem({ coords: nonExistentCoords }),
  ).rejects.toThrow();
}

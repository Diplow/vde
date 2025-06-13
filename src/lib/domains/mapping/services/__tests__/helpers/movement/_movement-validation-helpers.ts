import { expect } from "vitest";
import { HexDirection, CoordSystem } from "../../../../utils/hex-coordinates";
import type { HexCoord } from "../../../../utils/hex-coordinates";
import type { TestEnvironment } from "../_test-utilities";
import {
  _createTestCoordinates,
  _createUniqueTestParams,
  _setupBasicMap,
} from "../_test-utilities";

export async function _validateItemMovementToEmptyCell(
  testEnv: TestEnvironment,
  movementSetup: {
    userId: number;
    groupId: number;
    item: { id: string };
    initialCoords: HexCoord;
  },
  newCoords: HexCoord,
) {
  const movedItemContract = await testEnv.service.items.query.moveMapItem({
    oldCoords: movementSetup.initialCoords,
    newCoords,
  });

  expect(movedItemContract.id).toBe(movementSetup.item.id);
  expect(movedItemContract.coords).toBe(CoordSystem.createId(newCoords));

  await _validateOldLocationEmpty(testEnv, movementSetup.initialCoords);
  await _validateNewLocationOccupied(testEnv, newCoords, movementSetup.item.id);
}

export async function _validateOldLocationEmpty(
  testEnv: TestEnvironment,
  oldCoords: HexCoord,
) {
  await expect(
    testEnv.service.items.crud.getItem({ coords: oldCoords }),
  ).rejects.toThrow();
}

export async function _validateNewLocationOccupied(
  testEnv: TestEnvironment,
  newCoords: HexCoord,
  expectedItemId: string,
) {
  const itemAtNewLocation = await testEnv.service.items.crud.getItem({
    coords: newCoords,
  });
  expect(itemAtNewLocation.id).toBe(expectedItemId);
}

export async function _validateItemSwapping(
  testEnv: TestEnvironment,
  swapSetup: {
    firstItem: { id: string };
    firstItemCoords: HexCoord;
    secondItem: { id: string };
    secondItemCoords: HexCoord;
  },
) {
  await testEnv.service.items.query.moveMapItem({
    oldCoords: swapSetup.firstItemCoords,
    newCoords: swapSetup.secondItemCoords,
  });

  const firstItemAtNewLoc = await testEnv.service.items.crud.getItem({
    coords: swapSetup.secondItemCoords,
  });
  expect(firstItemAtNewLoc.id).toBe(swapSetup.firstItem.id);

  const secondItemAtNewLoc = await testEnv.service.items.crud.getItem({
    coords: swapSetup.firstItemCoords,
  });
  expect(secondItemAtNewLoc.id).toBe(swapSetup.secondItem.id);
}

export async function _validateParentChildMovement(
  testEnv: TestEnvironment,
  hierarchySetup: {
    userId: number;
    groupId: number;
    parentItem: { id: string };
    parentInitialCoords: HexCoord;
    parentNewCoords: HexCoord;
    childItem: { id: string };
    childInitialCoords: HexCoord;
  },
) {
  await testEnv.service.items.query.moveMapItem({
    oldCoords: hierarchySetup.parentInitialCoords,
    newCoords: hierarchySetup.parentNewCoords,
  });

  await _validateParentNewPosition(
    testEnv,
    hierarchySetup.parentNewCoords,
    hierarchySetup.parentItem.id,
  );
  await _validateChildRelativePosition(testEnv, {
    ...hierarchySetup,
    childInitialCoords: hierarchySetup.childInitialCoords,
    parentInitialCoords: hierarchySetup.parentInitialCoords,
  });
  await _validateOldPositionsEmpty(testEnv, hierarchySetup);
}

export async function _validateParentNewPosition(
  testEnv: TestEnvironment,
  parentNewCoords: HexCoord,
  parentItemId: string,
) {
  const movedParent = await testEnv.service.items.crud.getItem({
    coords: parentNewCoords,
  });
  expect(movedParent.id).toBe(parentItemId);
}

export async function _validateChildRelativePosition(
  testEnv: TestEnvironment,
  hierarchySetup: {
    userId: number;
    groupId: number;
    parentNewCoords: HexCoord;
    parentItem: { id: string };
    childItem: { id: string };
    childInitialCoords: HexCoord;
    parentInitialCoords: HexCoord;
  },
) {
  // Calculate the relative path of the child from the parent
  const childRelativePath = hierarchySetup.childInitialCoords.path.slice(
    hierarchySetup.parentInitialCoords.path.length,
  );

  const expectedChildNewCoords = _createTestCoordinates({
    userId: hierarchySetup.userId,
    groupId: hierarchySetup.groupId,
    path: [...hierarchySetup.parentNewCoords.path, ...childRelativePath],
  });

  const movedChild = await testEnv.service.items.crud.getItem({
    coords: expectedChildNewCoords,
  });
  expect(movedChild.id).toBe(hierarchySetup.childItem.id);
  expect(movedChild.parentId).toBe(hierarchySetup.parentItem.id);
}

export async function _validateOldPositionsEmpty(
  testEnv: TestEnvironment,
  hierarchySetup: {
    parentInitialCoords: HexCoord;
    childInitialCoords: HexCoord;
  },
) {
  await expect(
    testEnv.service.items.crud.getItem({
      coords: hierarchySetup.parentInitialCoords,
    }),
  ).rejects.toThrow();
  await expect(
    testEnv.service.items.crud.getItem({
      coords: hierarchySetup.childInitialCoords,
    }),
  ).rejects.toThrow();
}

export async function _validateUserItemMoveRestriction(
  testEnv: TestEnvironment,
) {
  const testParams = _createUniqueTestParams();
  const userId = testParams.userId;
  const groupId = testParams.groupId;
  await _setupBasicMap(testEnv.service, { userId, groupId });

  const rootCoords = CoordSystem.getCenterCoord(userId, groupId);
  const childLikePath = _createTestCoordinates({
    userId,
    groupId,
    path: [HexDirection.East],
  });

  await expect(
    testEnv.service.items.query.moveMapItem({
      oldCoords: rootCoords,
      newCoords: childLikePath,
    }),
  ).rejects.toThrow();
}

export async function _validateCrossSpaceMovementError(
  testEnv: TestEnvironment,
  movementSetup: { userId: number; groupId: number; initialCoords: HexCoord },
) {
  const differentUserId = movementSetup.userId + 999999;
  const differentSpaceCoords = _createTestCoordinates({
    userId: differentUserId,
    groupId: movementSetup.groupId,
    path: movementSetup.initialCoords.path,
  });

  await expect(
    testEnv.service.items.query.moveMapItem({
      oldCoords: movementSetup.initialCoords,
      newCoords: differentSpaceCoords,
    }),
  ).rejects.toThrow();
}

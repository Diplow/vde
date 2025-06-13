import { describe, beforeEach, it, expect } from "vitest";
import { HexDirection } from "../../utils/hex-coordinates";
import {
  type TestEnvironment,
  _cleanupDatabase,
  _createTestEnvironment,
  _setupBasicMap,
  _createTestCoordinates,
  _createUniqueTestParams,
} from "./helpers/_test-utilities";

describe("MappingService - Item Relationships [Integration - DB]", () => {
  let testEnv: TestEnvironment;

  beforeEach(async () => {
    await _cleanupDatabase();
    testEnv = _createTestEnvironment();
  });

  describe("getDescendants", () => {
    it("should return descendants of an item", async () => {
      const hierarchySetup = await _setupComplexHierarchy();

      await _validateRootDescendants(hierarchySetup);
      await _validateChildDescendants(hierarchySetup);
      await _validateLeafDescendants(hierarchySetup);
    });
  });

  // Helper functions (prefixed with _ for internal use)
  async function _setupComplexHierarchy() {
    const testParams = _createUniqueTestParams();
    const userId = testParams.userId;
    const groupId = testParams.groupId;
    const rootMap = await _setupBasicMap(testEnv.service, { userId, groupId });

    const childCoords = _createTestCoordinates({
      userId,
      groupId,
      path: [HexDirection.NorthEast],
    });
    const childItem = await testEnv.service.items.crud.addItemToMap({
      parentId: rootMap.id,
      coords: childCoords,
      title: "Child Item",
    });

    const grandchildCoords = _createTestCoordinates({
      userId,
      groupId,
      path: [HexDirection.NorthEast, HexDirection.East],
    });
    const grandchildItem = await testEnv.service.items.crud.addItemToMap({
      parentId: childItem.id,
      coords: grandchildCoords,
      title: "Grandchild Item",
    });

    const unrelatedChildCoords = _createTestCoordinates({
      userId,
      groupId,
      path: [HexDirection.West],
    });
    await testEnv.service.items.crud.addItemToMap({
      parentId: rootMap.id,
      coords: unrelatedChildCoords,
      title: "Unrelated Item (Child of Root)",
    });

    return {
      userId,
      groupId,
      rootMap,
      childItem,
      grandchildItem,
    };
  }

  async function _validateRootDescendants(hierarchySetup: {
    userId: number;
    groupId: number;
    rootMap: { coords: Parameters<typeof testEnv.service.items.crud.getItem>[0]['coords'] };
  }) {
    const mapData = await testEnv.service.maps.getMapData({
      userId: hierarchySetup.userId,
      groupId: hierarchySetup.groupId,
    });
    expect(mapData?.items.length).toBe(4);

    const rootMapContract = await testEnv.service.items.crud.getItem({
      coords: hierarchySetup.rootMap.coords,
    });

    const rootDescendants = await testEnv.service.items.query.getDescendants({
      itemId: parseInt(rootMapContract.id),
    });
    expect(rootDescendants.length).toBe(3);
  }

  async function _validateChildDescendants(hierarchySetup: { childItem: { id: string } }) {
    const childDescendants = await testEnv.service.items.query.getDescendants({
      itemId: hierarchySetup.childItem.id,
    });
    expect(childDescendants.length).toBe(1);
    expect(childDescendants[0]!.name).toBe("Grandchild Item");
  }

  async function _validateLeafDescendants(hierarchySetup: {
    grandchildItem: { id: string };
  }) {
    const noDescendants = await testEnv.service.items.query.getDescendants({
      itemId: hierarchySetup.grandchildItem.id,
    });
    expect(noDescendants.length).toBe(0);
  }
});

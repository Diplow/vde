import { expect } from "vitest";
import { CoordSystem } from "../../../utils/hex-coordinates";
import { MapItemType } from "../../../types/contracts";
import type { TestEnvironment } from "./_test-utilities";

export async function _createAndValidateMap(
  testEnv: TestEnvironment,
  params: { userId: number; groupId: number },
  expectedData: { title?: string; descr?: string },
) {
  const createArgs = { ...params, ...expectedData };
  const mapContract = await testEnv.service.maps.createMap(createArgs);

  expect(mapContract).toBeDefined();
  expect(mapContract.id).toBeGreaterThan(0);
  expect(mapContract.title).toBe(expectedData.title ?? "Test Map");
  expect(mapContract.descr).toBe(expectedData.descr ?? "Test Description");
  expect(mapContract.coords.userId).toBe(params.userId);
  expect(mapContract.coords.groupId).toBe(params.groupId);
  expect(mapContract.coords.path).toEqual([]);

  return mapContract;
}

export async function _validateMapInRepository(
  testEnv: TestEnvironment,
  params: { userId: number; groupId: number },
  expectedData: { title: string; descr: string },
) {
  const rootItem = await testEnv.repositories.mapItem.getRootItem(
    params.userId,
    params.groupId,
  );
  expect(rootItem).not.toBeNull();
  if (rootItem) {
    expect(rootItem.attrs.coords.userId).toBe(params.userId);
    expect(rootItem.attrs.coords.groupId).toBe(params.groupId);
    expect(rootItem.attrs.itemType).toBe(MapItemType.USER);
    expect(rootItem.ref.attrs.title).toBe(expectedData.title);
  }
}

export function _validateRetrievedMapData(
  retrievedMapData: any,
  createdMap: any,
  params: { userId: number; groupId: number },
) {
  expect(retrievedMapData).not.toBeNull();
  if (retrievedMapData) {
    expect(retrievedMapData.id).toBe(createdMap.id);
    expect(retrievedMapData.title).toBe(createdMap.title);
    expect(retrievedMapData.descr).toBe(createdMap.descr);
    expect(retrievedMapData.coords).toEqual(
      CoordSystem.getCenterCoord(params.userId, params.groupId),
    );
    expect(retrievedMapData.itemCount).toBe(1);
  }
}

export async function _setupMultipleUserMaps(
  testEnv: TestEnvironment,
  userId: number,
) {
  const map1 = await testEnv.service.maps.createMap({
    userId,
    groupId: 0,
    title: "First Map",
  });
  const map2 = await testEnv.service.maps.createMap({
    userId,
    groupId: 1,
    title: "Second Map",
  });
  const otherUserMap = await testEnv.service.maps.createMap({
    userId: userId + 1,
    groupId: 0,
    title: "Other User Map",
  });

  return { map1, map2, otherUserMap };
}

export function _validateUserMapsRetrieval(
  retrievedMaps: any[],
  expectedMaps: any[],
) {
  expect(retrievedMaps).toHaveLength(2);
  expect(retrievedMaps.map((m) => m.id).sort()).toEqual(
    expectedMaps.map((m) => m.id).sort(),
  );
}

export async function _updateAndValidateMapInfo(
  testEnv: TestEnvironment,
  params: { userId: number; groupId: number },
  updateData: { title: string; descr: string },
  expectedId: number,
) {
  const updateArgs = { ...params, ...updateData };
  const updatedMap = await testEnv.service.maps.updateMapInfo(updateArgs);

  expect(updatedMap).not.toBeNull();
  if (updatedMap) {
    expect(updatedMap.id).toBe(expectedId);
    expect(updatedMap.title).toBe(updateData.title);
    expect(updatedMap.descr).toBe(updateData.descr);
  }
  return updatedMap;
}

export async function _validateUpdatedMapInRepository(
  testEnv: TestEnvironment,
  params: { userId: number; groupId: number },
  updateData: { title: string; descr: string },
) {
  const rootItem = await testEnv.repositories.mapItem.getRootItem(
    params.userId,
    params.groupId,
  );
  expect(rootItem?.ref.attrs.title).toBe(updateData.title);
}

export async function _validateMapRemoval(
  testEnv: TestEnvironment,
  params: { userId: number; groupId: number },
) {
  await expect(testEnv.service.maps.getMapData(params)).rejects.toThrow();
  const rootItem = await testEnv.repositories.mapItem.getRootItem(
    params.userId,
    params.groupId,
  );
  expect(rootItem).toBeNull();
}

export async function _createAndUpdateMap(
  testEnv: TestEnvironment,
  createParams: { userId: number; groupId: number },
  updateData: { title?: string; descr?: string },
) {
  const createArgs = { ...createParams, title: "Original", descr: "Original" };
  const originalMap = await testEnv.service.maps.createMap(createArgs);

  const updateArgs = { ...createParams, ...updateData };
  const updatedMap = await testEnv.service.maps.updateMapInfo(updateArgs);

  expect(updatedMap).toBeDefined();
  expect(updatedMap!.id).toBe(originalMap.id);
  expect(updatedMap!.title).toBe(updateData.title ?? "Original");
  expect(updatedMap!.descr).toBe(updateData.descr ?? "Original");

  return { originalMap, updatedMap };
}

export async function _validateMapDataError(
  testEnv: TestEnvironment,
  params: { userId: number; groupId: number },
) {
  await expect(testEnv.service.maps.getMapData(params)).rejects.toThrow();
}

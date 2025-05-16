import type {
  MapItemRepository,
  MapRepository,
  BaseItemRepository,
} from "~/lib/domains/mapping/_repositories";
import { MapActions } from "~/lib/domains/mapping/_actions";
import { adapt, MapItemContract } from "~/lib/domains/mapping/types/contracts";
import { MapContract } from "~/lib/domains/mapping/types/contracts";
import { HexCoord } from "~/lib/domains/mapping/utils/hex-coordinates";
import { MAPPING_ERRORS } from "../types/errors";
import { HexCoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
import { MapItemWithId } from "../_objects";

export class MapService {
  private readonly actions: MapActions;

  constructor(repositories: {
    map: MapRepository;
    mapItem: MapItemRepository;
    baseItem: BaseItemRepository;
  }) {
    this.actions = new MapActions(repositories);
  }

  public async getOne(mapId: string): Promise<MapContract> {
    const numericId = MapService.validateAndParseId(mapId);
    return adapt.map(await this.actions.get(numericId));
  }

  public async getMany(
    limit?: number,
    offset?: number,
  ): Promise<MapContract[]> {
    const params = MapService.validatePaginationParameters(limit, offset);
    const maps = await this.actions.getMany({
      limit: params.limit,
      offset: params.offset,
    });
    return maps.map(adapt.map);
  }

  public async getByOwnerId(
    ownerId: string,
    limit?: number,
    offset?: number,
  ): Promise<MapContract[]> {
    const params = MapService.validatePaginationParameters(limit, offset);
    const maps = await this.actions.getByOwnerId({
      ownerId: parseInt(ownerId),
      limit: params.limit,
      offset: params.offset,
    });
    return maps.map(adapt.map);
  }

  public async create({
    title,
    descr,
    ownerId,
  }: {
    title?: string;
    descr?: string;
    ownerId: string;
  }): Promise<MapContract> {
    const centerItem = await this.actions.createMapItem({
      title,
      descr,
    });
    const map = await this.actions.create({
      center: centerItem,
      attrs: {
        ownerId: parseInt(ownerId),
      },
    });
    return adapt.map(map);
  }

  public async update({
    mapId,
    title,
    descr,
  }: {
    mapId: string;
    title?: string;
    descr?: string;
  }): Promise<MapContract> {
    const numericId = MapService.validateAndParseId(mapId);
    const map = await this.actions.get(numericId);
    const ref = map.center.ref;
    const updated = await this.actions.updateRef(ref, {
      title,
      descr,
    });
    return adapt.map({ ...map, center: { ...map.center, ref: updated } });
  }

  public async remove(mapId: string): Promise<void> {
    const numericId = MapService.validateAndParseId(mapId);
    await this.actions.remove({ mapId: numericId });
  }

  public async addItem({
    mapId,
    coords,
    title,
    descr,
    url,
  }: {
    mapId: string;
    coords: HexCoord;
    title?: string;
    descr?: string;
    url?: string;
  }) {
    const numericMapId = MapService.validateAndParseId(mapId);

    const newItem = await this.actions.createMapItem({
      title,
      descr,
      url,
      coords,
      mapId: numericMapId,
    });
    return adapt.mapItem(newItem, numericMapId);
  }

  public async getItems({
    mapId,
  }: {
    mapId: string;
  }): Promise<MapItemContract[]> {
    const numericMapId = MapService.validateAndParseId(mapId);
    const items = await this.actions.getItems({ mapId: numericMapId });
    return items.map((item) => adapt.mapItem(item, numericMapId));
  }

  public async getItem({
    mapId,
    coords,
  }: {
    mapId: string;
    coords: HexCoord;
  }): Promise<MapItemContract> {
    const numericMapId = MapService.validateAndParseId(mapId);
    const item = await this.actions.getMapItem({
      mapId: numericMapId,
      coords,
    });
    return adapt.mapItem(item, numericMapId);
  }

  public async removeItem({
    itemId,
    mapId,
  }: {
    itemId: string;
    mapId: string;
  }): Promise<void> {
    const numericMapId = MapService.validateAndParseId(mapId);
    // The itemId is actually a coordinate string, so we should parse it to get the coordinates
    const coords = HexCoordSystem.parseId(itemId);

    await this.actions.removeItem({
      idr: {
        attrs: {
          mapId: numericMapId,
          coords,
        },
      },
    });
  }

  public async updateItem({
    itemId,
    mapId,
    title,
    descr,
    color,
    url,
  }: {
    itemId: string;
    mapId: string;
    title?: string;
    descr?: string;
    color?: string;
    url?: string;
  }) {
    // The itemId is actually a coordinate string, so we should parse it to get the coordinates
    const coords = HexCoordSystem.parseId(itemId);
    const numericMapId = MapService.validateAndParseId(mapId);
    const item = await this.actions.updateItem({
      idr: {
        attrs: {
          coords,
          mapId: numericMapId,
        },
      },
      attrs: {
        color: color as any, // Type assertion for HexColor compatibility
      },
    });

    // If title, description or url are provided, update the reference item
    if (title !== undefined || descr !== undefined || url !== undefined) {
      await this.actions.updateRef(item.ref, {
        title,
        descr,
        link: url,
      });
    }

    // Return the adapted item to match the expected contract
    return adapt.mapItem(item, numericMapId);
  }

  public async moveMapItem({
    mapId,
    oldCoords,
    newCoords,
  }: {
    mapId: string;
    oldCoords: HexCoord;
    newCoords: HexCoord;
  }) {
    const numericMapId = MapService.validateAndParseId(mapId);

    const updatedMap = await this.actions.moveMapItem({
      mapId: numericMapId,
      oldCoords,
      newCoords,
    });

    return adapt.map(updatedMap);
  }

  /**
   * Gets all descendants of a specific item in the map
   * @param mapId The ID of the map
   * @param itemId The coordinate ID of the item
   * @returns Array of map items that are descendants of the given item
   */
  public async getDescendants({
    mapId,
    itemId,
  }: {
    mapId: string;
    itemId: string;
  }): Promise<MapItemContract[]> {
    const numericMapId = MapService.validateAndParseId(mapId);
    const itemIdr = {
      mapId: numericMapId,
      coords: HexCoordSystem.parseId(itemId),
    };
    let item: MapItemWithId;
    try {
      item = await this.actions.getMapItem(itemIdr);
    } catch (error) {
      return [];
    }
    // Call the action's getDescendants method
    const descendants = await this.actions.getDescendants(item.id);

    // Convert the descendants to the contract format
    return descendants.map((item) => adapt.mapItem(item, numericMapId));
  }

  private static validateAndParseId(id: string) {
    const numericId = parseInt(id);
    if (isNaN(numericId) || numericId <= 0) {
      throw new Error(MAPPING_ERRORS.INVALID_ID);
    }
    return numericId;
  }

  private static validatePaginationParameters(limit?: number, offset?: number) {
    return {
      limit: limit && limit > 0 ? Math.min(limit, 100) : 50,
      offset: offset && offset >= 0 ? offset : 0,
    };
  }
}

import type { MapRepository } from "~/lib/domains/mapping/repositories";
import { MapActions } from "~/lib/domains/mapping/actions";
import {
  adapters,
  MapContract,
  MapItemContract,
} from "~/lib/domains/mapping/services/adapters";
import {
  MapAggregate,
  MapItemAggregate,
  MapItemType,
  OwnerEntity,
} from "~/lib/domains/mapping/objects";
import { HexCoordinate } from "~/lib/hex-coordinates";

export class MapService {
  private readonly actions: MapActions;

  constructor(private readonly repository: MapRepository) {
    this.actions = new MapActions(repository);
  }

  public async getOne(mapId: string): Promise<MapContract> {
    const numericId = MapService.validateAndParseId(mapId);
    return adapters.map(await this.actions.getOne(numericId));
  }

  public async getMany(
    limit?: number,
    offset?: number,
  ): Promise<MapContract[]> {
    const params = MapService.validatePaginationParameters(limit, offset);
    const maps = await this.repository.getMany(params.limit, params.offset);
    return maps.map(adapters.map);
  }

  public async getByOwnerId(
    ownerId: string,
    limit?: number,
    offset?: number,
  ): Promise<MapContract[]> {
    const params = MapService.validatePaginationParameters(limit, offset);
    const maps = await this.repository.getByOwnerId(
      ownerId,
      params.limit,
      params.offset,
    );
    return maps.map(adapters.map);
  }

  public async create(
    name: string,
    description: string | null,
    ownerId: string,
    rows?: number,
    columns?: number,
    baseSize?: number,
  ): Promise<MapContract> {
    MapAggregate.validateName(name);

    const map = await this.actions.create(
      name,
      description,
      { id: ownerId, name: ownerId },
      rows,
      columns,
      baseSize,
    );
    return adapters.map(map);
  }

  public async update(
    mapId: string,
    data: {
      name?: string;
      description?: string | null;
      rows?: number;
      columns?: number;
      baseSize?: number;
    },
  ): Promise<MapContract> {
    MapService.validateUpdateDataIsNotEmpty(data);

    if (data.name) {
      MapAggregate.validateName(data.name);
    }

    if (
      data.rows !== undefined ||
      data.columns !== undefined ||
      data.baseSize !== undefined
    ) {
      MapAggregate.validateDimensions({
        rows: data.rows,
        columns: data.columns,
        baseSize: data.baseSize,
      });
    }

    const numericId = MapService.validateAndParseId(mapId);
    return adapters.map(await this.actions.update(numericId, data));
  }

  public async remove(mapId: string): Promise<void> {
    const numericId = MapService.validateAndParseId(mapId);
    await this.actions.remove(numericId);
  }

  /**
   * Get all map items for a map
   */
  public async getMapItems(mapId: string): Promise<MapItemContract[]> {
    const numericId = MapService.validateAndParseId(mapId);
    const map = await this.actions.getOne(numericId);

    // Transform map items into a more client-friendly format
    return map.items.map(adapters.mapItem);
  }

  /**
   * Get map items with their full details
   */
  public async getMapItemsWithDetails(
    mapId: string,
  ): Promise<MapItemContract[]> {
    const items = await this.getMapItems(mapId);

    // In a real implementation, we would fetch the actual item details
    // based on the item ID and type from their respective repositories

    return items;
  }

  /**
   * Add an item to a map
   */
  public async addItemToMap(
    mapId: string,
    itemId: number,
    itemType: MapItemType,
    coordinates: HexCoordinate,
    ownerId: string,
  ): Promise<MapItemContract> {
    const numericMapId = MapService.validateAndParseId(mapId);

    // Create a new map item entity
    const mapItem = new MapItemAggregate(
      {
        id: 0, // Temporary ID, will be assigned by the repository
        mapId: numericMapId,
        reference: { id: itemId, type: itemType },
        coordinates,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      new OwnerEntity({ id: ownerId }),
      [],
    );

    // Add the item to the map
    await this.repository.addItem(
      numericMapId,
      coordinates,
      mapItem.data.reference,
      ownerId,
    );

    return adapters.mapItem(mapItem);
  }

  /**
   * Remove an item from a map
   */
  public async removeItemFromMap(
    mapId: string,
    itemId: number,
    itemType: MapItemType,
  ): Promise<void> {
    const numericMapId = MapService.validateAndParseId(mapId);

    // Remove the item from the map
    await this.repository.removeItem(numericMapId, {
      id: itemId,
      type: itemType,
    });
  }

  private static validateAndParseId(id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      throw new Error("Invalid ID: must be a positive number");
    }
    return numericId;
  }

  private static validatePaginationParameters(limit?: number, offset?: number) {
    return {
      limit: limit && limit > 0 ? Math.min(limit, 100) : 50,
      offset: offset && offset >= 0 ? offset : 0,
    };
  }

  private static validateUpdateDataIsNotEmpty(data: {
    name?: string;
    description?: string | null;
    rows?: number;
    columns?: number;
    baseSize?: number;
  }) {
    if (
      !data.name &&
      data.description === undefined &&
      data.rows === undefined &&
      data.columns === undefined &&
      data.baseSize === undefined
    ) {
      throw new Error("No update data provided");
    }
  }
}

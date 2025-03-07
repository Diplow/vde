/**
 * A generic interface for entity attributes
 * All entities must have an id and timestamps
 */
export interface GenericAttributes {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any; // Allow for any additional properties
}

/**
 * A generic entity class
 */
export interface GenericEntity<T extends GenericAttributes> {
  readonly data: T;
}

/**
 * Generic entity constructor type
 */
export type EntityConstructor<
  T extends GenericAttributes,
  E extends GenericEntity<T>,
> = new (data: T) => E;

/**
 * A generic memory repository that can be used for any entity type
 */
export class GenericMemoryRepository<
  T extends GenericAttributes,
  E extends GenericEntity<T>,
> {
  private entities: Map<number, T> = new Map();
  private idCounter: number = 1;
  private entityConstructor: EntityConstructor<T, E>;

  constructor(entityConstructor: EntityConstructor<T, E>) {
    this.entityConstructor = entityConstructor;
  }

  /**
   * Get an entity by ID
   */
  async getOne(id: number): Promise<E> {
    const entity = this.entities.get(id);
    if (!entity) {
      throw new Error(`Entity with ID ${id} not found`);
    }
    return new this.entityConstructor(entity);
  }

  /**
   * Get multiple entities with pagination
   */
  async getMany(limit = 50, offset = 0): Promise<E[]> {
    const entities = Array.from(this.entities.values())
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(offset, offset + limit);

    return entities.map((entity) => new this.entityConstructor(entity));
  }

  /**
   * Get entities by a specific field value
   */
  async getByField(
    fieldName: keyof T,
    value: any,
    limit = 50,
    offset = 0,
  ): Promise<E[]> {
    const entities = Array.from(this.entities.values())
      .filter((entity) => entity[fieldName] === value)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(offset, offset + limit);

    return entities.map((entity) => new this.entityConstructor(entity));
  }

  /**
   * Create a new entity
   */
  async create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<E> {
    const id = this.idCounter++;
    const now = new Date();

    const entity = {
      id,
      createdAt: now,
      updatedAt: now,
      ...data,
    } as T;

    this.entities.set(id, entity);
    return new this.entityConstructor(entity);
  }

  /**
   * Update an existing entity
   */
  async update(
    id: number,
    data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>,
  ): Promise<E> {
    const entity = this.entities.get(id);
    if (!entity) {
      throw new Error(`Entity with ID ${id} not found`);
    }

    // Ensure the updatedAt timestamp is different from the original
    const now = new Date();
    if (now.getTime() === entity.updatedAt.getTime()) {
      now.setMilliseconds(now.getMilliseconds() + 1);
    }

    const updatedEntity = {
      ...entity,
      ...data,
      updatedAt: now,
    };

    this.entities.set(id, updatedEntity);
    return new this.entityConstructor(updatedEntity);
  }

  /**
   * Remove an entity
   */
  async remove(id: number): Promise<void> {
    if (!this.entities.has(id)) {
      throw new Error(`Entity with ID ${id} not found`);
    }

    this.entities.delete(id);
  }

  /**
   * Reset the repository (useful for testing)
   */
  reset(): void {
    this.entities.clear();
    this.idCounter = 1;
  }
}

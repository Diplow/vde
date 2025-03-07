export interface MapAttributes {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  ownerType: string;
  createdAt: Date;
  updatedAt: Date;
}

export class MapEntity {
  readonly data: MapAttributes;

  constructor(data: MapAttributes) {
    this.data = {
      ...data,
      description: data.description ?? null,
    };
  }
}

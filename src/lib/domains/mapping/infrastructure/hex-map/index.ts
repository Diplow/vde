export { MapMemoryRepository } from "./memory";

import { adapt as mapMemoryAdapter } from "./memory.adapter";
import { adapt as mapItemMemoryAdapter } from "../map-item/memory.adapter";

export const adapters = {
  map: {
    memory: mapMemoryAdapter,
  },
  mapItem: {
    memory: mapItemMemoryAdapter,
  },
};

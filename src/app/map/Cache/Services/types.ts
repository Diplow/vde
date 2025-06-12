// Service interface types for dependency injection and mocking

export interface ServerService {
  // Data fetching operations (primary purpose)
  fetchItemsForCoordinate: (params: {
    centerCoordId: string;
    maxDepth: number;
  }) => Promise<any[]>;

  // Additional query operations
  getItemByCoordinate: (coordId: string) => Promise<any>;
  getRootItemById: (mapItemId: number) => Promise<any>;
  getDescendants: (itemId: number) => Promise<any[]>;

  // Mutation operations (architectural placeholders - should use mutation layer)
  createItem: (params: { coordId: string; data: any }) => Promise<any>;
  updateItem: (params: { coordId: string; data: any }) => Promise<any>;
  deleteItem: (params: { coordId: string }) => Promise<void>;
}

export interface StorageService {
  save: (key: string, data: any) => Promise<void>;
  load: (key: string) => Promise<any>;
  remove: (key: string) => Promise<void>;
  clear: () => Promise<void>;

  // Cache-specific operations for future enhancement
  saveCacheData: (cacheData: any) => Promise<void>;
  loadCacheData: () => Promise<any>;
  saveUserPreferences: (preferences: any) => Promise<void>;
  loadUserPreferences: () => Promise<any>;
  saveExpandedItems: (expandedItems: string[]) => Promise<void>;
  loadExpandedItems: () => Promise<string[]>;

  // Health check
  isAvailable: () => Promise<boolean>;
}

// Service configuration options
export interface ServiceConfig {
  enableRetry?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  timeoutMs?: number;
}

// Service factory types for dependency injection
export type ServiceFactory<T> = (config?: ServiceConfig) => T;

// Error types for service operations
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export class NetworkError extends ServiceError {
  constructor(message: string, originalError?: Error) {
    super(message, "NETWORK_ERROR", originalError);
    this.name = "NetworkError";
  }
}

export class TimeoutError extends ServiceError {
  constructor(message: string) {
    super(message, "TIMEOUT_ERROR");
    this.name = "TimeoutError";
  }
}

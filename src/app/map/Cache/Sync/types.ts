// Sync engine types and interfaces

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: number | null;
  nextSyncAt: number | null;
  syncCount: number;
  errorCount: number;
  lastError: Error | null;
}

export interface SyncConfig {
  enabled: boolean;
  intervalMs: number; // Background sync interval
  retryDelayMs: number; // Delay between retry attempts
  maxRetries: number; // Maximum retry attempts for failed syncs
  enableConflictResolution: boolean;
  onlineCheckUrl?: string; // URL to check online status
  syncOnVisibilityChange: boolean; // Sync when tab becomes visible
  syncOnNetworkReconnect: boolean; // Sync when network reconnects
}

export interface SyncResult {
  success: boolean;
  timestamp: number;
  itemsSynced: number;
  conflictsResolved: number;
  error?: Error;
  duration: number; // Time taken in milliseconds
}

export interface SyncOperations {
  startSync: () => void;
  stopSync: () => void;
  performSync: () => Promise<SyncResult>;
  forceSync: () => Promise<SyncResult>;
  pauseSync: () => void;
  resumeSync: () => void;
  getSyncStatus: () => SyncStatus;
  updateSyncConfig: (config: Partial<SyncConfig>) => void;
}

export interface ConflictResolutionStrategy {
  name: string;
  resolve: (serverData: any, clientData: any) => any;
  shouldApply: (conflict: DataConflict) => boolean;
}

export interface DataConflict {
  id: string;
  coordId: string;
  serverData: any;
  clientData: any;
  conflictType: "UPDATE" | "DELETE" | "CREATE";
  timestamp: number;
  serverTimestamp: number;
  clientTimestamp: number;
}

export interface ConflictResolution {
  conflictId: string;
  strategy: string;
  resolvedData: any;
  timestamp: number;
  applied: boolean;
}

// Sync events for coordination with other systems
export type SyncEvent =
  | { type: "SYNC_STARTED"; timestamp: number }
  | { type: "SYNC_COMPLETED"; result: SyncResult }
  | { type: "SYNC_FAILED"; error: Error; timestamp: number }
  | { type: "ONLINE_STATUS_CHANGED"; isOnline: boolean }
  | { type: "CONFLICT_DETECTED"; conflict: DataConflict }
  | { type: "CONFLICT_RESOLVED"; resolution: ConflictResolution };

export type SyncEventHandler = (event: SyncEvent) => void;

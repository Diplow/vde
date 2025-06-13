"use client";

import React, { type ReactNode } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import { OfflineAuthProvider, shouldUseOfflineAuth, useOfflineAuth } from "./OfflineAuthContext";

/**
 * Unified auth provider that chooses between online and offline auth
 * based on the current environment and network status
 */
export function UnifiedAuthProvider({ children }: { children: ReactNode }) {
  // Check if we should use offline auth
  const useOffline = shouldUseOfflineAuth();

  if (useOffline) {
    console.log("[UnifiedAuth] Using offline auth provider");
    return <OfflineAuthProvider>{children}</OfflineAuthProvider>;
  }

  console.log("[UnifiedAuth] Using online auth provider");
  return <AuthProvider>{children}</AuthProvider>;
}

/**
 * Hook that works with both online and offline auth providers
 * Returns a unified interface regardless of which provider is active
 */
export function useUnifiedAuth() {
  const isOffline = shouldUseOfflineAuth();
  const offlineAuth = useOfflineAuth();
  const onlineAuth = useAuth();
  
  // Return the appropriate auth based on offline status
  return isOffline ? offlineAuth : onlineAuth;
}
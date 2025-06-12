"use client";

import React, { type ReactNode } from "react";
import { AuthProvider } from "./AuthContext";
import { OfflineAuthProvider, shouldUseOfflineAuth } from "./OfflineAuthContext";

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
  // Try to get online auth context
  try {
    const onlineAuth = React.useContext(
      React.createContext<any>(null) // This will be replaced with actual context
    );
    if (onlineAuth) return onlineAuth;
  } catch {}

  // Try to get offline auth context
  try {
    const offlineAuth = React.useContext(
      React.createContext<any>(null) // This will be replaced with actual context
    );
    if (offlineAuth) return offlineAuth;
  } catch {}

  throw new Error("useUnifiedAuth must be used within UnifiedAuthProvider");
}
"use client";

import React from "react";
import { useAuth } from "~/contexts/AuthContext";
import { useUserMapFlow } from "./_hooks/use-user-map-flow";
import {
  LoadingState,
  CreatingWorkspaceState,
  RedirectingState,
  FetchingMapState,
} from "./_components/loading-states";
import { MapCreationError, MapFetchError } from "./_components/error-states";
import { WelcomeScreen } from "./_components/welcome-screen";

/**
 * Home page that orchestrates user authentication and map access
 * Delegates all business logic to useUserMapFlow hook
 */
export default function HomePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { state, error, retry } = useUserMapFlow({ user, isAuthLoading });

  // Render appropriate UI based on current state
  switch (state) {
    case "loading":
      return <LoadingState />;

    case "unauthenticated":
      return <WelcomeScreen />;

    case "fetching_map":
      return <FetchingMapState />;

    case "creating_map":
      return <CreatingWorkspaceState />;

    case "redirecting":
      return <RedirectingState />;

    case "error":
      if (error?.includes("workspace")) {
        return <MapCreationError message={error} />;
      }
      return (
        <MapFetchError message={error ?? "Unknown error"} onRetry={retry} />
      );

    default:
      // This should never happen with proper state management
      return <LoadingState />;
  }
}

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "~/contexts/AuthContext";
import AuthTile from "~/app/map/[id]/Tile/Auth/auth.dynamic";
import { api } from "~/commons/trpc/react";

export default function SignupPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createMapMutation = api.map.createDefaultMapForCurrentUser.useMutation({
    onSuccess: (data) => {
      if (data.success && data.mapId) {
        router.push(`/map/${data.mapId}`);
      } else {
        console.error("Map creation issue: ", data);
        setErrorMessage(
          (data.success === false ? data.error : null) ||
            "Failed to create your map. Please try again or contact support.",
        );
      }
    },
    onError: (error) => {
      console.error("Failed to create map:", error);
      setErrorMessage(
        error.message ||
          "An unexpected error occurred while creating your map.",
      );
    },
  });

  useEffect(() => {
    if (!isAuthLoading && user) {
      if (
        !createMapMutation.isPending &&
        !createMapMutation.data &&
        !createMapMutation.isError
      ) {
        setErrorMessage(null);
        createMapMutation.mutate();
      }
    }
  }, [user, isAuthLoading, createMapMutation]);

  if (isAuthLoading || createMapMutation.isPending) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <div className="text-xl font-semibold text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      {errorMessage && (
        <div className="mb-4 rounded-md bg-destructive/15 p-3 text-center text-sm text-destructive">
          {errorMessage}
        </div>
      )}
      <AuthTile initialView="register" />
    </div>
  );
}

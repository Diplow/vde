"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "~/contexts/AuthContext";
import AuthTile from "~/app/map/[id]/Tile/auth.dynamic";
import { api } from "~/commons/trpc/react";

export default function LoginPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [pageError, setPageError] = useState<string | null>(null);

  const getUserMapQuery = api.map.getUserMap.useQuery(undefined, {
    enabled: false,
    retry: false,
  });

  useEffect(() => {
    setPageError(null);
    if (!isAuthLoading && user) {
      console.log(
        "[LoginPage] Auth state updated. User present, auth not loading. Attempting to fetch user map.",
        { userId: user.id, isAuthLoading },
      );
      void getUserMapQuery.refetch();
    } else {
      console.log(
        "[LoginPage] Auth state changed, but conditions for map fetch not met.",
        { user: !!user, isAuthLoading },
      );
    }
  }, [user, isAuthLoading, getUserMapQuery]);

  useEffect(() => {
    if (getUserMapQuery.isSuccess) {
      const data = getUserMapQuery.data;
      if (data?.success && data.map?.id) {
        router.push(`/map/${data.map.id}`);
      } else if (data?.success && data.map === null) {
        setPageError(
          "You are logged in, but no map is associated with your account. Please contact support or try creating a new map if applicable.",
        );
      } else if (data && !data.success) {
        console.error(
          "Error fetching user map (data.success false):",
          data.error,
        );
        setPageError(data.error ?? "Failed to retrieve your map details.");
      }
    } else if (getUserMapQuery.isError) {
      console.error(
        "Error fetching user map (query.isError):",
        getUserMapQuery.error,
      );
      setPageError(
        getUserMapQuery.error?.message ??
          "An error occurred while fetching your map information.",
      );
    }
  }, [
    getUserMapQuery.data,
    getUserMapQuery.isSuccess,
    getUserMapQuery.isError,
    router,
    getUserMapQuery.error,
  ]);

  if (isAuthLoading || (user && getUserMapQuery.isFetching)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <div className="text-xl font-semibold text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      {pageError && (
        <div className="mb-4 rounded-md bg-red-100 p-3 text-center text-red-700">
          <p>{pageError}</p>
        </div>
      )}
      {!user && <AuthTile initialView="login" />}
    </div>
  );
}

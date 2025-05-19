"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "~/contexts/AuthContext";
import { api } from "~/commons/trpc/react";
import { Button } from "~/components/ui/button";

export default function HomePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const getUserMapQuery = api.map.getUserMap.useQuery(undefined, {
    enabled: false, // important: do not run on mount
    retry: false,
  });

  useEffect(() => {
    if (!isAuthLoading && user) {
      // User is authenticated, try to get their map
      getUserMapQuery.refetch();
    }
  }, [user, isAuthLoading, getUserMapQuery]);

  useEffect(() => {
    if (getUserMapQuery.isSuccess) {
      const data = getUserMapQuery.data;
      if (data?.success && data.map?.id) {
        router.push(`/map/${data.map.id}`);
      } else if (data?.success && data.map === null) {
        // Authenticated user has no map - redirect to signup to trigger map creation flow
        // or show a specific message/UI if preferred.
        // The signup page logic should handle an authenticated user by trying to create a map.
        router.push("/signup");
      } else if (data && !data.success) {
        // Error from getUserMap, e.g. DB error
        console.error("Error fetching user map on homepage:", data.error);
        // Show an error message to the user on the page
      }
    }
    if (getUserMapQuery.isError) {
      console.error(
        "Error fetching user map on homepage (query error):",
        getUserMapQuery.error,
      );
      // Show an error message to the user on the page
    }
  }, [
    getUserMapQuery.data,
    getUserMapQuery.isSuccess,
    getUserMapQuery.isError,
    getUserMapQuery.error,
    router,
  ]);

  if (isAuthLoading || (user && getUserMapQuery.isFetching)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <div className="text-xl font-semibold text-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    // User is not authenticated, show Login/Signup options
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <div className="rounded-lg bg-card p-8 text-center shadow-xl">
          <h1 className="mb-6 text-3xl font-bold text-foreground">
            Welcome to VDE
          </h1>
          <p className="mb-8 text-muted-foreground">
            Join our community for deliberate people. Create and explore maps.
          </p>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <Link href="/login" passHref legacyBehavior>
              <Button size="lg" className="w-full sm:w-auto">
                Login
              </Button>
            </Link>
            <Link href="/signup" passHref legacyBehavior>
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
              >
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated user, but map status is being determined or there was an error client-side with the query
  // getUserMapQuery.isError might be true here if the query failed before `isSuccess` was processed.
  if (
    getUserMapQuery.isError ||
    (getUserMapQuery.data && !getUserMapQuery.data.success)
  ) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <div className="rounded-lg bg-card p-8 text-center shadow-xl">
          <h2 className="mb-4 text-2xl font-semibold text-destructive">
            Map Error
          </h2>
          <p className="mb-6 text-muted-foreground">
            We encountered an issue accessing your map data. Please try again
            later or contact support if the problem persists.
          </p>
          <Button
            onClick={() => getUserMapQuery.refetch()}
            disabled={getUserMapQuery.isFetching}
          >
            {getUserMapQuery.isFetching ? "Retrying..." : "Try Again"}
          </Button>
        </div>
      </div>
    );
  }

  // Fallback for authenticated users while map is loading or if state is unusual
  // This should ideally be covered by the loading state above, but as a safeguard:
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="text-xl font-semibold text-foreground">
        Loading user data...
      </div>
    </div>
  );
}

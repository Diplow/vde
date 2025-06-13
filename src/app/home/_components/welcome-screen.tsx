import React from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";

/**
 * Welcome screen shown to unauthenticated users
 */
export function WelcomeScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="rounded-lg bg-card p-8 text-center shadow-xl">
        <h1 className="mb-6 text-3xl font-bold text-foreground">
          Welcome to Hexframe
        </h1>
        <p className="mb-8 text-muted-foreground">
          Join our community for deliberate people. Create and explore maps.
        </p>
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
          <Link href="/auth/login" passHref legacyBehavior>
            <Button size="lg" className="w-full sm:w-auto">
              Login
            </Button>
          </Link>
          <Link href="/auth/signup" passHref legacyBehavior>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
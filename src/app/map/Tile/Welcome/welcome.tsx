"use client";

import React from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { DynamicBaseTileLayout } from "~/app/map/Tile/Base";

export type WelcomeTileProps = Record<string, never>;

export default function WelcomeTile() {
  return (
    <DynamicBaseTileLayout 
      coordId="welcome" 
      scale={3}
      color={{ color: "zinc", tint: "50" }}
    >
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="text-center">
          <h1 className="mb-6 text-3xl font-bold text-gray-800">
            Welcome to <span className="text-amber-600">HexFrame</span>
          </h1>
          <p className="mb-8 text-gray-600">
            Join our community for deliberate people. Create and explore maps.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link href="/auth/login" passHref legacyBehavior>
              <Button 
                size="lg" 
                className="bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500"
              >
                Login
              </Button>
            </Link>
            <Link href="/auth/signup" passHref legacyBehavior>
              <Button 
                size="lg" 
                className="bg-indigo-500 text-white hover:bg-indigo-600 focus:ring-indigo-400"
              >
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </DynamicBaseTileLayout>
  );
}

// Named exports for index.ts
export const DynamicWelcomeTile = WelcomeTile;
export type DynamicWelcomeTileProps = WelcomeTileProps;
"use client";

import { HexGrid } from "~/components/HexGrid";
import { SignInButton } from "~/components/SignInButton";

export default function MapPage() {
  return (
    <main className="relative min-h-screen bg-slate-200">
      <SignInButton />
      <div className="absolute inset-0">
        <HexGrid
          dimensions={{
            rows: 10,
            cols: 10,
            baseSize: 64,
          }}
        />
      </div>
    </main>
  );
}

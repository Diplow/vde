"use client";

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="h-screen flex-1 overflow-hidden bg-zinc-600 p-0">
      {children}
    </main>
  );
}

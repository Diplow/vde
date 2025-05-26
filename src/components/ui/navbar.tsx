"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "~/lib/utils";
import { Map, ChevronLeft, ChevronRight } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    {
      name: "Maps",
      href: "/maps",
      icon: <Map size={20} />,
    },
  ];

  return (
    <nav
      className={cn(
        "flex h-full flex-col border-r bg-background transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-14 items-center justify-between border-b px-4">
        {!isCollapsed && (
          <Link href="/" className="text-xl font-bold">
            VDE
          </Link>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-md p-1 hover:bg-accent"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      <div className="flex flex-col space-y-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex h-10 items-center rounded-md px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              pathname === item.href || pathname.startsWith(`${item.href}/`)
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground",
              isCollapsed && "justify-center px-2",
            )}
            title={isCollapsed ? item.name : undefined}
          >
            <span className="mr-2">{item.icon}</span>
            {!isCollapsed && item.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}

"use client";

import { FC } from "react";

interface EventIndicatorProps {
  event: {
    title: string;
    startDate: Date;
    endDate: Date;
  };
}

export const EventIndicator: FC<EventIndicatorProps> = ({ event }) => {
  // Format date for display
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-green-500">
        <CalendarIcon className="h-4 w-4 text-white" />
      </div>
      <div className="line-clamp-1 max-w-full text-xs font-bold">
        {event.title}
      </div>
      <div className="text-[10px]">{formatDate(event.startDate)}</div>
    </div>
  );
};

// Simple Calendar Icon
const CalendarIcon: FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

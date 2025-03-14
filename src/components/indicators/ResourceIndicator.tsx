"use client";

import { FC } from "react";

interface ResourceIndicatorProps {
  resource: {
    title: string;
    url: string;
  };
}

export const ResourceIndicator: FC<ResourceIndicatorProps> = ({ resource }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
        <LinkIcon className="h-4 w-4 text-white" />
      </div>
      <div className="line-clamp-1 max-w-full text-xs font-bold">
        {resource.title}
      </div>
    </div>
  );
};

// Simple Link Icon
const LinkIcon: FC<{ className?: string }> = ({ className }) => (
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
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

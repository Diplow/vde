"use client";

import { FC } from "react";

interface ContentIndicatorProps {
  content: {
    title: string;
    viewCount: number;
    youtubeVideoId: string;
  };
}

export const ContentIndicator: FC<ContentIndicatorProps> = ({ content }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-red-600">
        <YouTubeIcon className="h-4 w-4 text-white" />
      </div>
      <div className="line-clamp-1 max-w-full text-xs font-bold">
        {content.title}
      </div>
      <div className="flex items-center text-[10px]">
        <EyeIcon className="mr-1 h-3 w-3" /> {content.viewCount}
      </div>
    </div>
  );
};

// Simple YouTube Icon
const YouTubeIcon: FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.9 3.6 12 3.6 12 3.6s-7.9 0-9.5.5c-1 .3-1.7 1.1-2 2.1C0 7.9 0 12 0 12s0 4.1.5 5.8c.3 1 1 1.8 2 2.1 1.6.5 9.5.5 9.5.5s7.9 0 9.5-.5c1-.3 1.7-1.1 2-2.1.5-1.7.5-5.8.5-5.8s0-4.1-.5-5.8zM9.6 15.6V8.4l6.4 3.6-6.4 3.6z" />
  </svg>
);

// Simple Eye Icon for view count
const EyeIcon: FC<{ className?: string }> = ({ className }) => (
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
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

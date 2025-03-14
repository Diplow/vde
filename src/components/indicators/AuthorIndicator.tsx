"use client";

import { FC } from "react";

interface AuthorIndicatorProps {
  author: {
    name: string;
    imageUrl?: string;
  };
}

export const AuthorIndicator: FC<AuthorIndicatorProps> = ({ author }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative mb-1 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-purple-500">
        {author.imageUrl ? (
          <img
            src={author.imageUrl}
            alt={author.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <UserIcon className="h-4 w-4 text-white" />
        )}
      </div>
      <div className="line-clamp-1 max-w-full text-xs font-bold">
        {author.name}
      </div>
    </div>
  );
};

// Simple User Icon
const UserIcon: FC<{ className?: string }> = ({ className }) => (
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
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

"use client";

import React, {
  useState,
  KeyboardEvent as ReactKeyboardEvent,
  useEffect,
} from "react";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/solid";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LoadingSpinner } from "./ActionPanel";

export function ScaleController({ scale }: { scale: number }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState(scale.toString());
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Reset loading state and input value when scale changes
  useEffect(() => {
    setIsLoading(false);
    setInputValue(scale.toString());
  }, [scale]);

  // Create URL with updated scale
  const createHexSizeUrl = (newScale: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("scale", newScale.toString());
    return `${pathname}?${params.toString()}`;
  };

  // Navigate with loading state
  const navigateWithLoading = (url: string) => {
    setIsLoading(true);
    router.push(url, { scroll: false });
  };

  // Increase size URL
  const increaseUrl = createHexSizeUrl(Math.min(10, scale + 1));

  // Decrease size URL
  const decreaseUrl = createHexSizeUrl(Math.max(0, scale - 1));

  // Handle editing completion and value validation
  const handleEditComplete = () => {
    const newValue = parseInt(inputValue, 10);

    if (isNaN(newValue) || newValue < 2 || newValue > 500) {
      // Reset to original value if invalid
      setInputValue(scale.toString());
    } else if (newValue !== scale) {
      // Navigate to the new URL with updated scale
      navigateWithLoading(createHexSizeUrl(newValue));
    }

    setIsEditing(false);
  };

  // Handle key press events when editing
  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleEditComplete();
    } else if (e.key === "Escape") {
      setInputValue(scale.toString());
      setIsEditing(false);
    }
  };

  // Handle increase with loading
  const handleIncrease = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    router.push(increaseUrl, { scroll: false });
  };

  // Handle decrease with loading
  const handleDecrease = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    router.push(decreaseUrl, { scroll: false });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-center rounded bg-white p-2 shadow-md">
      <Link
        href={increaseUrl}
        className="flex h-8 w-8 items-center justify-center rounded-t bg-gray-100 hover:bg-gray-200"
        title="Increase hex size (Ctrl + +)"
        aria-label="Increase hex size"
        scroll={false}
        onClick={handleIncrease}
      >
        <PlusIcon className="h-5 w-5" />
      </Link>

      {isEditing ? (
        <div className="flex flex-col items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleEditComplete}
            onKeyDown={handleKeyDown}
            className="my-1 h-6 w-8 p-0 text-center text-sm font-semibold"
            autoFocus
          />
        </div>
      ) : isLoading ? (
        <div className="my-1 flex h-6 w-8 items-center justify-center">
          <LoadingSpinner className="h-4 w-4" />
        </div>
      ) : (
        <div
          className="my-1 flex h-6 w-8 cursor-pointer items-center justify-center rounded text-sm font-semibold hover:bg-gray-100"
          onClick={() => setIsEditing(true)}
          title="Click to edit hex size directly"
        >
          {scale}
        </div>
      )}

      <Link
        href={decreaseUrl}
        className="flex h-8 w-8 items-center justify-center rounded-b bg-gray-100 hover:bg-gray-200"
        title="Decrease hex size (Ctrl + -)"
        aria-label="Decrease hex size"
        scroll={false}
        onClick={handleDecrease}
      >
        <MinusIcon className="h-5 w-5" />
      </Link>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useMapCache } from "../Cache/map-cache";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
import {
  validateCreateItemInput,
  type CreateItemFormData,
  type CreateItemFormErrors,
} from "../create/validation.utils";
import type { URLInfo } from "../types/url-info";

interface DynamicCreateItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  coordId: string;
  parentItem?: { id: string; name: string };
  urlInfo: URLInfo;
  onSuccess?: () => void;
}

export function DynamicCreateItemDialog({
  isOpen,
  onClose,
  coordId,
  parentItem,
  onSuccess,
}: DynamicCreateItemDialogProps) {
  const [formData, setFormData] = useState<CreateItemFormData>({
    title: "",
    description: "",
    url: "",
  });
  const [errors, setErrors] = useState<CreateItemFormErrors>({});

  const { mutations, state } = useMapCache();

  // Use loading state from mutations if available, otherwise local state
  const isSubmitting = mutations.lifeCycle.itemIsCreating;
  const mutationError = mutations.lifeCycle.itemCreationError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const validation = validateCreateItemInput(formData);
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});

    try {
      const coords = CoordSystem.parseId(coordId);

      // Determine the correct parent ID based on coordinates
      let actualParentId: number;

      if (parentItem?.id) {
        // Use explicitly provided parent ID
        actualParentId = parseInt(parentItem.id);
      } else {
        // Find parent by coordinates using the cache
        const parentCoords = CoordSystem.getParentCoord(coords);
        if (!parentCoords) {
          throw new Error(
            "Cannot determine parent coordinates for this position",
          );
        }

        const parentCoordId = CoordSystem.createId(parentCoords);
        const parentFromCache = state.itemsById[parentCoordId];

        if (!parentFromCache) {
          throw new Error(
            `Parent item not found at coordinates ${parentCoordId}`,
          );
        }

        actualParentId = parseInt(parentFromCache.metadata.dbId);
      }

      // Use mutations from map cache with optimistic updates
      mutations.actions.createItem({
        coords,
        parentId: actualParentId,
        title: validation.data.title,
        descr: validation.data.description,
        url: validation.data.url,
      });

      // Reset form on success
      setFormData({ title: "", description: "", url: "" });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to create item:", error);
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "Failed to create item. Please try again.",
      });
    }
  };

  const handleFormDataChange = (
    field: keyof CreateItemFormData,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Use mutation error if available, otherwise local error
  const displayError = mutationError ?? errors.general;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Item</DialogTitle>
          {parentItem && (
            <p className="text-sm text-gray-600">
              Creating child of:{" "}
              <span className="font-medium">{parentItem.name}</span>
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {displayError && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-600">{displayError}</p>
            </div>
          )}

          {/* Title Field */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleFormDataChange("title", e.target.value)}
              disabled={isSubmitting}
              maxLength={200}
              className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter item title"
              required
              autoFocus
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.title.length}/200 characters
            </p>
          </div>

          {/* Description Field */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                handleFormDataChange("description", e.target.value)
              }
              disabled={isSubmitting}
              rows={3}
              maxLength={2000}
              className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter item description (optional)"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/2000 characters
            </p>
          </div>

          {/* URL Field */}
          <div>
            <label
              htmlFor="url"
              className="block text-sm font-medium text-gray-700"
            >
              URL
            </label>
            <input
              type="url"
              id="url"
              value={formData.url}
              onChange={(e) => handleFormDataChange("url", e.target.value)}
              disabled={isSubmitting}
              className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                errors.url ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="https://example.com (optional)"
            />
            {errors.url && (
              <p className="mt-1 text-sm text-red-600">{errors.url}</p>
            )}
          </div>

          {/* Progress indicator for optimistic updates */}
          {isSubmitting && (
            <div className="rounded-md bg-blue-50 p-3">
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin text-blue-600"
                  viewBox="0 0 24 24"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray="32"
                    strokeDashoffset="32"
                  >
                    <animate
                      attributeName="stroke-dasharray"
                      dur="2s"
                      values="0 32;32 32;32 32"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="stroke-dashoffset"
                      dur="2s"
                      values="0;-32;-64"
                      repeatCount="indefinite"
                    />
                  </circle>
                </svg>
                <p className="text-sm text-blue-700">
                  Creating item... (you can see it on the map already!)
                </p>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray="32"
                      strokeDashoffset="32"
                    >
                      <animate
                        attributeName="stroke-dasharray"
                        dur="2s"
                        values="0 32;32 32;32 32"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="stroke-dashoffset"
                        dur="2s"
                        values="0;-32;-64"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </svg>
                  Saving...
                </span>
              ) : (
                "Create Item"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

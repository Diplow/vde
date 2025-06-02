import { redirect } from "next/navigation";
import { api } from "~/commons/trpc/server";
import {
  CoordSystem,
  type HexCoord,
} from "~/lib/domains/mapping/utils/hex-coordinates";
import {
  validateCreateItemInput,
  type CreateItemFormErrors,
} from "./validation.utils";

interface CreateItemFormFieldsProps {
  targetCoords: HexCoord;
  parentId?: string;
  returnUrl: string;
  rootItemId: string;
  errors?: CreateItemFormErrors;
}

// Helper function to safely extract string from FormData
function getFormDataString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return value ? String(value) : "";
}

// Server action for form submission
async function createItemAction(formData: FormData) {
  "use server";

  const rawData = {
    title: getFormDataString(formData, "title"),
    description: getFormDataString(formData, "description"),
    url: getFormDataString(formData, "url"),
    coordId: getFormDataString(formData, "coordId"),
    parentId: getFormDataString(formData, "parentId"),
    returnUrl: getFormDataString(formData, "returnUrl"),
  };

  // Validate input
  const validation = validateCreateItemInput(rawData);
  if (!validation.success) {
    // In a real implementation, you'd handle errors properly
    // For now, we'll redirect back with error params
    const errorParams = new URLSearchParams();
    Object.entries(validation.errors).forEach(([key, value]) => {
      if (value) {
        errorParams.set(`error_${key}`, value);
      }
    });
    return redirect(`${rawData.returnUrl}?${errorParams.toString()}`);
  }

  try {
    const coords = CoordSystem.parseId(rawData.coordId);

    // Determine the parent ID based on coordinates
    let actualParentId: number;

    if (rawData.parentId) {
      // Use explicitly provided parent ID
      actualParentId = parseInt(rawData.parentId);
    } else {
      // Find parent by coordinates
      const parentCoords = CoordSystem.getParentCoord(coords);
      if (!parentCoords) {
        throw new Error(
          "Cannot determine parent coordinates for this position",
        );
      }

      // Get parent item by coordinates to get its database ID
      const parentItem = await api.map.getItemByCoords({
        coords: parentCoords,
      });

      if (!parentItem) {
        throw new Error(
          `Parent item not found at coordinates ${CoordSystem.createId(parentCoords)}`,
        );
      }

      actualParentId = parseInt(parentItem.id);
    }

    // Create the item via tRPC
    await api.map.addItem({
      coords,
      parentId: actualParentId,
      title: validation.data.title,
      descr: validation.data.description,
      url: validation.data.url,
    });

    // Redirect back to map
    redirect(rawData.returnUrl);
  } catch (error) {
    console.error("Failed to create item:", error);
    redirect(`${rawData.returnUrl}?error=creation_failed`);
  }
}

export function CreateItemFormFields({
  targetCoords,
  parentId,
  returnUrl,
  rootItemId,
  errors,
}: CreateItemFormFieldsProps) {
  const coordId = CoordSystem.createId(targetCoords);

  return (
    <form action={createItemAction} className="space-y-6">
      {/* Hidden fields */}
      <input type="hidden" name="coordId" value={coordId} />
      <input type="hidden" name="parentId" value={parentId ?? ""} />
      <input type="hidden" name="returnUrl" value={returnUrl} />

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
          name="title"
          required
          maxLength={200}
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
            errors?.title ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Enter item title"
        />
        {errors?.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
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
          name="description"
          rows={4}
          maxLength={2000}
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
            errors?.description ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Enter item description (optional)"
        />
        {errors?.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
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
          name="url"
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
            errors?.url ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="https://example.com (optional)"
        />
        {errors?.url && (
          <p className="mt-1 text-sm text-red-600">{errors.url}</p>
        )}
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Create Item
        </button>
        <a
          href={returnUrl}
          className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-center text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}

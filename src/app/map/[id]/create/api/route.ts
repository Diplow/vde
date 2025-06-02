import { type NextRequest, NextResponse } from "next/server";
import { api } from "~/commons/trpc/server";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
import { validateCreateItemInput } from "../validation.utils";

// Helper function to safely extract string from FormData
function getFormDataString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return value ? String(value) : "";
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const rawData = {
      title: getFormDataString(formData, "title"),
      description: getFormDataString(formData, "description"),
      url: getFormDataString(formData, "url"),
      coordId: getFormDataString(formData, "coordId"),
      parentId: getFormDataString(formData, "parentId"),
    };

    // Validate input
    const validation = validateCreateItemInput(rawData);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.errors },
        { status: 400 },
      );
    }

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
        return NextResponse.json(
          {
            success: false,
            error: "Cannot determine parent coordinates for this position",
          },
          { status: 400 },
        );
      }

      // Get parent item by coordinates to get its database ID
      const parentItem = await api.map.getItemByCoords({
        coords: parentCoords,
      });

      if (!parentItem) {
        return NextResponse.json(
          {
            success: false,
            error: `Parent item not found at coordinates ${CoordSystem.createId(parentCoords)}`,
          },
          { status: 400 },
        );
      }

      actualParentId = parseInt(parentItem.id);
    }

    // Create the item via tRPC
    const result = await api.map.addItem({
      coords,
      parentId: actualParentId,
      title: validation.data.title,
      descr: validation.data.description,
      url: validation.data.url,
    });

    return NextResponse.json({
      success: true,
      item: result,
    });
  } catch (error) {
    console.error("Failed to create item via API:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create item" },
      { status: 500 },
    );
  }
}

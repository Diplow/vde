import { notFound } from "next/navigation";
import { api } from "~/commons/trpc/server";
import { StaticCreateItemForm } from "./create-item.static";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";

interface CreateItemPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    coordId?: string;
    parentId?: string;
    returnTo?: string;
  }>;
}

export default async function CreateItemPage({
  params,
  searchParams,
}: CreateItemPageProps) {
  const { id: rootItemId } = await params;
  const { coordId, parentId, returnTo } = await searchParams;

  // Validate parent item if provided
  let parentItem = null;
  if (parentId) {
    try {
      parentItem = await api.map.getRootItemById({
        mapItemId: parseInt(parentId),
      });
    } catch {
      return notFound();
    }
  }

  // Determine target coordinates
  const targetCoords = coordId ? CoordSystem.parseId(coordId) : null;

  if (!targetCoords) {
    return notFound();
  }

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <StaticCreateItemForm
        targetCoords={targetCoords}
        parentItem={parentItem}
        returnUrl={returnTo ?? `/map/${rootItemId}`}
        rootItemId={rootItemId}
      />
    </div>
  );
}

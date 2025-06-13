import { type NextRequest, NextResponse } from "next/server";
import { testLogger } from "~/lib/test-logger";

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

export default function middleware(request: NextRequest) {
  // Log navigation actions from static map buttons
  if (request.nextUrl.pathname.startsWith("/static/map")) {
    const action = request.nextUrl.searchParams.get("_action");
    
    // Handle expand/collapse/navigate actions
    if (action && ["expand", "collapse", "navigate"].includes(action)) {
      const itemId = request.nextUrl.searchParams.get("_itemId");
      const itemName = request.nextUrl.searchParams.get("_itemName");

      if (itemId) {
        const tileId = itemId; // In a real scenario, you might want to parse this to get the full tile ID
        testLogger.interaction(`static-${action}-click`, tileId, {
          itemName: itemName ?? "Unknown",
          action,
          url: request.nextUrl.pathname + request.nextUrl.search,
          referrer: request.headers.get("referer") ?? "direct",
        });

        // Clean up the URL by removing the action metadata
        const cleanUrl = new URL(request.url);
        cleanUrl.searchParams.delete("_action");
        cleanUrl.searchParams.delete("_itemId");
        cleanUrl.searchParams.delete("_itemName");

        // Redirect to the clean URL
        return NextResponse.redirect(cleanUrl);
      }
    }
    
    // Handle create action
    if (action === "create") {
      const coordId = request.nextUrl.searchParams.get("_coordId");
      const parentName = request.nextUrl.searchParams.get("_parentName");

      if (coordId) {
        testLogger.interaction("static-create-click", coordId, {
          parentName: parentName ?? "root",
          coordId,
          url: request.nextUrl.pathname + request.nextUrl.search,
          referrer: request.headers.get("referer") ?? "direct",
        });

        // Clean up the URL by removing the action metadata
        const cleanUrl = new URL(request.url);
        cleanUrl.searchParams.delete("_action");
        cleanUrl.searchParams.delete("_coordId");
        cleanUrl.searchParams.delete("_parentName");

        // Redirect to the clean URL
        return NextResponse.redirect(cleanUrl);
      }
    }
  }

  return NextResponse.next();
}

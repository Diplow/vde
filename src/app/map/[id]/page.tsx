import StaticHexMapPage from "./page.static";
import { ProgressiveEnhancer } from "./progressive-enhancer";

interface HexMapPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    scale?: string;
    expandedItems?: string;
    isDynamic?: string;
    focus?: string;
  }>;
}

export default async function HexMapPage({
  params,
  searchParams,
}: HexMapPageProps) {
  const resolvedSearchParams = await searchParams;

  // Server-side progressive enhancement decision
  const mode =
    resolvedSearchParams.isDynamic === "true"
      ? "dynamic"
      : resolvedSearchParams.isDynamic === "false"
        ? "static"
        : "auto";

  // Always render static first for SSR benefits
  const staticPage = (
    <StaticHexMapPage params={params} searchParams={searchParams} />
  );

  // For static mode, only return static
  if (mode === "static") {
    return staticPage;
  }

  // For dynamic mode or auto mode, wrap with progressive enhancer
  return (
    <ProgressiveEnhancer
      mode={mode}
      params={params}
      searchParams={searchParams}
      staticFallback={staticPage}
    />
  );
}

import type { TileScale } from "~/app/static/map/Tile/Base/base";

export interface StaticTileContentProps {
  data: {
    title?: string;
    description?: string;
    url?: string;
  };
  scale: TileScale;
  tileId?: string; // For unique test IDs
}

const TEXT_CLASSES = "max-w-[90%] break-words text-zinc-950";

export const StaticTileContent = ({ data, scale, tileId }: StaticTileContentProps) => {
  if (!data) return null;

  const marginClass =
    scale === 1 ? "my-[6px]" : scale === 2 ? "my-[18px]" : "my-[54px]";
  return (
    <div
      className={`${marginClass} flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden text-center`}
    >
      {data.title && TitleSection(data.title, scale, tileId)}
      {data.description && DescriptionSection(data.description, scale)}
      {data.url && UrlSection(data.url, scale)}
    </div>
  );
};

const TitleSection = (title: string, scale: TileScale, tileId?: string) => {
  if (scale < 1) return null;
  const baseFontSize =
    scale === 1 ? "text-xs" : scale === 2 ? "text-md" : "text-lg";

  const fontWeight =
    scale === 1 ? "font-[8px]" : scale === 2 ? "font-medium" : "font-semibold";

  const maxLength = scale === 1 ? 25 : scale === 2 ? 90 : 300;
  const truncatedTitle =
    title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;

  const testId = tileId ? `tile-title-${tileId}` : "tile-title";
  
  return (
    <div className={`${baseFontSize} ${fontWeight} ${TEXT_CLASSES} mx-[15%]`} data-testid={testId}>
      {truncatedTitle}
    </div>
  );
};

const DescriptionSection = (description: string, scale: TileScale) => {
  if (scale < 2) return null;
  
  // Different truncation lengths for different scales
  const maxLength = scale === 2 ? 200 : 1500;
  const truncatedDescription =
    description.length > maxLength
      ? `${description.substring(0, maxLength)}...`
      : description;
  
  const textSize = scale === 2 ? "text-xs" : "text-sm";

  return (
    <div className={`mt-1 ${textSize} ${TEXT_CLASSES}`}>{truncatedDescription}</div>
  );
};

const UrlSection = (url: string, scale: TileScale) => {
  if (scale < 2) return null;
  const maxLength = scale === 2 ? 25 : 50;
  const displayUrl =
    url.length > maxLength ? `${url.substring(0, maxLength)}...` : url;

  return (
    <div className={`${TEXT_CLASSES} truncate text-xs`}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-cyan-800 hover:text-cyan-950 hover:underline"
      >
        {displayUrl}
      </a>
    </div>
  );
};

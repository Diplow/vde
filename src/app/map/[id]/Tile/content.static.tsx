import type { TileScale } from "./base.static";

interface StaticTileContentProps {
  data: {
    title?: string;
    description?: string;
    url?: string;
  };
  scale: TileScale;
}

const TEXT_CLASSES = "max-w-[90%] break-words text-zinc-950";

export const StaticTileContent = ({ data, scale }: StaticTileContentProps) => {
  if (!data) return null;

  const marginClass =
    scale === 1 ? "my-[6px]" : scale === 2 ? "my-[18px]" : "my-[54px]";
  return (
    <div
      className={`${marginClass} flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden text-center`}
    >
      {data.title && TitleSection(data.title, scale)}
      {data.description && DescriptionSection(data.description, scale)}
      {data.url && UrlSection(data.url, scale)}
    </div>
  );
};

const TitleSection = (title: string, scale: TileScale) => {
  if (scale < 1) return null;
  const baseFontSize =
    scale === 1 ? "text-xs" : scale === 2 ? "text-md" : "text-lg";

  const fontWeight =
    scale === 1 ? "font-[8px]" : scale === 2 ? "font-medium" : "font-semibold";

  const maxLength = scale === 1 ? 25 : scale === 2 ? 90 : 300;
  const truncatedTitle =
    title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;

  return (
    <div className={`${baseFontSize} ${fontWeight} ${TEXT_CLASSES} mx-[15%]`}>
      {truncatedTitle}
    </div>
  );
};

const DescriptionSection = (description: string, scale: TileScale) => {
  if (scale < 3) return null;
  const truncatedDescription =
    description.length > 1500
      ? `${description.substring(0, 1500)}...`
      : description;

  return (
    <div className={`mt-1 text-sm ${TEXT_CLASSES}`}>{truncatedDescription}</div>
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

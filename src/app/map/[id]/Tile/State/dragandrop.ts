import { useState } from "react";
import { HexCoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
import { MapCanvasState } from "../../Canvas/State";
import { HexTileData } from "../../Canvas/State/types";

export function useDragAndDrop({
  coords,
  item,
  state,
  isCenter,
  baseHexWidth,
  baseHexHeight,
  scale,
  effectiveSize,
  scaleSVGs,
}: {
  coords: string;
  item?: HexTileData;
  state: MapCanvasState;
  isCenter: boolean;
  baseHexWidth: number;
  baseHexHeight: number;
  scale: number;
  effectiveSize: number;
  scaleSVGs: Record<number, { path: string; viewBox: string }>;
}) {
  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Determine if tile is draggable (not center and has item)
  const isDraggable = !!item && !isCenter;

  // Add cursor style for draggable tiles
  const cursorStyle = isDraggable
    ? "cursor-grab active:cursor-grabbing"
    : "cursor-pointer";

  const handleDragStart = (e: React.DragEvent) => {
    // Don't allow dragging in focus mode, empty tiles, or the center tile
    if (!item || isCenter) {
      e.preventDefault();
      return;
    }

    e.dataTransfer.setData("application/hex-tile", coords);
    setIsDragging(true);

    // Create a custom drag image that mimics the hex tile
    const dragImg = document.createElement("div");

    // Apply a 4x scaling factor to scale 1 tiles to match scale 2 tiles
    const scalingMultiplier = scale === 1 ? 4 : 1;
    const adjustedBaseHexWidth = baseHexWidth * scalingMultiplier;
    const adjustedBaseHexHeight = baseHexHeight * scalingMultiplier;

    // Calculate the size of the drag image - match original tile dimensions
    // Using the same scale factors as in the Tile component
    const scaleFactors = {
      width: scale === 2 ? 4 : 3,
      height: scale === 2 ? 4 : 2.5,
    };

    const width =
      adjustedBaseHexWidth * Math.pow(scaleFactors.width, scale - 1);
    const height =
      adjustedBaseHexHeight * Math.pow(scaleFactors.height, scale - 1);

    // Create an SVG element to draw the hex shape
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", `${width}px`);
    svg.setAttribute("height", `${height}px`);
    svg.setAttribute(
      "viewBox",
      (scaleSVGs[scale as keyof typeof scaleSVGs] as { viewBox: string })
        .viewBox,
    );

    // Create the path for the hex shape
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute(
      "d",
      (scaleSVGs[scale as keyof typeof scaleSVGs] as { path: string }).path,
    );
    path.setAttribute("fill", "#d4d4d8"); // zinc-300 color
    path.setAttribute("stroke", "#27272a"); // zinc-800 color
    path.setAttribute("stroke-width", "1");

    svg.appendChild(path);

    // Add the SVG to the drag image
    dragImg.appendChild(svg);

    // Add a title overlay
    const titleOverlay = document.createElement("div");
    titleOverlay.textContent = item.data.name || "Tile";
    titleOverlay.style.position = "absolute";
    titleOverlay.style.top = "50%";
    titleOverlay.style.left = "50%";
    titleOverlay.style.transform = "translate(-50%, -50%)";
    titleOverlay.style.color = "#27272a"; // Dark text
    titleOverlay.style.fontWeight = "bold";
    titleOverlay.style.fontSize = effectiveSize < 80 ? "10px" : "14px";
    titleOverlay.style.textAlign = "center";
    titleOverlay.style.maxWidth = "80%";
    titleOverlay.style.overflow = "hidden";
    titleOverlay.style.textOverflow = "ellipsis";
    titleOverlay.style.whiteSpace = "nowrap";
    titleOverlay.style.pointerEvents = "none";

    // Set up the container
    dragImg.style.position = "absolute";
    dragImg.style.width = `${width}px`;
    dragImg.style.height = `${height}px`;
    dragImg.style.opacity = "0.8";
    dragImg.style.zIndex = "9999";
    dragImg.style.pointerEvents = "none";
    dragImg.style.overflow = "hidden";
    dragImg.style.top = "-1000px"; // Position off-screen initially
    dragImg.style.left = "-1000px";
    dragImg.appendChild(titleOverlay);

    // Add to document
    document.body.appendChild(dragImg);

    // Use the custom element as drag image
    // Adjust the offset to center the drag image under the cursor
    e.dataTransfer.setDragImage(dragImg, width / 2, height / 2);

    // Remove the drag image element after drag starts
    setTimeout(() => {
      document.body.removeChild(dragImg);
    }, 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    // Don't allow dropping on the center tile
    if (isCenter) {
      return;
    }

    e.preventDefault(); // Necessary to allow drop
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    // Don't allow dropping on the center tile
    if (isCenter) {
      return;
    }

    e.preventDefault();
    setIsDragOver(false);

    const sourceCoord = e.dataTransfer.getData("application/hex-tile");
    if (!sourceCoord || sourceCoord === coords) return; // Can't drop on self

    // Check if the source is the center tile (extra protection)
    const isSourceCenter =
      HexCoordSystem.getParentCoordFromId(sourceCoord) === undefined;
    if (isSourceCenter) {
      return;
    }

    state.actions.mutations.moveItem({
      sourceCoord,
      targetCoord: coords,
    });
  };

  return {
    isDragging,
    isDragOver,
    isDraggable,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    cursorStyle,
  };
}

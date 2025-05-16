import { MapCanvasState } from "./index";

export const scaleSVG = {
  path: "M50 0 L100 28.87 L100 86.6 L50 115.47 L0 86.6 L0 28.87Z",
  viewBox: "0 0 100 115.47",
} as const;

export interface DragAndDropConfig {
  baseHexWidth: number;
  baseHexHeight: number;
}

export function initDragAndDropActions(
  state: MapCanvasState,
  config: DragAndDropConfig,
) {
  const startDrag = (coords: string) => {
    if (state.data.mapItems[coords]) {
      // Update the item state to show it's being dragged
      state.data.mapItems[coords].state.isDragged = true;
    }
  };

  const endDrag = (coords: string) => {
    if (state.data.mapItems[coords]) {
      state.data.mapItems[coords].state.isDragged = false;
    }
  };

  const setDragOver = (coords: string, isDragOver: boolean) => {
    if (state.data.mapItems[coords]) {
      state.data.mapItems[coords].state.isDragOver = isDragOver;
    } else {
      // For empty tiles, we might need to handle this differently
      // Maybe create a separate state for empty tiles
    }
  };

  const setHovering = (coords: string, isHovering: boolean) => {
    if (state.data.mapItems[coords]) {
      state.data.mapItems[coords].state.isHovering = isHovering;
    }
  };

  const moveItem = (sourceCoord: string, targetCoord: string) => {
    state.actions.mutations.moveItem({
      sourceCoord,
      targetCoord,
    });

    // Reset the drag state for both source and target items
    // This ensures that any lingering drag states are cleared
    if (state.data.mapItems[sourceCoord]) {
      state.data.mapItems[sourceCoord].state.isDragged = false;
      state.data.mapItems[sourceCoord].state.isDragOver = false;
    }

    if (state.data.mapItems[targetCoord]) {
      state.data.mapItems[targetCoord].state.isDragged = false;
      state.data.mapItems[targetCoord].state.isDragOver = false;
    }
  };

  return {
    startDrag,
    endDrag,
    setDragOver,
    setHovering,
    moveItem,
    createDragImage: (coords: string, scale: number, effectiveSize: number) => {
      const item = state.data.mapItems[coords];
      if (!item) return null;

      // Create a custom drag image that mimics the hex tile
      const dragImg = document.createElement("div");

      // Calculate the size of the drag image - match original tile dimensions
      // Using the same scale factors as in the Tile component
      const scaleFactors = {
        width: scale === 2 ? 4 : 3,
        height: scale === 2 ? 4 : 2.5,
      };

      const width = config.baseHexWidth;
      const height = config.baseHexHeight;

      // Create an SVG element to draw the hex shape
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("width", `${width}px`);
      svg.setAttribute("height", `${height}px`);
      svg.setAttribute("viewBox", scaleSVG.viewBox);

      // Create the path for the hex shape
      const path = document.createElementNS(svgNS, "path");
      path.setAttribute("d", scaleSVG.path);
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

      return {
        element: dragImg,
        width,
        height,
        cleanup: () => {
          document.body.removeChild(dragImg);
        },
      };
    },
  };
}

"use client";

import React, { useState, useEffect } from "react";
import { cn } from "~/lib/utils";
import {
  PanelLeftOpen,
  PanelBottomClose,
  PanelRightOpen,
  MousePointer,
  Maximize2,
  Edit,
  Trash2,
  Lock,
  Telescope,
} from "lucide-react";
import type { ActionMode } from "../State/interactionMode";

// Define the cycle states
type PanelCycleState = "collapsed" | "shortcuts" | "full";

// Shared loading spinner component
export function LoadingSpinner({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${className}`}
    ></div>
  );
}

interface ActionItem {
  mode: ActionMode;
  label: string;
  shortcut: string;
  icon: React.ReactNode;
  description: string;
  cursor: string;
}

interface ActionPanelProps {
  className?: string;
  activeMode: ActionMode;
  onModeChange: (mode: ActionMode) => void;
}

// localStorage key
const PANEL_STATE_KEY = "mapPanel.state";

export function ActionPanel({
  className,
  activeMode,
  onModeChange,
}: ActionPanelProps) {
  // Set up local state for panel display mode
  const [panelState, setPanelState] = useState<PanelCycleState>("collapsed");

  // Initialize state from localStorage on first render
  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      // Load panel state from localStorage or use default
      const storedPanelState = localStorage.getItem(
        PANEL_STATE_KEY,
      ) as PanelCycleState;
      if (storedPanelState) {
        setPanelState(storedPanelState);
      }
    }
  }, []);

  // Update localStorage when panel state changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(PANEL_STATE_KEY, panelState);
    }
  }, [panelState]);

  // Get next panel state in cycle
  const getNextPanelState = React.useCallback((): PanelCycleState => {
    switch (panelState) {
      case "collapsed":
        return "shortcuts";
      case "shortcuts":
        return "full";
      case "full":
        return "collapsed";
      default:
        return "collapsed";
    }
  }, [panelState]);

  const actions: ActionItem[] = React.useMemo(
    () => [
      {
        mode: "select",
        label: "Select",
        shortcut: "S",
        icon: <MousePointer className="h-5 w-5" />,
        description: "Select a tile by clicking on it",
        cursor: "pointer",
      },
      {
        mode: "expand",
        label: "Expand/Collapse",
        shortcut: "E",
        icon: <Telescope className="h-5 w-5" />,
        description: "Expand or collapse a tile by clicking on it (Ctrl+Click)",
        cursor: "cell",
      },
      {
        mode: "deepExpand",
        label: "Deep Expand",
        shortcut: "D",
        icon: <Maximize2 className="h-5 w-5" />,
        description: "Deep expand a tile by clicking on it",
        cursor: "zoom-in",
      },
      {
        mode: "edit",
        label: "Create/Update",
        shortcut: "C",
        icon: <Edit className="h-5 w-5" />,
        description: "Edit a tile or create a new one",
        cursor: "text",
      },
      {
        mode: "delete",
        label: "Delete",
        shortcut: "X",
        icon: <Trash2 className="h-5 w-5" />,
        description: "Delete a tile by clicking on it",
        cursor: "not-allowed",
      },
      {
        mode: "lock",
        label: "Lock",
        shortcut: "L",
        icon: <Lock className="h-5 w-5" />,
        description: "Lock the map to prevent editing",
        cursor: "default",
      },
    ],
    [],
  );

  // Handle mode change
  const handleModeChange = (mode: ActionMode) => {
    // If the same mode is clicked, switch back to select mode
    const newMode = mode === activeMode ? "select" : mode;
    onModeChange(newMode);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if an input field or textarea is focused
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      const key = e.key.toUpperCase();
      const action = actions.find((a) => a.shortcut && a.shortcut === key);

      if (action) {
        // Use the mode change logic directly here to match handleModeChange
        const newMode = action.mode === activeMode ? "select" : action.mode;
        onModeChange(newMode);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actions, activeMode, onModeChange]);

  // Handle keyboard shortcut for toggling display mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        e.key.toUpperCase() === "M"
      ) {
        // Check if an input or textarea is focused
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault(); // Prevent typing 'm' if not in an input
          setPanelState(getNextPanelState());
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [panelState, getNextPanelState]);

  // Determine the icon and tooltip for the toggle button based on the panel state
  const getToggleState = () => {
    switch (panelState) {
      case "collapsed":
        return {
          icon: <PanelBottomClose className="h-5 w-5" />,
          title: "Show shortcuts (M)",
        };
      case "shortcuts":
        return {
          icon: <PanelLeftOpen className="h-5 w-5" />,
          title: "Show full panel (M)",
        };
      case "full":
        return {
          icon: <PanelRightOpen className="h-5 w-5" />,
          title: "Collapse panel (M)",
        };
      default:
        return {
          icon: <PanelBottomClose className="h-5 w-5" />,
          title: "Show shortcuts (M)",
        };
    }
  };

  const { icon: toggleIcon, title: toggleTitle } = getToggleState();

  // Set document cursor based on active mode
  useEffect(() => {
    const activeAction = actions.find((a) => a.mode === activeMode);
    if (activeAction) {
      document.body.style.cursor = activeAction.cursor;
    }

    return () => {
      document.body.style.cursor = "auto";
    };
  }, [activeMode, actions]);

  // Handle panel toggle
  const handlePanelToggle = () => {
    setPanelState(getNextPanelState());
  };

  return (
    <div
      className={cn(
        "fixed left-4 top-4 z-50 flex flex-col rounded bg-white shadow-md transition-all duration-300 dark:bg-gray-800",
        // Adjust width for collapsed state to fit both icons
        panelState === "collapsed" && "w-20",
        panelState === "shortcuts" && "w-12", // Keep shortcuts width as before
        className,
      )}
    >
      <div className="p-2">
        <div className="mb-1 flex items-center space-x-1">
          {/* Toggle Button */}
          <button
            onClick={handlePanelToggle}
            className={cn(
              "flex h-8 items-center rounded bg-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700",
              // Apply specific styles based on panelState
              panelState === "full"
                ? "w-full justify-start px-2"
                : "w-8 justify-center",
            )}
            title={toggleTitle}
          >
            <div className="flex-shrink-0">{toggleIcon}</div>
            {/* Show label and shortcut only in full mode */}
            {panelState === "full" && (
              <>
                <span className="mx-2 text-sm">Toggle menu style</span>
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                  M
                </span>
              </>
            )}
          </button>

          {/* Show active mode icon when collapsed */}
          {panelState === "collapsed" && (
            <div
              className="flex h-8 w-8 items-center justify-center rounded bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300"
              title={`Active mode: ${activeMode}`}
            >
              {actions.find((a) => a.mode === activeMode)?.icon}
            </div>
          )}
        </div>

        {/* Conditionally render action buttons based on panelState */}
        {panelState !== "collapsed" && (
          <div className="flex flex-col space-y-1">
            {actions.map((action) => (
              <button
                key={action.mode}
                onClick={() => handleModeChange(action.mode)}
                className={cn(
                  "flex h-8 items-center rounded",
                  // Styling based on active state
                  activeMode === action.mode
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300" // Active state
                    : "bg-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700", // Normal state
                  // Full width in full mode, square icon in shortcuts mode
                  panelState === "full"
                    ? "w-full justify-start px-2"
                    : "w-8 justify-center",
                )}
                title={
                  panelState === "full"
                    ? action.description
                    : `${action.label} (${action.shortcut}): ${action.description}`
                }
              >
                <div className="flex-shrink-0">{action.icon}</div>
                {/* Show appropriate content based on mode and panel state */}
                {panelState === "full" && (
                  <>
                    <span className="mx-2 text-sm">{action.label}</span>
                    <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                      {action.shortcut}
                    </span>
                  </>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

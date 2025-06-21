"use client";

import { useState, useEffect, useCallback } from 'react';
import { useTileActions } from '../../Canvas/TileActionsContext';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { cn } from '~/lib/utils';
import { 
  Navigation, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronRight,
  Maximize2,
  Move,
} from 'lucide-react';
import type { ToolType } from '../../Canvas/TileActionsContext';

type DisplayMode = 'closed' | 'icons' | 'full';

interface ToolConfig {
  id: ToolType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut: string;
  color: string;
}

const TOOLS: ToolConfig[] = [
  { id: 'expand', label: 'Expand', icon: Maximize2, shortcut: 'X', color: 'indigo' },
  { id: 'navigate', label: 'Navigate', icon: Navigation, shortcut: 'N', color: 'cyan' },
  { id: 'create', label: 'Create', icon: Plus, shortcut: 'C', color: 'green' },
  { id: 'edit', label: 'Edit', icon: Edit, shortcut: 'E', color: 'amber' },
  { id: 'drag', label: 'Move', icon: Move, shortcut: 'M', color: 'purple' },
  { id: 'delete', label: 'Delete', icon: Trash2, shortcut: 'D', color: 'rose' },
];

export function Toolbox() {
  const { activeTool, setActiveTool, disabledTools } = useTileActions();
  
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Track which state we're in the cycle: 0=closed, 1=icons(->full), 2=full, 3=icons(->closed)
  const [cyclePosition, setCyclePosition] = useState(() => {
    // Initialize from localStorage
    const savedPosition = localStorage.getItem('toolbox-cycle-position');
    return savedPosition ? parseInt(savedPosition, 10) : 2; // Default to full mode (position 2)
  });
  
  // Derive display mode from cycle position
  const displayMode: DisplayMode = cyclePosition === 0 ? 'closed' : 
                                  cyclePosition === 2 ? 'full' : 'icons';

  // Save cycle position to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('toolbox-cycle-position', cyclePosition.toString());
  }, [cyclePosition]);

  const toggleDisplayMode = useCallback(() => {
    setCyclePosition((prev) => (prev + 1) % 4);
  }, []);
  
  // Keyboard shortcut for toggling the toolbox
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore shortcuts when typing in input fields
      const target = event.target as HTMLElement | null;
      if (target) {
        const isEditable = 
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.contentEditable === 'true';
        
        if (isEditable) {
          return;
        }
      }

      // Ignore shortcuts when modifier keys are pressed
      if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

      // Toggle toolbox with 'T' key
      if (event.key === 't' || event.key === 'T') {
        event.preventDefault();
        toggleDisplayMode();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleDisplayMode]);

  const handleToolClick = (tool: ToolType) => {
    // Don't select disabled tools
    if (disabledTools.has(tool)) {
      return;
    }
    
    setActiveTool(tool);
    // If toolbox is closed, open it to icons mode when a tool is selected
    if (displayMode === 'closed') {
      setCyclePosition(1); // Set to icons mode (position 1)
    }
  };

  // Calculate the number of tools to determine height
  const toolCount = TOOLS.length;
  const toolButtonHeight = 48; // h-12 in pixels
  const toolSpacing = 6; // space-y-1.5 in pixels
  const padding = 16; // p-2 * 2 (top and bottom) in pixels
  const separatorHeight = 1; // h-px in pixels
  const toggleButtonHeight = 40; // Approximate height with padding
  
  // Calculate total height when open
  const openHeight = toggleButtonHeight + separatorHeight + padding + (toolCount * toolButtonHeight) + ((toolCount - 1) * toolSpacing);
  
  // Calculate top offset to center the open toolbox
  // When centered, top = 50% - (height / 2)
  // We want the toggle button to stay fixed, so we calculate where it should be
  const topOffset = `calc(50% - ${openHeight / 2}px)`;

  return (
    <div className="fixed left-4 z-50" style={{ top: topOffset }}>
      <div className={cn(
        "bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg",
        "transition-all duration-300 ease-in-out origin-top-left",
        displayMode === 'closed' ? 'w-16' : displayMode === 'icons' ? 'w-16' : 'w-48'
      )}>
        {/* Toggle button */}
        <button
          onClick={toggleDisplayMode}
          className={cn(
            "w-full h-12 flex items-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:bg-gray-200 dark:focus:bg-gray-700 rounded-t-lg rounded-b-none transition-colors duration-200 focus:outline-none"
          )}
          aria-label="Toggle toolbox"
          aria-expanded={displayMode !== 'closed'}
        >
          {/* Single flex container that transitions smoothly */}
          <div className={cn(
            "w-full h-full flex items-center transition-all duration-300 ease-in-out",
            displayMode === 'full' ? "justify-start gap-2 px-6" : "justify-center"
          )}>
            <ChevronRight 
              className="w-5 h-5 flex-shrink-0 transition-transform ease-in-out"
              style={{
                transform: `rotate(${
                  cyclePosition === 0 ? 90 :    // Down
                  cyclePosition === 1 ? 0 :     // Right
                  cyclePosition === 2 ? 180 :   // Left
                  270                           // Up (270° instead of -90° for continuous rotation)
                }deg)`,
                transitionDuration: `${
                  // 180° rotation for: position 2->3 (180° to 270°) and position 3->0 (270° to 90°)
                  (cyclePosition === 3 || cyclePosition === 0) ? 300 : 150
                }ms`
              }}
            />
            
            <span className={cn(
              "text-sm font-medium transition-all duration-300",
              displayMode === 'full' ? "opacity-100 flex-1 w-auto" : "opacity-0 w-0",
              "text-gray-700 dark:text-gray-300"
            )}>
              Toolbox
            </span>
            
            <span className={cn(
              "text-xs font-medium px-1.5 py-0.5 rounded transition-all duration-300",
              "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
              displayMode === 'full' ? "opacity-100" : "opacity-0 w-0 px-0"
            )}>
              T
            </span>
          </div>
        </button>

        {/* Separator - always visible */}
        <div className="h-px bg-gray-200 dark:bg-gray-700" />

        {/* Tools section */}
        <div className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          displayMode === 'closed' ? 'max-h-[80px]' : 'max-h-[400px]'
        )}>
          <div className="p-2 relative flex flex-col" role="toolbar" aria-label="Map tools">
            {TOOLS.map((tool, index) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              const isDisabled = disabledTools.has(tool.id);
              
              // Determine if this tool should be visible
              const isClosing = cyclePosition === 0 && displayMode === 'icons';
              const shouldHide = (displayMode === 'closed' || isClosing) && !isActive;
              
              const isLastVisibleTool = displayMode === 'closed' || (index === TOOLS.length - 1);
              
              return (
                <div 
                  key={tool.id} 
                  className={cn(
                    "relative group overflow-visible transition-all duration-300 ease-in-out",
                    shouldHide ? "opacity-0 max-h-0 scale-95" : "opacity-100 max-h-[48px] scale-100",
                    !shouldHide && !isLastVisibleTool && "mb-1.5"
                  )}
                >
                  <button
                    onClick={() => handleToolClick(tool.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToolClick(tool.id);
                      }
                    }}
                    disabled={isDisabled}
                    className={cn(
                      "w-full h-12 flex items-center justify-start rounded-lg transition-all duration-200 relative overflow-hidden",
                      displayMode === 'full' ? 'gap-2 px-2' : 'px-2',
                      !isDisabled && displayMode !== 'closed' && "hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-105",
                      "focus:outline-none focus:ring-2",
                      // Apply tool color to focus ring when active
                      isActive && !isDisabled && {
                        'cyan': 'bg-cyan-100 dark:bg-cyan-900/20 ring-2 ring-cyan-500 text-cyan-700 dark:text-cyan-400 focus:ring-cyan-500',
                        'indigo': 'bg-indigo-100 dark:bg-indigo-900/20 ring-2 ring-indigo-500 text-indigo-700 dark:text-indigo-400 focus:ring-indigo-500',
                        'purple': 'bg-purple-100 dark:bg-purple-900/20 ring-2 ring-purple-500 text-purple-700 dark:text-purple-400 focus:ring-purple-500',
                        'green': 'bg-green-100 dark:bg-green-900/20 ring-2 ring-green-500 text-green-700 dark:text-green-400 focus:ring-green-500',
                        'amber': 'bg-amber-100 dark:bg-amber-900/20 ring-2 ring-amber-500 text-amber-700 dark:text-amber-400 focus:ring-amber-500',
                        'rose': 'bg-rose-100 dark:bg-rose-900/20 ring-2 ring-rose-500 text-rose-700 dark:text-rose-400 focus:ring-rose-500',
                      }[tool.color],
                      !isActive && !isDisabled && {
                        'cyan': 'text-gray-700 dark:text-gray-300 focus:ring-cyan-500',
                        'indigo': 'text-gray-700 dark:text-gray-300 focus:ring-indigo-500',
                        'purple': 'text-gray-700 dark:text-gray-300 focus:ring-purple-500',
                        'green': 'text-gray-700 dark:text-gray-300 focus:ring-green-500',
                        'amber': 'text-gray-700 dark:text-gray-300 focus:ring-amber-500',
                        'rose': 'text-gray-700 dark:text-gray-300 focus:ring-rose-500',
                      }[tool.color],
                      isDisabled && 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600'
                    )}
                    aria-label={`${tool.label} tool${isDisabled ? ' (disabled)' : ''}`}
                    aria-pressed={isActive}
                    aria-disabled={isDisabled}
                  >
                    {/* Single flex container that transitions smoothly */}
                    <div className={cn(
                      "w-full h-full flex items-center transition-all duration-300 ease-in-out",
                      displayMode === 'full' ? "justify-start gap-2 px-2" : "justify-center"
                    )}>
                      <Icon className={cn(
                        "w-5 h-5 flex-shrink-0",
                        isActive && !isDisabled && {
                          'cyan': 'text-cyan-600 dark:text-cyan-400',
                          'indigo': 'text-indigo-600 dark:text-indigo-400',
                          'purple': 'text-purple-600 dark:text-purple-400',
                          'green': 'text-green-600 dark:text-green-400',
                          'amber': 'text-amber-600 dark:text-amber-400',
                          'rose': 'text-rose-600 dark:text-rose-400',
                        }[tool.color],
                        isDisabled && 'text-gray-400 dark:text-gray-600'
                      )} />
                      
                      <span className={cn(
                        "text-sm font-medium transition-all duration-300",
                        displayMode === 'full' ? "opacity-100 flex-1 w-auto" : "opacity-0 w-0",
                          isActive && !isDisabled && {
                            'cyan': 'text-cyan-700 dark:text-cyan-400',
                            'indigo': 'text-indigo-700 dark:text-indigo-400',
                            'purple': 'text-purple-700 dark:text-purple-400',
                            'green': 'text-green-700 dark:text-green-400',
                            'amber': 'text-amber-700 dark:text-amber-400',
                            'rose': 'text-rose-700 dark:text-rose-400',
                          }[tool.color],
                          !isActive && !isDisabled && 'text-gray-700 dark:text-gray-300',
                          isDisabled && 'text-gray-400 dark:text-gray-600'
                      )}>
                        {tool.label}
                      </span>
                      
                      <span className={cn(
                        "text-xs font-medium px-1.5 py-0.5 rounded transition-all duration-300",
                        "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
                        displayMode === 'full' ? "opacity-100" : "opacity-0 w-0 px-0"
                      )}>
                        {tool.shortcut}
                      </span>
                    </div>
                  </button>

                  {/* Tooltip - only show in icons mode */}
                  {displayMode === 'icons' && (
                    <div
                      className={cn(
                        "absolute left-full ml-2 px-3 py-2 rounded-lg",
                        "bg-gray-900 dark:bg-gray-700 text-white text-sm shadow-lg",
                        "opacity-0 group-hover:opacity-100 pointer-events-none",
                        "transition-opacity duration-200",
                        "whitespace-nowrap z-[60]"
                      )}
                      role="tooltip"
                    >
                      <div className="font-medium">{tool.label}</div>
                      <div className="text-xs text-gray-300">Press {tool.shortcut}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
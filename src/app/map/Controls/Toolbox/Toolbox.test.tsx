import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Toolbox } from './Toolbox'
import { TileActionsContext, type ToolType } from '../../Canvas/TileActionsContext'
import type { ReactNode } from 'react'

// Mock context provider
const mockSetActiveTool = vi.fn()
const mockSetDisabledTools = vi.fn()
const mockActiveTool = 'navigate'

function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <TileActionsContext.Provider
      value={{
        activeTool: mockActiveTool,
        setActiveTool: mockSetActiveTool,
        disabledTools: new Set<ToolType>(),
        setDisabledTools: mockSetDisabledTools,
        onTileClick: vi.fn(),
        onTileHover: vi.fn(),
        onTileDragStart: vi.fn(),
        onTileDrop: vi.fn(),
        isDragging: false,
      }}
    >
      {children}
    </TileActionsContext.Provider>
  )
}

describe('Toolbox', () => {
  beforeEach(() => {
    mockSetActiveTool.mockClear()
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
      removeItem: vi.fn(),
      length: 0,
      key: vi.fn(),
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    })
  })

  describe('Rendering and Display Modes', () => {
    it('renders with default closed state', () => {
      render(
        <TestWrapper>
          <Toolbox />
        </TestWrapper>
      )

      // Toggle button should be visible
      const toggleButton = screen.getByRole('button', { name: /toggle toolbox/i })
      expect(toggleButton).toBeInTheDocument()

      // No tool buttons should be visible when closed
      expect(screen.queryByRole('button', { name: /navigate tool/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /create tool/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /edit tool/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /delete tool/i })).not.toBeInTheDocument()
    })

    it('transitions between display modes', () => {
      render(
        <TestWrapper>
          <Toolbox />
        </TestWrapper>
      )

      const toggleButton = screen.getByRole('button', { name: /toggle toolbox/i })

      // Click to open to icons mode
      fireEvent.click(toggleButton)
      
      // Tool buttons should be visible
      expect(screen.getByRole('button', { name: /navigate tool/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create tool/i })).toBeInTheDocument()
      
      // In icons mode, labels are in tooltips (not visible by default)
      // Tool buttons should be visible but labels are only in tooltips
      const navigateTool = screen.getByRole('button', { name: /navigate tool/i })
      const createTool = screen.getByRole('button', { name: /create tool/i })
      expect(navigateTool).toBeInTheDocument()
      expect(createTool).toBeInTheDocument()

      // Click to open to full mode
      fireEvent.click(toggleButton)
      
      // In full mode, we still use square buttons with tooltips
      // The buttons remain the same size
      expect(navigateTool).toBeInTheDocument()
      expect(createTool).toBeInTheDocument()

      // Click to close
      fireEvent.click(toggleButton)
      
      // No tool buttons should be visible
      expect(screen.queryByRole('button', { name: /navigate tool/i })).not.toBeInTheDocument()
    })
  })

  describe('Tool Selection', () => {
    it('updates active tool when tool button is clicked', () => {
      render(
        <TestWrapper>
          <Toolbox />
        </TestWrapper>
      )

      // Open toolbox
      const toggleButton = screen.getByRole('button', { name: /toggle toolbox/i })
      fireEvent.click(toggleButton)

      // Click navigate tool
      const navigateTool = screen.getByRole('button', { name: /navigate tool/i })
      fireEvent.click(navigateTool)
      expect(mockSetActiveTool).toHaveBeenCalledWith('navigate')

      // Click create tool
      const createTool = screen.getByRole('button', { name: /create tool/i })
      fireEvent.click(createTool)
      expect(mockSetActiveTool).toHaveBeenCalledWith('create')

      // Click edit tool
      const editTool = screen.getByRole('button', { name: /edit tool/i })
      fireEvent.click(editTool)
      expect(mockSetActiveTool).toHaveBeenCalledWith('edit')

      // Click delete tool
      const deleteTool = screen.getByRole('button', { name: /delete tool/i })
      fireEvent.click(deleteTool)
      expect(mockSetActiveTool).toHaveBeenCalledWith('delete')
    })

    it('highlights the active tool', () => {
      // Start with navigate tool active
      let currentActiveTool: ToolType = 'navigate'
      const TestComponent = () => {
        return (
          <TileActionsContext.Provider
            value={{
              activeTool: currentActiveTool,
              setActiveTool: mockSetActiveTool,
              disabledTools: new Set<ToolType>(),
              setDisabledTools: mockSetDisabledTools,
              onTileClick: vi.fn(),
              onTileHover: vi.fn(),
              onTileDragStart: vi.fn(),
              onTileDrop: vi.fn(),
              isDragging: false,
            }}
          >
            <Toolbox />
          </TileActionsContext.Provider>
        )
      }

      const { rerender } = render(<TestComponent />)

      // Open toolbox
      const toggleButton = screen.getByRole('button', { name: /toggle toolbox/i })
      fireEvent.click(toggleButton)

      // Default tool should be highlighted
      const navigateTool = screen.getByRole('button', { name: /navigate tool/i })
      expect(navigateTool).toHaveAttribute('aria-pressed', 'true')

      // Update context to simulate tool change
      currentActiveTool = 'create'
      rerender(<TestComponent />)

      // Create tool should be highlighted, navigate should not
      const createTool = screen.getByRole('button', { name: /create tool/i })
      expect(createTool).toHaveAttribute('aria-pressed', 'true')
      expect(navigateTool).toHaveAttribute('aria-pressed', 'false')
    })
    
    it('disables tools that are in the disabled set', () => {
      const TestComponent = () => {
        return (
          <TileActionsContext.Provider
            value={{
              activeTool: 'navigate',
              setActiveTool: mockSetActiveTool,
              disabledTools: new Set<ToolType>(['create', 'delete']),
              setDisabledTools: mockSetDisabledTools,
              onTileClick: vi.fn(),
              onTileHover: vi.fn(),
              onTileDragStart: vi.fn(),
              onTileDrop: vi.fn(),
              isDragging: false,
            }}
          >
            <Toolbox />
          </TileActionsContext.Provider>
        )
      }
      
      render(<TestComponent />)
      
      // Open toolbox
      const toggleButton = screen.getByRole('button', { name: /toggle toolbox/i })
      fireEvent.click(toggleButton)
      
      // Check that create and delete tools are disabled
      const createTool = screen.getByRole('button', { name: /create tool \(disabled\)/i })
      const deleteTool = screen.getByRole('button', { name: /delete tool \(disabled\)/i })
      expect(createTool).toBeDisabled()
      expect(deleteTool).toBeDisabled()
      expect(createTool).toHaveAttribute('aria-disabled', 'true')
      expect(deleteTool).toHaveAttribute('aria-disabled', 'true')
      
      // Check that navigate tool is not disabled but expand tool is also not disabled
      const navigateTool = screen.getByRole('button', { name: /^navigate tool$/i })
      const expandTool = screen.getByRole('button', { name: /^expand tool$/i })
      expect(navigateTool).not.toBeDisabled()
      expect(expandTool).not.toBeDisabled()
      
      // Try clicking disabled tool - should not trigger setActiveTool
      fireEvent.click(createTool)
      expect(mockSetActiveTool).not.toHaveBeenCalled()
    })
  })

  describe('Keyboard Shortcuts Display', () => {
    it('shows tooltips with labels and shortcuts on hover', async () => {
      render(
        <TestWrapper>
          <Toolbox />
        </TestWrapper>
      )

      // Open toolbox
      const toggleButton = screen.getByRole('button', { name: /toggle toolbox/i })
      fireEvent.click(toggleButton)

      // Hover over navigate tool
      const navigateTool = screen.getByRole('button', { name: /navigate tool/i })
      fireEvent.mouseEnter(navigateTool.parentElement!)

      // Tooltip should show label and shortcut
      const tooltips = screen.getAllByRole('tooltip')
      const navigateTooltip = tooltips.find(el => el.textContent?.includes('Navigate'))
      expect(navigateTooltip).toBeTruthy()
      expect(navigateTooltip).toHaveTextContent('Navigate')
      expect(navigateTooltip).toHaveTextContent('Press N')
    })

    it('buttons remain square in all modes', () => {
      render(
        <TestWrapper>
          <Toolbox />
        </TestWrapper>
      )

      // Open toolbox
      const toggleButton = screen.getByRole('button', { name: /toggle toolbox/i })
      fireEvent.click(toggleButton)

      // Check button has aspect-square class
      const navigateTool = screen.getByRole('button', { name: /navigate tool/i })
      expect(navigateTool).toHaveClass('aspect-square')

      // Click to full mode
      fireEvent.click(toggleButton)

      // Button should still be square
      expect(navigateTool).toHaveClass('aspect-square')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <TestWrapper>
          <Toolbox />
        </TestWrapper>
      )

      // Open toolbox
      const toggleButton = screen.getByRole('button', { name: /toggle toolbox/i })
      fireEvent.click(toggleButton)

      // Check toolbar role
      const toolbar = screen.getByRole('toolbar')
      expect(toolbar).toBeInTheDocument()

      // Check toggle button aria-expanded
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true')

      // Check tool buttons have proper labels
      expect(screen.getByRole('button', { name: /navigate tool/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create tool/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /edit tool/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete tool/i })).toBeInTheDocument()
    })

    it('supports keyboard navigation', () => {
      render(
        <TestWrapper>
          <Toolbox />
        </TestWrapper>
      )

      // Open toolbox
      const toggleButton = screen.getByRole('button', { name: /toggle toolbox/i })
      fireEvent.click(toggleButton)

      // Tab through tools
      const navigateTool = screen.getByRole('button', { name: /navigate tool/i })
      navigateTool.focus()
      expect(document.activeElement).toBe(navigateTool)

      // Press Enter to activate
      fireEvent.keyDown(navigateTool, { key: 'Enter' })
      expect(mockSetActiveTool).toHaveBeenCalledWith('navigate')

      // Press Space to activate
      const createTool = screen.getByRole('button', { name: /create tool/i })
      createTool.focus()
      fireEvent.keyDown(createTool, { key: ' ' })
      expect(mockSetActiveTool).toHaveBeenCalledWith('create')
    })
  })
})
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Toolbox } from './Toolbox'
import { TileActionsProvider, useTileActions } from '../../Canvas/TileActionsContext'
import { createMockTileData } from '../../test-utils/mockTileData'

describe('Toolbox Integration', () => {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    clear: vi.fn(),
    removeItem: vi.fn(),
    length: 0,
    key: vi.fn(),
  }
  
  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    })
  })
  // Simple test component that shows current tool
  function ToolDisplay() {
    const { activeTool, onTileClick } = useTileActions()
    return (
      <div>
        <div data-testid="active-tool">{activeTool}</div>
        <button 
          data-testid="test-tile"
          onClick={() => onTileClick(createMockTileData())}
        >
          Test Tile
        </button>
      </div>
    )
  }

  interface TestAppProps {
    onNavigateClick?: (data: ReturnType<typeof createMockTileData>) => void;
    onCreateClick?: (data: ReturnType<typeof createMockTileData>) => void;
    onEditClick?: (data: ReturnType<typeof createMockTileData>) => void;
    onDeleteClick?: (data: ReturnType<typeof createMockTileData>) => void;
  }

  function TestApp({ onNavigateClick, onCreateClick, onEditClick, onDeleteClick }: TestAppProps) {
    return (
      <TileActionsProvider
        onNavigateClick={onNavigateClick}
        onCreateClick={onCreateClick}
        onEditClick={onEditClick}
        onDeleteClick={onDeleteClick}
      >
        <Toolbox />
        <ToolDisplay />
      </TileActionsProvider>
    )
  }

  describe('Tool-based Interactions', () => {
    it('clicking with different tools triggers appropriate actions', () => {
      const mockHandlers = {
        onNavigateClick: vi.fn(),
        onCreateClick: vi.fn(),
        onEditClick: vi.fn(),
        onDeleteClick: vi.fn(),
      }
      
      render(<TestApp {...mockHandlers} />)

      // Open toolbox
      const toggleButton = screen.getByRole('button', { name: /toggle toolbox/i })
      fireEvent.click(toggleButton)

      const tile = screen.getByTestId('test-tile')

      // Test navigate tool (default)
      fireEvent.click(tile)
      expect(mockHandlers.onNavigateClick).toHaveBeenCalledWith(
        expect.objectContaining({ metadata: expect.objectContaining({ dbId: 'test-tile-1' }) })
      )

      // Switch to edit tool
      const editTool = screen.getByRole('button', { name: /edit tool/i })
      fireEvent.click(editTool)
      fireEvent.click(tile)
      expect(mockHandlers.onEditClick).toHaveBeenCalledWith(
        expect.objectContaining({ metadata: expect.objectContaining({ dbId: 'test-tile-1' }) })
      )

      // Switch to delete tool
      const deleteTool = screen.getByRole('button', { name: /delete tool/i })
      fireEvent.click(deleteTool)
      fireEvent.click(tile)
      expect(mockHandlers.onDeleteClick).toHaveBeenCalledWith(
        expect.objectContaining({ metadata: expect.objectContaining({ dbId: 'test-tile-1' }) })
      )

      // Switch to create tool
      const createTool = screen.getByRole('button', { name: /create tool/i })
      fireEvent.click(createTool)
      fireEvent.click(tile)
      expect(mockHandlers.onCreateClick).toHaveBeenCalledWith(
        expect.objectContaining({ metadata: expect.objectContaining({ dbId: 'test-tile-1' }) })
      )
    })

    it('shows current active tool', () => {
      render(<TestApp />)

      // Check default tool
      expect(screen.getByTestId('active-tool')).toHaveTextContent('navigate')

      // Open toolbox
      const toggleButton = screen.getByRole('button', { name: /toggle toolbox/i })
      fireEvent.click(toggleButton)

      // Switch to edit tool
      const editTool = screen.getByRole('button', { name: /edit tool/i })
      fireEvent.click(editTool)
      
      expect(screen.getByTestId('active-tool')).toHaveTextContent('edit')
    })
  })

  // Skip visual feedback tests for now as they require actual tile components
  describe.skip('Visual Feedback', () => {
    it('shows different cursors for different tools', () => {
      // Implementation needed when integrating with actual tile components
    })

    it('highlights tiles on hover based on active tool', () => {
      // Implementation needed when integrating with actual tile components
    })
  })

  describe('Keyboard Integration', () => {
    it('keyboard shortcuts work globally to switch tools', () => {
      render(<TestApp />)

      // Open toolbox to see visual feedback
      const toggleButton = screen.getByRole('button', { name: /toggle toolbox/i })
      fireEvent.click(toggleButton)

      // Press 'C' for create tool
      fireEvent.keyDown(document, { key: 'c' })
      
      const createTool = screen.getByRole('button', { name: /create tool/i })
      expect(createTool).toHaveAttribute('aria-pressed', 'true')

      // Press 'E' for edit tool
      fireEvent.keyDown(document, { key: 'e' })
      
      const editTool = screen.getByRole('button', { name: /edit tool/i })
      expect(editTool).toHaveAttribute('aria-pressed', 'true')

      // Press 'Escape' to return to select
      fireEvent.keyDown(document, { key: 'Escape' })
      
      // Verify tool changed to select
      expect(screen.getByTestId('active-tool')).toHaveTextContent('select')
    })

    it('prevents tool switching when typing in tile content', () => {
      render(<TestApp />)

      // Open toolbox
      const toggleButton = screen.getByRole('button', { name: /toggle toolbox/i })
      fireEvent.click(toggleButton)

      // Switch to edit tool
      const editTool = screen.getByRole('button', { name: /edit tool/i })
      fireEvent.click(editTool)

      // Click on tile to start editing
      const tile = screen.getByText('Test Tile')
      fireEvent.click(tile)

      // Simulate typing in an input field
      const input = document.createElement('input')
      document.body.appendChild(input)
      input.focus()

      // Try to switch tools with keyboard
      fireEvent.keyDown(input, { key: 'd' })

      // Tool should still be edit
      expect(editTool).toHaveAttribute('aria-pressed', 'true')

      // Cleanup
      document.body.removeChild(input)
    })
  })

  describe('State Persistence', () => {
    it('maintains tool selection across toolbox toggle', () => {
      render(<TestApp />)

      // Open toolbox
      const toggleButton = screen.getByRole('button', { name: /toggle toolbox/i })
      fireEvent.click(toggleButton)

      // Select edit tool
      const editTool = screen.getByRole('button', { name: /edit tool/i })
      fireEvent.click(editTool)

      // Verify tool is selected
      expect(screen.getByTestId('active-tool')).toHaveTextContent('edit')

      // Close toolbox
      fireEvent.click(toggleButton)

      // Tool should still be edit even when toolbox is closed
      expect(screen.getByTestId('active-tool')).toHaveTextContent('edit')
    })

    it('stores display mode preference in localStorage', () => {
      render(<TestApp />)

      const toggleButton = screen.getByRole('button', { name: /toggle toolbox/i })
      
      // Open to icons mode
      fireEvent.click(toggleButton)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('toolbox-display-mode', 'icons')

      // Open to full mode
      fireEvent.click(toggleButton)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('toolbox-display-mode', 'full')

      // Close
      fireEvent.click(toggleButton)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('toolbox-display-mode', 'closed')
    })
  })
})
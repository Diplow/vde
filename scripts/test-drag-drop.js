// Simple script to open the app with a test user for manual drag and drop testing
console.log(`
Manual Drag and Drop Test Instructions:
======================================

1. Make sure the dev server is running: pnpm dev

2. Open your browser to: http://localhost:3000/auth/signin?userId=0

3. After signing in, navigate to: http://localhost:3000/map?center=0,0

4. Try to drag tiles:
   - Hover over a tile you own (should show your user ID)
   - The cursor should change to 'move' cursor
   - Try dragging the tile to an empty position
   - The tile should become semi-transparent while dragging
   - Empty valid drop targets should show a ring highlight

5. Expected behavior:
   - Only tiles you own can be dragged
   - Root tiles (UserTiles) cannot be moved
   - Tiles can only be dropped on empty sibling positions
   - Children move with their parent tile

If drag and drop is not working, check:
- Browser console for errors
- Network tab for failed API calls
- That you're signed in as the correct user
`);
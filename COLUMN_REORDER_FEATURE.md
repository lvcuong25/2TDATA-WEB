# Column Reordering Feature

## Overview
This feature allows users to reorder table columns by dragging and dropping them in the table header.

## Implementation Details

### Backend Changes
1. **New API Endpoint**: `PUT /api/database/tables/:tableId/columns/reorder`
   - Accepts an array of `{ columnId, order }` objects
   - Updates the `order` field in the Column model
   - Includes proper permission checks

2. **Column Model**: Already has an `order` field (line 276-279 in Column.js)

### Frontend Changes
1. **New Component**: `DraggableColumnHeader.jsx`
   - Handles drag and drop functionality
   - Shows drag handle on hover
   - Maintains all existing column functionality (resize, edit, permissions)

2. **Updated Utilities**: `columnUtils.jsx`
   - Added functions for column reordering
   - Local storage management for column order
   - Order application logic

3. **Updated Components**:
   - `TableDetail.jsx`: Added drag and drop state and handlers
   - `TableBody.jsx`: Replaced static headers with draggable headers

## How to Use
1. Hover over any column header
2. Click and drag the drag handle (⋮⋮ icon) that appears on the left
3. Drop the column in the desired position
4. The column order is automatically saved to the backend

## Features
- ✅ Drag and drop column reordering
- ✅ Visual feedback during drag (opacity, rotation, border)
- ✅ Local storage caching for performance
- ✅ Backend persistence
- ✅ Permission checks (only users with edit structure permissions)
- ✅ Error handling with rollback
- ✅ Maintains existing column functionality (resize, edit, delete, permissions)

## Technical Notes
- Uses HTML5 drag and drop API
- Column order is stored in localStorage for immediate UI updates
- Backend updates are asynchronous with error handling
- Maintains compatibility with existing column features
- Works with all column types (system, custom, etc.)

## Files Modified
- `BE/src/controllers/columnController.js` - Added reorderColumns function
- `BE/src/router/routerDatabase.js` - Added reorder route
- `FE/src/pages/DatabaseManagement/Components/DraggableColumnHeader.jsx` - New component
- `FE/src/pages/DatabaseManagement/Utils/columnUtils.jsx` - Added reorder utilities
- `FE/src/pages/DatabaseManagement/TableDetail.jsx` - Added drag/drop state and handlers
- `FE/src/pages/DatabaseManagement/Components/TableBody.jsx` - Updated to use draggable headers
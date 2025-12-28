# Sorting Implementation Guide

## Overview
This document explains how the frontend-to-backend sorting flow works in your link preview application.

## Backend Implementation (route.ts)

### Location
[app/api/links/route.ts](app/api/links/route.ts#L281-L322)

### How It Works

1. **Query Parameter Extraction**
   ```typescript
   const { searchParams } = new URL(request.url)
   const sort = searchParams.get('sort');
   const order = searchParams.get('order');
   ```

2. **Input Validation**
   - **Allowed Sort Columns**: `['created_at', 'title']`
   - **Allowed Order Values**: `['asc', 'desc']`
   - **Default Values**: 
     - `sort` defaults to `'created_at'`
     - `order` defaults to `'desc'`

3. **Pattern Matching**
   ```typescript
   const sortColumn = sort && allowedSortColumn.includes(sort ?? '')
       ? sort : 'created_at'

   const sortOrder = allowedOrder.includes(order ?? '')
       ? order : 'desc'
   ```
   This ensures only valid values are used, preventing SQL injection and invalid queries.

4. **Database Query**
   ```typescript
   const { data: links, error } = await supabase
       .from('links')
       .select('*')
       .eq('user_id', user.id)
       .order('pinned', { ascending: false })           // 1st priority: pinned links first
       .order('pinned_at', { ascending: false, nullsFirst: false }) // 2nd: recently pinned
       .order(sortColumn, { ascending: sortOrder === 'asc' })       // 3rd: user choice
   ```

### Multi-Level Sorting
Your backend implements a three-tier sorting strategy:
1. **Pinned status** - Pinned links always appear first
2. **Pin timestamp** - Among pinned links, most recently pinned first
3. **User preference** - Finally sort by user-selected column (date or title)

## Frontend Implementation (page.tsx)

### State Management
```typescript
// Sorting state
const [sortBy, setSortBy] = useState<'created_at' | 'title'>('created_at')
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
```

### Fetch Function
```typescript
const fetchLinks = async () => {
  try {
    // Build URL with query parameters
    const params = new URLSearchParams({
      sort: sortBy,
      order: sortOrder
    })
    
    const res = await fetch(`/api/links?${params.toString()}`, { method: "GET" })
    
    // Handle response...
    const body = await res.json()
    setLinks(body.links)
  } catch (error) {
    toast.error("Failed to load your links!")
  }
}
```

### URL Construction
The `URLSearchParams` API automatically handles URL encoding:
- Input: `{ sort: 'created_at', order: 'desc' }`
- Output: `/api/links?sort=created_at&order=desc`

### Automatic Re-fetching
```typescript
useEffect(() => {
  if (authLoading) return
  fetchLinks()
}, [authLoading, user, sortBy, sortOrder])
```
Whenever `sortBy` or `sortOrder` changes, the effect automatically triggers a new fetch.

### UI Controls

**Sort By Toggle**
- Buttons to select between "Date" and "Title"
- Uses ToggleGroup component for single selection
- Updates `sortBy` state

**Sort Order Button**
- Toggle between ascending/descending
- Shows up/down arrow icon
- Updates `sortOrder` state

## Complete Data Flow

```
User clicks sorting control
         ↓
State updates (sortBy/sortOrder)
         ↓
useEffect detects change
         ↓
fetchLinks() called
         ↓
URLSearchParams builds query string
         ↓
fetch(`/api/links?sort=created_at&order=desc`)
         ↓
Backend receives request
         ↓
Extract and validate parameters
         ↓
Query database with validated values
         ↓
Return sorted results
         ↓
Frontend updates links state
         ↓
UI re-renders with sorted data
```

## Security Features

### Backend Validation
✅ **Whitelist Approach**: Only allows predefined values
✅ **Pattern Matching**: Validates against allowed arrays
✅ **Default Fallback**: Uses safe defaults if validation fails
✅ **SQL Injection Prevention**: No raw parameter interpolation

### Why This Matters
```typescript
// ❌ UNSAFE (your code doesn't do this)
.order(sort, { ascending: order === 'asc' })

// ✅ SAFE (what you implemented)
const sortColumn = allowedSortColumn.includes(sort) ? sort : 'created_at'
.order(sortColumn, { ascending: sortOrder === 'asc' })
```

## Usage Examples

### Default Behavior
No parameters → sorts by `created_at` in descending order (newest first)

### Sort by Title A-Z
URL: `/api/links?sort=title&order=asc`

### Sort by Date Oldest First
URL: `/api/links?sort=created_at&order=asc`

### Invalid Parameters
URL: `/api/links?sort=hacker&order=drop_table`
→ Falls back to defaults: `created_at` and `desc`

## Testing the Implementation

1. **Click "Date" button** → Should sort by creation date
2. **Click "Title" button** → Should sort alphabetically
3. **Click up/down arrow** → Should reverse order
4. **Pin a link** → Should appear first regardless of sort
5. **Unpin a link** → Should follow normal sorting

## Extension Ideas

To add more sorting options:
1. Add column to `allowedSortColumn` array in backend
2. Add corresponding toggle/button in frontend UI
3. Update TypeScript types if needed

Example for sorting by URL:
```typescript
// Backend
const allowedSortColumn = ['created_at', 'title', 'url'];

// Frontend
const [sortBy, setSortBy] = useState<'created_at' | 'title' | 'url'>('created_at')
```

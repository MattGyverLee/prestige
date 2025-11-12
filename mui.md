# Migration Plan: DevExpress to MUI X Data Grid

## Overview

Migrate from `@devexpress/dx-react-grid-material-ui` (maintenance mode) to `@mui/x-data-grid` (actively maintained, React 18+ compatible).

**Estimated Time:** 4-6 hours
**Priority:** Low (current solution works with warning suppression until React 19+)
**Complexity:** Medium

---

## Current State

**File to Migrate:**
- `src/components/AnnotTable/AnnotTable.tsx` (only file using DevExpress)

**Current Features:**
- Virtual scrolling
- Single-column sorting (by startTime)
- Search/filtering
- Column resizing
- Custom cell rendering (StartCell, FlowingCell, HighlightedCell)
- Toolbar with search panel

---

## Migration Steps

### Step 1: Install MUI X Data Grid (FREE)

```bash
npm install @mui/x-data-grid
```

**Remove DevExpress dependencies:**
```bash
npm uninstall @devexpress/dx-core @devexpress/dx-grid-core @devexpress/dx-react-core @devexpress/dx-react-grid @devexpress/dx-react-grid-material-ui
```

---

### Step 2: Update package.json

**Add to dependencies:**
```json
{
  "dependencies": {
    "@mui/x-data-grid": "^7.0.0"
  }
}
```

**Remove from devDependencies:**
```json
{
  "devDependencies": {
    // Remove these:
    // "@devexpress/dx-core": "^4.0.11",
    // "@devexpress/dx-grid-core": "^4.0.11",
    // "@devexpress/dx-react-core": "^4.0.11",
    // "@devexpress/dx-react-grid": "^4.0.11",
    // "@devexpress/dx-react-grid-material-ui": "^4.0.11",
  }
}
```

---

### Step 3: Migrate AnnotTable.tsx

#### 3.1 Update Imports

**OLD (DevExpress):**
```typescript
import {
  IntegratedFiltering,
  IntegratedSorting,
  SortingState,
  TableColumnResizing,
  SearchState,
} from "@devexpress/dx-react-grid";
import {
  Grid,
  Table,
  TableHeaderRow,
  VirtualTable,
  Toolbar,
  SearchPanel,
} from "@devexpress/dx-react-grid-material-ui";
```

**NEW (MUI X):**
```typescript
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
```

#### 3.2 Convert Column Definitions

**OLD (DevExpress):**
```typescript
const annotCols = [
  { name: "startTime", title: "Start", oneTwo: -1 },
  { name: "audCareful", title: "Careful Clip", oneTwo: 1 },
  { name: "txtTransc", title: "Transcription", wordWrapEnabled: true, oneTwo: 1 },
  { name: "audTransl", title: "Trans. Clip", oneTwo: 2 },
  { name: "txtTransl", title: "Translation", wordWrapEnabled: true, oneTwo: 2 },
];
```

**NEW (MUI X):**
```typescript
const columns: GridColDef[] = [
  {
    field: "startTime",
    headerName: "Start",
    width: 90,
    renderCell: (params) => <StartCell value={params.value} row={params.row} />,
  },
  {
    field: "audCareful",
    headerName: "Careful Clip",
    width: 55,
    renderCell: (params) => (
      <HighlightedCell oneTwo={1} value={params.value} row={params.row} />
    ),
  },
  {
    field: "txtTransc",
    headerName: "Transcription",
    flex: 1, // Takes remaining space
    renderCell: (params) => (
      <FlowingCell oneTwo={1} value={params.value} row={params.row} />
    ),
  },
  {
    field: "audTransl",
    headerName: "Trans. Clip",
    width: 55,
    renderCell: (params) => (
      <HighlightedCell oneTwo={2} value={params.value} row={params.row} />
    ),
  },
  {
    field: "txtTransl",
    headerName: "Translation",
    width: 200,
    renderCell: (params) => (
      <FlowingCell oneTwo={2} value={params.value} row={params.row} />
    ),
  },
];
```

#### 3.3 Simplify Custom Cell Components

**Update StartCell, FlowingCell, HighlightedCell:**

Remove the `Table.Cell` wrapper and just return the content:

```typescript
const StartCell = ({ value, row }: any) => (
  <span style={{ color: "lightblue" }}>
    {value}:{"  "}
    <button
      onClick={() => {
        if (this.props.currentTimeline === -1) {
          console.log("Empty Timeline Click");
        } else {
          this.props.setDispatch({
            dispatchType: "Clip",
            wsNum: 0,
            clipStart: row.startTime,
            clipStop: row.stopTime,
          });
        }
      }}
    >
      {" "}
      ▶{" "}
    </button>
  </span>
);
```

*Note: MUI X Data Grid handles the cell wrapping automatically.*

#### 3.4 Replace Grid Component

**OLD (DevExpress):**
```typescript
<Grid rows={this.props.annotationTable} columns={annotCols} rootComponent={Root}>
  <SearchState />
  <IntegratedFiltering />
  <SortingState defaultSorting={[{ columnName: "startTime", direction: "asc" }]} />
  <IntegratedSorting />
  <VirtualTable rowComponent={TableRow} cellComponent={dataCell} />
  <TableColumnResizing
    columnWidths={this.state.columnWidths}
    minColumnWidth={50}
    onColumnWidthsChange={this.setColumnWidths}
  />
  <Toolbar />
  <TableHeaderRow cellComponent={emptyHeaderCell} />
  <SearchPanel />
</Grid>
```

**NEW (MUI X):**
```typescript
<DataGrid
  rows={this.props.annotationTable}
  columns={columns}
  initialState={{
    sorting: {
      sortModel: [{ field: "startTime", sort: "asc" }],
    },
  }}
  slots={{
    toolbar: GridToolbar, // Includes search
  }}
  slotProps={{
    toolbar: {
      showQuickFilter: true,
      quickFilterProps: { debounceMs: 500 },
    },
  }}
  columnResizeMode="onResize"
  disableRowSelectionOnClick
  density="compact"
  sx={{
    minHeight: "50vh",
    height: "90vh",
    "& .MuiDataGrid-cell": {
      whiteSpace: "normal",
      wordWrap: "break-word",
    },
  }}
/>
```

#### 3.5 Remove Unnecessary State and Methods

**Delete these (MUI X handles internally):**
```typescript
// DELETE:
state = { columnWidths: this.defaultColumnWidths };
defaultColumnWidths = [...];
setColumnWidths = (columnWidths) => { ... };

// DELETE custom components:
const Root = (props: any) => { ... };
const TableRow = ({ ...restProps }: any) => { ... };
const emptyHeaderCell = ({ ...restProps }: any) => { ... };
const dataCell = ({ column, ...restProps }: any) => { ... };
```

---

### Step 4: Update Styling

**Add to your CSS/theme:**
```css
/* AnnotTable specific styles */
.annotation-table .MuiDataGrid-root {
  border: none;
}

.annotation-table .MuiDataGrid-cell:focus,
.annotation-table .MuiDataGrid-cell:focus-within {
  outline: none;
}

.annotation-table .MuiDataGrid-columnHeader:focus,
.annotation-table .MuiDataGrid-columnHeader:focus-within {
  outline: none;
}
```

---

### Step 5: Remove Warning Suppression

**In `src/index.tsx`, remove:**
```typescript
// DELETE THIS ENTIRE BLOCK:
// Suppress defaultProps deprecation warnings from third-party libraries
// This is specifically for @devexpress/dx-react-grid-material-ui which is in maintenance mode
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === "string" &&
    args[0].includes("Support for defaultProps will be removed")
  ) {
    return;
  }
  originalError.call(console, ...args);
};

const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === "string" &&
    args[0].includes("Support for defaultProps will be removed")
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};
```

---

## Testing Checklist

After migration, verify:

- [ ] Table displays all annotation rows correctly
- [ ] Sorting by "Start" column works (click header)
- [ ] Search/filter functionality works (toolbar search box)
- [ ] Column resizing works (drag column edges)
- [ ] Custom cell rendering works:
  - [ ] Start column shows time + play button
  - [ ] Careful Clip shows clickable audio links
  - [ ] Transcription text displays with word wrap
  - [ ] Translation Clip shows clickable audio links
  - [ ] Translation text displays with word wrap
- [ ] Click handlers work:
  - [ ] Clicking start time dispatches clip action
  - [ ] Clicking play button dispatches clip action
  - [ ] Clicking audio cells dispatches correct actions
- [ ] Virtual scrolling works for large datasets
- [ ] Table resizes properly with parent container
- [ ] No console warnings about defaultProps

---

## Rollback Plan

If migration fails:

1. Restore `package.json` from git
2. Run `npm install`
3. Restore `src/components/AnnotTable/AnnotTable.tsx` from git
4. Restore `src/index.tsx` warning suppression

```bash
git checkout HEAD -- package.json src/components/AnnotTable/AnnotTable.tsx src/index.tsx
npm install
```

---

## Reference Links

- [MUI X Data Grid Documentation](https://mui.com/x/react-data-grid/)
- [MUI X Data Grid Migration from v6](https://mui.com/x/migration/migration-data-grid-v6/)
- [Column Definition API](https://mui.com/x/api/data-grid/grid-col-def/)
- [Custom Cell Rendering](https://mui.com/x/react-data-grid/column-definition/#rendering-cells)

---

## Benefits After Migration

✅ **No more deprecation warnings**
✅ **React 18+ fully compatible**
✅ **Future-proof for React 19+**
✅ **Better TypeScript support**
✅ **Actively maintained library**
✅ **Smaller bundle size (~100KB vs ~150KB)**
✅ **Better MUI integration**
✅ **Simpler API (less boilerplate)**

---

## Notes

- MUI X Data Grid FREE is sufficient for this use case
- No need for Pro version ($15/month) unless you need:
  - Excel export
  - Row grouping
  - Tree data
  - Aggregation
  - Advanced filtering UI

---

## Timeline Recommendation

**When to migrate:**
- When you have 4-6 hours of development time available
- Before upgrading to React 19 (likely 2026+)
- During a refactoring sprint
- When adding new table features

**Not urgent because:**
- Current solution works fine with warning suppression
- React 19 is likely 1-2 years away
- No functional issues with DevExpress

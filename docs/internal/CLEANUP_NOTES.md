# Cleanup Notes - Potentially Unused Files

This file tracks components and files that may be unused or obsolete. Review before deletion.

## Frontend Components

### Custom Chart Components (Replaced by Recharts)
**Status**: Likely safe to remove
**Reason**: Dashboard.jsx now uses Recharts library instead of custom SVG charts

- `Frontend/src/components/charts/BarChart.jsx`
  - Custom SVG-based bar chart implementation
  - Replaced by Recharts `<BarChart>` component
  - Last used: Dashboard.jsx (now removed)

- `Frontend/src/components/charts/PieChart.jsx`
  - Custom SVG-based pie chart implementation
  - Replaced by Recharts `<PieChart>` component
  - Last used: Dashboard.jsx (now removed)

**Action**: Can be safely deleted after confirming no other components import them.

---

### Brain.jsx Component
**Status**: Review needed
**File**: `Frontend/src/components/Brain.jsx`

**Current usage**:
- Imported in `App.jsx` (line 14)
- May be used as a standalone page route

**Questions**:
- Is this an old brain viewer that's been replaced by BrainWebGLViewer?
- Is it still accessible via routing?
- Does it provide any unique functionality not in BrainStudyViewer?

**Action**: Check routes in App.jsx and verify if it's still needed. If BrainStudyViewer and BrainWebGLViewer provide all brain visualization features, this can likely be removed.

---

### DataTableComponent.jsx
**Status**: Review needed
**File**: `Frontend/src/components/DataTableComponent.jsx`

**Potential issue**: May be replaced by `CustomDataTable.jsx`

**Action**: Search for imports of this component to verify if it's still used.

---

## Backend Files

No unused backend files identified yet. All route files appear to be active.

---

## Localization-Algorithm Files

**Protected files** (DO NOT DELETE):
- `helper.py` - Core helper functions
- `brain_visualizer.py` - Main visualization script
- `brain_api.py` - FastAPI endpoints
- `datasets/**` - Required data files

---

## Recommendations

1. **Safe to delete** (after final verification):
   - Frontend/src/components/charts/BarChart.jsx
   - Frontend/src/components/charts/PieChart.jsx

2. **Needs investigation**:
   - Frontend/src/components/Brain.jsx
   - Frontend/src/components/DataTableComponent.jsx

3. **Keep for now**:
   - All other files until further review

---

Last updated: 2025-12-11

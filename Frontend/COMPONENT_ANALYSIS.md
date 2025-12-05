# EpiCareHub Dashboard & Patients Components - Technical Analysis

## Executive Summary

This document provides a comprehensive technical overview of two critical components in the EpiCareHub Frontend:
- **Dashboard.jsx**: Analytics dashboard displaying patient statistics and visualizations
- **Patients.jsx**: Patient management interface with CRUD operations and EEG file upload capability

Both components are authentication-protected and serve as core interfaces for neurologists and neurosurgeons to manage patient data and visualize analysis results.

---

## Component 1: Dashboard.jsx

### Purpose & Role
The Dashboard component serves as the primary analytics hub for administrators and clinicians. It provides high-level visibility into:
- Total patient population metrics
- Scan frequencies and patterns
- Patient demographics (age groups)
- Epilepsy diagnosis distribution
- Temporal trends in patient admission and scan activities

### Architecture Overview

**Component Type:** Functional React component
**Data Source:** Node.js/Express backend at `http://localhost:3000/patients/statistics`
**Rendering Framework:** Victory.js (React charting library)
**Styling:** Tailwind CSS + custom color palette

### Key Features

#### 1. KPI Card Component (Lines 13-28)
A reusable sub-component for displaying key performance indicators.

```jsx
export const KPICard = ({ label, value, isPrimary = false }) => {
  return (
    <div className="p-10 px-20 bg-white shadow-4 rounded-lg flex flex-col justify-center items-center">
      <p className="text-sm text-gray-500 font-semibold whitespace-nowrap">{label}</p>
      <p className={`text-3xl font-bold ${isPrimary ? "text-eh-4" : "text-eh-3"}`}>
        {value}
      </p>
    </div>
  );
};
```

**Properties:**
- `label`: Display label for the metric (string)
- `value`: Numerical value to display (number)
- `isPrimary`: Boolean flag to toggle color styling (eh-4 vs eh-3 colors)

**Styling Variants:**
- Primary KPIs (eh-4 color): "Total Patients", "Total Scans"
- Secondary KPIs (eh-3 color): "Epilepsy Patients", "Non-Epilepsy Patients"

#### 2. Data Fetching (Lines 31-56)

Uses axios to fetch aggregated statistics on component mount.

**API Configuration:**
```javascript
let config = {
  method: "get",
  maxBodyLength: Infinity,
  url: "http://localhost:3000/patients/statistics",
  headers: {},
};
```

**State Management:**
- Single state variable: `data` (contains aggregated statistics object)
- Lifecycle: Fetches once on mount, cleanup sets data to null on unmount

**Error Handling:** Currently commented out (commented lines 47-50)
- No error state management
- No error display to user
- Silent failure if API call fails

**Data Structure Expected:**
```javascript
{
  totalPatients: number,
  totatScans: number,  // Note: typo in field name
  epilepsyPatient: number,
  nonEpilepsyCount: number,
  ageGroupsData: [{ ageGroup: string, number: number }, ...],
  uploadScansDateWiseData: [{ date: timestamp, value: number }, ...],
  createdDateWiseData: [{ date: timestamp, value: number }, ...]
}
```

#### 3. Layout Structure (Lines 58-256)

Uses a three-column flex layout when data is available:

```
┌─────────────────────────────────────────────────────────────┐
│                    DASHBOARD LAYOUT (h-[85vh])              │
├──────────┬──────────────────────────┬──────────────────────┤
│   KPI    │     CENTER CHARTS        │   RIGHT CHARTS       │
│  CARDS   │ 1. Age Groups Dist.      │ 1. Datewise Patients │
│  (Left)  │ 2. Datewise Scans        │ 2. Epilepsy Status   │
│          │                          │                      │
│ - Total  │                          │                      │
│   Patients  (Victory Bar Chart)     │    (Victory Pie)     │
│ - Total  │  (Victory Bar Chart)     │                      │
│   Scans  │                          │                      │
│ - Epilepsy                          │                      │
│ - Non-                              │                      │
│   Epilepsy                          │                      │
└──────────┴──────────────────────────┴──────────────────────┘
```

**Column Widths:**
- Left KPI column: `w-1/12` (8.33%)
- Center and right: Implicit flex growth, `gap-2` spacing

**Container Sizing:**
- Height: `h-[85vh]` (85% of viewport height)
- Padding: `px-4` (1rem horizontal)
- Margin: `m-4`
- Justify content: `justify-around` (space around items)

#### 4. Visualization Components

##### A. Age Groups Distribution (Lines 75-114)
**Chart Type:** Vertical Bar Chart
**Data Points:** Age group categories on X-axis, patient count on Y-axis
**Color Scheme:** Teal (#65A19F)
**Dimensions:** 600px wide × 350px tall

```javascript
<VictoryBar
  data={data.ageGroupsData}
  x="ageGroup"
  y="number"
  style={{ data: { fill: "#65A19F" } }}
/>
```

**Legend:** "Patients" label

##### B. Datewise Scans (Lines 115-158)
**Chart Type:** Bar Chart with Date Axis
**Data Points:** Date (time-series) on X-axis, scan count on Y-axis
**Color Scheme:** Teal (#65A19F)
**Dimensions:** 600px × 350px

**Date Formatting:**
```javascript
tickFormat={(date) => {
  const convertedDate = new Date(date);
  return `${convertedDate.getMonth() + 1}/${convertedDate.getDate()}`;
}}
tickCount={5}  // Show 5 tick marks
style={{ tickLabels: { fontSize: 10 } }}
```

**Legend:** "Number of Scans"

##### C. Datewise Patient Entry (Lines 160-205)
**Chart Type:** Bar Chart (Patient enrollment trends)
**Data Points:** Date on X-axis, new patient count on Y-axis
**Color Scheme:** Teal (#65A19F)
**Dimensions:** 600px × 350px

**Data Source:** `createdDateWiseData` (filtered by patient creation date)

##### D. Epilepsy Status Distribution (Lines 206-252)
**Chart Type:** Pie Chart
**Data Categories:**
- "Positive" (Epilepsy diagnosed): #65A19F (teal)
- "Negative" (Non-epilepsy): #E49B42 (orange)

**Data Source:**
```javascript
<VictoryPie
  data={[
    { x: "Positive", y: data.epilepsyPatient },
    { x: "Negative", y: data.nonEpilepsyCount },
  ]}
  colorScale={["#65A19F", "#E49B42"]}
/>
```

**Label Format:** `"Category: Count"` (e.g., "Positive: 47")

### Color Palette
- **Primary/Teal (eh-4, #65A19F):** KPI cards, primary charts
- **Secondary/Mint (eh-3):** Secondary KPI text
- **Accent/Orange (#E49B42):** Non-epilepsy status in pie chart

### Known Issues

1. **Typo in Data Field Name (Line 68)**
   ```javascript
   value={data.totatScans}  // Should be "totalScans"
   ```
   This will display undefined if backend uses correct spelling.

2. **Missing Error Handling (Lines 46-50)**
   - Error state commented out
   - No user feedback on failed API call
   - Component silently fails if statistics endpoint is unavailable

3. **No Loading State**
   - Component renders empty while loading
   - Users see blank page until data arrives
   - No loading spinner or skeleton screens

4. **Hardcoded Backend URL**
   - `http://localhost:3000` hardcoded
   - Should use environment variables for different deployment environments

5. **Incomplete Data Validation**
   - No checks for missing data properties
   - Conditional rendering only checks `data && ...` at top level
   - Individual chart data availability checked but not for all fields

### Performance Considerations

- **Data Fetching:** Single API call on mount, no polling or real-time updates
- **Rendering:** All charts render simultaneously; no lazy loading
- **Memory:** Data retained in state until component unmount
- **Victory Charts:** Each chart renders with fixed dimensions (600×350), no responsiveness

### Dependencies

```javascript
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryPie,
  VictoryLegend,
  VictoryLabel,
  VictoryLine,  // Imported but not used
} from "victory";
```

**Unused Import:** `VictoryLine` is imported but never used in the component.

---

## Component 2: Patients.jsx

### Purpose & Role
The Patients component is the primary interface for managing patient records and uploading EEG data for analysis. It provides:
- **CRUD Operations:** Create, read, update, and delete patient records
- **EEG Upload:** Interface for uploading .fif files for brain visualization
- **Patient List:** Table view of all patients with action buttons
- **Success/Error Feedback:** Toast notifications via Snackbar

### Architecture Overview

**Component Type:** Functional React component with complex state management
**Data Sources:**
- Node.js backend: `http://localhost:3000/patients/*` (CRUD)
- Python backend: `http://localhost:8000/visualize_brain` (ML/visualization)
- Redux store: Patient upload ID management

**UI Libraries:**
- React Table: Data grid component (via DataTableComponent)
- PrimeReact: Dialog and confirmation components
- Material-UI: Snackbar and icons
- Custom: PatientForm component

### State Management (Lines 16-30)

**Component State:**
```javascript
const [data, setData] = useState([]);                    // Patient list
const [visible, setVisible] = useState(false);           // Dialog visibility
const [confirmDelete, setConfirmDelete] = useState(false); // Delete confirmation
const [loading, setLoading] = useState(true);            // Initial load state
const [error, setError] = useState(null);                // Error state
const [visual, setVisual] = useState(false);             // EEG processing state
const [selectedPatient, setSelectedPatient] = useState(null); // Current patient
const [isFile, setIsFile] = useState(false);             // Dialog mode toggle
const [message, setMessage] = useState("Successfully Added Patient"); // Toast message
const [open, setOpen] = useState(false);                 // Snackbar visibility
const [selectedFile, setSelectedFile] = useState(null);  // Uploaded file reference
```

**Redux Store:**
```javascript
const dispatch = useDispatch();
// Uses patientSlice actions:
// - selectUpload(uploadId): Stores EEG upload ID after processing
// - clearUpload(): Resets upload state on component mount
```

### Key Features

#### 1. Data Fetching (Lines 80-101)

Fetches patient list from backend.

**API Configuration:**
```javascript
const fetchData = () => {
  let config = {
    method: "post",  // Note: Unusual to use POST for fetching data
    maxBodyLength: Infinity,
    url: "http://localhost:3000/patients/get",
    headers: {},
  };
  setLoading(true);
  axios.request(config)
    .then((response) => setData(response.data))
    .catch((error) => setError(error))
    .finally(() => setLoading(false));
};
```

**Error Handling:** Sets error state but doesn't display to user (see rendering logic below)

**Called On:**
- Component mount (useEffect, line 196-199)
- After successful patient add/update (line 142)
- After successful patient delete (line 168)

#### 2. Patient Form Operations (Lines 114-154)

Handles add/edit patient logic with unified submission handler.

**Submission Logic:**
```javascript
const handleSubmit = useCallback(
  (patient) => {
    // Determine if POST (create) or PUT (update) based on selectedPatient
    let submitConfig = selectedPatient
      ? { method: "put", url: "http://localhost:3000/patients/", data: patient }
      : { method: "post", url: "http://localhost:3000/patients/", data: patient };

    axios.request(submitConfig)
      .then((response) => {
        if (!response.data.success) throw response.data.message;
        setMessage(response.data.message);
        fetchData();
        setOpen(true);
        setVisible(false);
      })
      .catch((error) => {
        selectedPatient ? setVisible(false) : setError(error);
      });
  },
  [selectedPatient]
);
```

**Key Behaviors:**
- Success: Closes dialog, fetches updated list, shows success toast
- Error (create): Sets error state (not displayed)
- Error (update): Silently closes dialog

#### 3. Delete Patient Operation (Lines 155-179)

Two-step confirmation-based deletion.

**Step 1: Show Confirmation Dialog (Line 184-188)**
```javascript
const handleDeleteClick = useCallback((patient) => {
  setSelectedPatient(patient);
  setConfirmDelete(true);
}, []);
```

**Step 2: Execute Deletion (Lines 155-179)**
```javascript
const accept = () => {
  let deleteConfig = {
    method: "delete",
    url: `http://localhost:3000/patients/${selectedPatient._id}`,
    headers: { "Content-Type": "application/json" },
  };

  axios.request(deleteConfig)
    .then((response) => {
      setMessage("Deleted Successfully");
      fetchData();
      setSelectedPatient(null);
      setOpen(true);
      setVisiblene(false);  // Shows success toast
    })
    .catch((error) => setError(error));
};
```

#### 4. EEG File Upload (Lines 32-65)

Uploads .fif (MEG/EEG data format) files to Python ML backend.

**File Input Handler:**
```javascript
const handleFileChange = (e) => {
  const file = e.target.files[0];
  setSelectedFile(file);
};
```

**Drag-and-Drop Support (Lines 103-112):**
```javascript
const handleFileDrop = (event) => {
  event.preventDefault();
  event.target.files = event.dataTransfer.files;
  handleFileChange(event);
};

const handleDragOver = (event) => {
  event.preventDefault();
};
```

**File Submission (Lines 37-65):**
```javascript
const handleFileSubmit = () => {
  if (selectedFile) {
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("patientId", selectedPatient._id);
    setVisual(true);  // Show processing screen

    const pythonApiUrl = import.meta.env.VITE_PYTHON_API_URL || "http://localhost:8000";

    axios.post(`${pythonApiUrl}/visualize_brain`, formData)
      .then((response) => {
        dispatch(selectUpload(response.data.data.uploadId));  // Store uploadId in Redux
        navigate(`/patient/${selectedPatient._id}`);  // Navigate to patient details
        setSelectedFile(null);
      })
      .catch((error) => {
        console.error("Error uploading file:", error);
        setMessage("Error uploading file.");
        setOpen(true);
      })
      .finally(() => setVisual(false));
  } else {
    setMessage("No file selected.");
    setOpen(true);
  }
};
```

**Key Features:**
- Multipart form data submission
- Uses environment variable for Python backend URL (fallback: localhost:8000)
- Stores uploadId in Redux for access in PatientDetails component
- Shows full-screen processing indicator while visualizing

#### 5. Dialog System (Lines 253-309)

Dual-mode dialog for add/edit patient or file upload.

**Mode 1: Patient Form (Lines 306-308)**
```javascript
<PatientForm patient={selectedPatient} onSubmit={handleSubmit} />
```
Displays when `isFile === false`

**Mode 2: File Upload (Lines 267-305)**
Drag-and-drop area with file preview:
```javascript
<div className="relative flex flex-col items-center">
  <div
    className="border cursor-pointer border-eh-4 rounded-md..."
    onDrop={handleFileDrop}
    onDragOver={handleDragOver}
  >
    <p>Drag and drop your FIF file here, or click to browse</p>
    <input
      type="file"
      accept=".fif"
      onChange={handleFileChange}
      className="absolute inset-0 opacity-0 cursor-pointer w-full"
    />
  </div>
  {selectedFile && (
    <div className="mt-4 border flex items-center...">
      <p>Selected File: {selectedFile.name}</p>
    </div>
  )}
</div>
```

#### 6. Loading & Processing States

**Initial Loading (Lines 201-207):**
```javascript
if (loading) {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-12 h-12 border-t-4 border-r-4 border-b-4 border-l-4 border-gray-900 animate-spin"></div>
    </div>
  );
}
```
Shows CSS spinner while fetching initial patient list.

**EEG Processing (Lines 209-227):**
```javascript
if (visual) {
  return (
    <div className="flex justify-center items-center flex-col overflow-hidden font-crete mt-32 bg-eh-4">
      <h2 className="text-3xl text-center text-white mb-4">Visualizing EEG Data</h2>
      <p className="text-xl text-center text-white">Please wait while we analyze and visualize the brain activity...</p>
      <div className="spinner mb-8"></div>
    </div>
  );
}
```
Shows full-screen processing state with teal background.

#### 7. UI Components

**Data Table (Line 247-252):**
```javascript
<DataTableComponent
  data={data}
  onEditClick={handleEditClick}
  onDeleteClick={handleDeleteClick}
  onUploadClick={handleUploadClick}
/>
```
Displays patient data in table format with three action buttons.

**Snackbar (Lines 310-326):**
Material-UI notification toast:
```javascript
<Snackbar
  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
  open={open}
  autoHideDuration={3000}
  onClose={handleClose}
  message={message}
  action={<IconButton onClick={handleClose}><CloseIcon /></IconButton>}
/>
```

**Confirm Delete Dialog (Lines 327-340):**
PrimeReact confirmation dialog with custom message:
```javascript
<ConfirmDialog
  message={`Are you sure you want to delete ${selectedPatient?.firstName || "this patient"}?`}
  accept={accept}
  reject={reject}
/>
```

### API Endpoints Summary

| Operation | Method | URL | Payload |
|-----------|--------|-----|---------|
| Fetch Patients | POST | `/patients/get` | {} |
| Create Patient | POST | `/patients/` | { ...patientData } |
| Update Patient | PUT | `/patients/` | { ...patientData } |
| Delete Patient | DELETE | `/patients/{id}` | (none) |
| Upload & Process EEG | POST | `/visualize_brain` (Python) | FormData: file, patientId |

### Dependencies

```javascript
import React, { useCallback, useState, useEffect } from "react";
import { useTable, useFilters } from "react-table";            // Not used!
import Snackbar from "@mui/material/Snackbar";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import DataTableComponent from "./DataTableComponent";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";  // confirmDialog not used
import axios from "axios";
import PatientForm from "./PatientForm";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { selectUpload, clearUpload } from "../features/patientSlice";
import FilePresentIcon from "@mui/icons-material/FilePresent";
```

**Unused Imports:**
- `useTable, useFilters` from react-table
- `confirmDialog` from primereact

### Known Issues

1. **Inconsistent API Methods (Lines 82-84)**
   - Uses POST for fetching data when GET would be more appropriate
   - POST for `patients/get` endpoint suggests non-standard REST design

2. **Missing Upload Button (Lines 297-304)**
   - Code for upload button is commented out
   - File submission happens automatically (auto-upload behavior missing)
   - Users can select files but may not understand how to submit

3. **Hardcoded Backend URLs**
   - Node.js backend: `http://localhost:3000` (hardcoded)
   - Python backend: Uses env variable `VITE_PYTHON_API_URL` with fallback
   - Inconsistent approach between two backends

4. **Poor Error Handling on Update (Line 147)**
   ```javascript
   selectedPatient ? setVisible(false) : setError(error);
   ```
   Silently closes dialog on update error without user notification.

5. **Unused Console Error (Line 54)**
   ```javascript
   console.error("Error uploading file:", error);
   ```
   Should be removed in production code.

6. **Redux Integration Issue (Lines 49-50)**
   - Uploads entire response data structure to Redux
   - Should extract only uploadId: `response.data.data.uploadId`
   - Redux store may contain unnecessary data

7. **Dialog Mode Toggle Issue (Lines 24, 192-193)**
   - `isFile` state controls which dialog content renders
   - Not reset when dialog closes, could cause confusion on next open
   - Should reset in dialog onHide callback

8. **No Form Validation**
   - PatientForm component handles validation (external)
   - No validation at Patients.jsx level
   - Client-side validation could be added here

### Performance Considerations

- **Data Fetching:** Fetches entire patient list on mount; no pagination
- **Large Patient Lists:** No pagination or virtualization; could render hundreds of rows
- **EEG Processing:** Blocks UI during visualization (full-screen modal)
- **Memory:** Stores entire dataset in state; no cleanup between operations
- **Re-renders:** useCallback used for event handlers to prevent child re-renders

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PATIENTS COMPONENT                       │
├──────────────┬──────────────────────────┬──────────────────┤
│              │                          │                  │
│  useEffect   │   Event Handlers         │  UI Rendering    │
│  - clearUpload()                        │                  │
│  - fetchData()                          │  Loading         │
│              │   - handleEditClick      │  - Spinner       │
│              │   - handleDeleteClick    │  - Full screen   │
│              │   - handleUploadClick    │  - Processing    │
│              │   - handleSubmit         │                  │
│              │   - handleFileChange     │  Main View       │
│              │   - handleFileSubmit     │  - DataTable     │
│              │   - handleFileDrop       │  - Dialog        │
│              │   - handleDragOver       │  - Snackbar      │
│              │                          │  - ConfirmDialog │
└──────────────┴──────────────────────────┴──────────────────┘
                          ↓
            ┌─────────────────────────────┐
            │   Redux Store               │
            │   (patientSlice)            │
            │                             │
            │ - uploadId (from selectUp)  │
            │ - (cleared on mount)        │
            └─────────────────────────────┘
                          ↓
            ┌─────────────────────────────────────┐
            │   Node.js Backend (3000)            │
            │                                     │
            │ - GET /patients/statistics          │
            │ - POST /patients/get                │
            │ - POST /patients/ (create)          │
            │ - PUT /patients/ (update)           │
            │ - DELETE /patients/:id              │
            └─────────────────────────────────────┘
                          ↓
            ┌─────────────────────────────────────┐
            │   Python Backend (8000)             │
            │                                     │
            │ - POST /visualize_brain             │
            │   (EEG analysis & 3D rendering)     │
            └─────────────────────────────────────┘
```

---

## Integration Points & Data Flow

### Dashboard → Patients Flow
1. User navigates from Dashboard (analytics overview) to Patients (management)
2. Patients component fetches fresh data on mount
3. Both components independently fetch from same backend

### Patients → PatientDetails Flow
1. User uploads .fif file in Patients component
2. File sent to Python backend at `/visualize_brain`
3. Backend returns `uploadId` in response
4. Component dispatches `selectUpload(uploadId)` to Redux
5. Component navigates to `/patient/{patientId}`
6. PatientDetails component retrieves `uploadId` from Redux
7. PatientDetails uses uploadId to fetch/display visualization data

### Navbar Behavior
- Both Dashboard and Patients are protected routes (require authentication)
- Navbar shows authenticated nav items (Dashboard, Patients, Logout links)
- Navigation between components via navbar or programmatic navigation

---

## Suggested Improvements

### Dashboard Component
1. Add error boundary and error display UI
2. Implement loading skeleton screens for charts
3. Move hardcoded URL to environment variable
4. Add responsive chart dimensions (not fixed 600×350)
5. Fix "totatScans" typo or adjust backend field name
6. Remove unused VictoryLine import
7. Add data validation before rendering charts
8. Implement data refresh capability (polling or manual refresh button)

### Patients Component
1. Comment out or remove console.error statement
2. Implement file upload button (currently auto-uploads)
3. Use GET instead of POST for data fetching
4. Implement pagination for large patient lists
5. Add form validation at component level
6. Standardize hardcoded URLs (use env variables)
7. Remove unused imports (useTable, useFilters, confirmDialog)
8. Reset dialog mode state on dialog close
9. Improve error handling on form submission
10. Add success feedback for file upload initiation

---

## Authentication & Security Context

Both components operate within the authenticated user context:

**Access Control:**
- Protected routes via RequireAuth wrapper
- localStorage.getItem('isLoggedIn') used for authentication state
- Navbar conditionally renders based on auth state

**Data Assumptions:**
- User is authenticated before accessing either component
- No role-based access control visible (both use same endpoints)
- Backend responsible for access control on API endpoints

**Sensitive Data:**
- Patient records (PII) handled
- EEG data files processed (medical records)
- No apparent encryption or secure transmission for sensitive data
- Should verify SSL/TLS configuration and backend security

---

## Environment Configuration

Both components reference environment variables:

**Dashboard.jsx:**
- No environment variables (hardcoded `http://localhost:3000`)

**Patients.jsx:**
```javascript
const pythonApiUrl = import.meta.env.VITE_PYTHON_API_URL || "http://localhost:8000";
```

**Required .env Configuration:**
```
VITE_PYTHON_API_URL=http://localhost:8000  // or production URL
```

**Recommended Additions:**
```
VITE_NODE_API_URL=http://localhost:3000    // or production URL
VITE_API_TIMEOUT=30000
```

---

## Testing Considerations

### Dashboard Component
- Mock axios for statistics endpoint
- Mock Victory chart rendering
- Test KPICard with various isPrimary values
- Test with missing data fields
- Test with empty arrays
- Performance test with large datasets

### Patients Component
- Mock all CRUD endpoints
- Test file upload with various file formats
- Test drag-and-drop file handling
- Test dialog mode toggling
- Test Redux dispatch calls
- Test navigation after upload
- Test error states for each operation

---

## Summary

**Dashboard.jsx** is a read-only analytics component that provides administrators with high-level visibility into system metrics and trends. It uses Victory.js for professional data visualizations and fetches aggregated statistics from the backend.

**Patients.jsx** is a complex, stateful component managing the full patient lifecycle with CRUD operations and EEG file upload integration. It coordinates with both Node.js and Python backends, manages Redux state for cross-component communication, and provides rich UI feedback through dialogs, snackbars, and confirmation dialogs.

Both components would benefit from:
- Improved error handling and user feedback
- Environment variable configuration
- Code cleanup (unused imports, commented code)
- Performance optimizations for large datasets
- Better separation of concerns (extract file upload logic)

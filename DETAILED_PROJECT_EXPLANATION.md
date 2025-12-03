# EpiCareHub - Comprehensive Project Explanation

## EXECUTIVE SUMMARY

EpiCareHub is a medical web platform designed to help healthcare professionals accurately identify seizure-affected areas in patients' brains for presurgical epilepsy evaluation. The platform combines clinical data management, interactive 3D brain visualization, and machine learning algorithms to improve surgical outcomes.

---

## 1. PROJECT OVERVIEW

### 1.1 Purpose
- Help clinicians locate epileptic seizure-affected regions in brain for surgical planning
- Enable data-driven clinical decision-making
- Manage patient records and medical imaging data
- Generate clinical reports for treatment recommendations

### 1.2 Repository Structure
```
SSWCS-555-EpiCareHub/
├── Frontend/                  # React web application
├── Backend/                   # Node.js/Express API server
├── Localization-Algorithm/    # Python FastAPI ML microservice
├── Automation/                # Selenium E2E tests
├── .circleci/                 # CI/CD configuration
├── README.md                  # Main documentation
└── .gitignore
```

### 1.3 Git Repository Details
- **Remote URL:** https://github.com/2024S-SSW-555-EpiCareHub/SSWCS-555-EpiCareHub
- **Current Branch:** main
- **Recent Commits:**
  - 99db5a7: Update README.md
  - bae68c2: updated getall patients
  - c02682d: Final version
  - e4f8458: Merge branch 'patient-report'
  - 7de8a20: PDF Report Generator done

---

## 2. ARCHITECTURE OVERVIEW

### 2.1 System Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                     USER (Browser)                           │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    (Port 5173)     (Port 3000)     (Port 8000)
        │                │                │
┌───────▼──────┐ ┌──────▼──────┐  ┌──────▼─────────┐
│   FRONTEND   │ │   BACKEND   │  │ PYTHON ML API  │
│              │ │             │  │                │
│ React + Vite │ │Express/Node │  │ FastAPI        │
│              │ │             │  │ Uvicorn        │
│ Components:  │ │ Routes:     │  │                │
│ - Brain 3D   │ │ - /users    │  │ Routes:        │
│ - Dashboard  │ │ - /patients │  │ - /visualize_  │
│ - Patients   │ │ - /patient │  │   brain        │
│ - Reports    │ │   Details  │  │ - /visualize_  │
│              │ │ - /patient │  │   brain_       │
│              │ │   Statistics   │   historic     │
└──────┬───────┘ │             │  │                │
       │         │ Express-    │  │ Uses:          │
       │         │ Session Auth│  │ - MNE (EEG)    │
       │         │ bcrypt      │  │ - PyTorch      │
       │         │             │  │ - Scipy        │
       │         │ Data Layer: │  │ - VTK/PyVista  │
       │         │ - Validation│  │ - Nilearn      │
       │         │ - MongoDB   │  │ - H5py         │
       │         │   Operations   │ - Cloudinary   │
       │         └──────┬──────┘  └────────┬────────┘
       │                │                  │
       │         ┌──────▼─────────┐        │
       │         │   MONGODB      │        │
       │         │   (Local/Cloud)│        │
       │         │                │        │
       │         │ Collections:   │        │
       │         │ - users        │        │
       │         │ - patients     │        │
       │         └────────────────┘        │
       │                                   │
       └───────────────────────────────────┘
```

### 2.2 Technology Stack

#### Frontend (React + Vite)
```javascript
Framework & Build:
- React 18.2.0
- Vite 5.1.4 (Build tool, dev server)
- React Router DOM 6.22.3 (Client-side routing)
- Redux Toolkit 2.2.3 (State management)

3D Visualization:
- Three.js 0.162.0 (3D graphics library)
- React Three Fiber 8.15.19 (React wrapper for Three.js)
- @react-three/drei 9.99.5 (Useful Three.js helpers)

UI Components & Styling:
- Material-UI (MUI) 5.15 (@mui/material, @mui/icons-material)
- React Bootstrap 2.10.2
- PrimeReact 10.5.3
- Tailwind CSS 3.4.1
- Sass 1.71.1

Charts & Visualization:
- Victory 37.0.2 (React charts)
- Chart.js 4.4.2 (JavaScript charting)
- react-chartjs-2 5.2.0 (React wrapper for Chart.js)

PDF & File Generation:
- jsPDF 2.5.1 (PDF generation)
- html2canvas 1.4.1 (Convert HTML to canvas/image)

Data & Utilities:
- Axios 1.6.7 (HTTP client)
- Lodash 4.17.21 (Utility functions)
- Moment 2.30.1 (Date/time manipulation)
- md5 2.3.0 (MD5 hashing)

Testing:
- Jest 29.7.0
- React Testing Library 14.2.1
- @testing-library/jest-dom 6.4.2
- Babel Jest 29.7.0

Development:
- Babel 7.24.0
- ESLint 8.56.0
- PostCSS 8.4.38
- Autoprefixer 10.4.19
```

#### Backend (Node.js + Express)
```javascript
Framework & Server:
- Express 4.18.3
- Node.js (v18+)

Database & ODM:
- MongoDB 6.4.0 (Primary database)
- MongoDB Node Driver (native driver)

Authentication & Security:
- bcrypt 5.1.1 (Password hashing)
- express-session 1.18.0 (Session management)
- validator 13.11.0 (Input validation)

File Upload:
- express-fileupload 1.5.0
- multer 1.4.5-lts.1 (File upload middleware)

HTTP & Middleware:
- body-parser 1.20.2 (JSON/URL-encoded parsing)
- cors 2.8.5 (Cross-Origin Resource Sharing)
- Axios 1.6.8 (HTTP client for external calls)

Utilities:
- Moment 2.30.1 (Date/time formatting)

Testing:
- Jest 27.4.5
- Supertest 6.3.4 (HTTP assertion library)
- Babel Jest 27.4.5
```

#### Python ML Service (Localization Algorithm)
```python
Web Framework:
- FastAPI 0.103.0 (Async web framework)
- Uvicorn 0.20.0 (ASGI server)
- python-multipart 0.0.6 (File upload handling)

Neuroscience & EEG Processing:
- MNE 1.6.1 (MEG/EEG signal processing)
- PyVista 0.43.4 (3D visualization)
- VTK 9.2.6 (Visualization Toolkit)
- Nilearn 0.10.3 (NeuroImaging Learning Analytics)

Machine Learning:
- PyTorch 2.2.2 (Deep learning framework)
- Scikit-learn 1.4.1 (ML algorithms)

Data Processing:
- NumPy 1.26.4 (Numerical computing)
- Scipy 1.13.0 (Scientific computing)
- Pandas 2.2.1 (Data manipulation)
- H5PY 3.10.0 (HDF5 file format)

Cloud Storage:
- Cloudinary SDK (Image/file hosting)

Dependencies:
- Python 3.11+
- Conda (Package/environment manager)
```

### 2.3 Environment & Deployment
```
Development:
- Local: Frontend (5173), Backend (3000), Python (8000)
- Database: MongoDB (local or cloud)
- Git: Main branch

CI/CD:
- CircleCI 2.1
- Workflows: test-frontend, test-backend
- Status: Has configuration but BROKEN (wrong path)

Deployment:
- NO Docker containers
- NO Kubernetes setup
- NO production environment config
- Manual deployment required
```

---

## 3. FRONTEND APPLICATION

### 3.1 Directory Structure
```
Frontend/
├── src/
│   ├── components/            # React components (25 files)
│   │   ├── Home.jsx           # Landing page
│   │   ├── Navbar.jsx         # Navigation bar
│   │   ├── Loader.jsx         # Loading spinner
│   │   ├── EpiCareHubLogin.jsx     # Login form
│   │   ├── RegistrationPage.jsx    # User registration
│   │   ├── AdminPage.jsx           # Admin user management
│   │   ├── Patients.jsx            # Patient list/table
│   │   ├── PatientForm.jsx         # Create/edit patient form
│   │   ├── PatientDetails.jsx      # View patient details
│   │   ├── Brain.jsx               # 3D brain visualization
│   │   ├── Dashboard.jsx           # Analytics & KPI dashboard
│   │   ├── PDFGenerator.jsx        # PDF report generation
│   │   ├── DataTableComponent.jsx  # Reusable data table
│   │   └── ... (13 more components)
│   ├── features/              # Redux state slices
│   │   └── patientSlice.js    # Patient state management
│   ├── __tests__/             # Jest test files (2 only)
│   │   ├── Home.test.js
│   │   └── EpiCareHubLogin.test.js
│   ├── assets/                # Images, icons, static files
│   ├── constants/             # Constants (navigation, etc.)
│   ├── App.jsx                # Main app with router
│   ├── store.js               # Redux store configuration
│   ├── main.jsx               # Entry point
│   ├── index.css              # Global styles
├── public/                    # Static public assets
├── package.json               # Dependencies & scripts
├── vite.config.js             # Vite configuration
├── jest.config.cjs            # Jest testing configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── postcss.config.js          # PostCSS configuration
└── .eslintrc.cjs              # ESLint configuration
```

### 3.2 Component Hierarchy & Routing
```
App (Main Router)
│
├── PrivateRoute Wrapper (Authentication check)
│   │
│   ├── Navbar (Always visible)
│   │
│   ├── Route: /
│   │   └── Home (Landing page)
│   │
│   ├── Route: /dashboard
│   │   └── Dashboard (Analytics & KPIs)
│   │
│   ├── Route: /patients
│   │   ├── Patients (Patient table)
│   │   │   └── Dialog: PatientForm (Create)
│   │   │   └── Dialog: PatientForm (Edit)
│   │   │   └── Dialog: Delete confirmation
│   │   │
│   │   ├── Route: /patients/:id
│   │   │   └── PatientDetails (View/Edit single patient)
│   │   │       ├── PatientForm (Edit)
│   │   │       ├── PDFGenerator (Generate report)
│   │   │       └── Brain (3D visualization)
│   │
│   ├── Route: /admin
│   │   └── AdminPage (User management)
│   │       ├── View users table
│   │       ├── Edit user dialog
│   │       └── Delete user
│   │
│   └── Route: /logout
│       └── Logout & redirect to login
│
├── Route: /login
│   └── EpiCareHubLogin (Login form)
│
└── Route: /register
    └── RegistrationPage (User registration form)
```

### 3.3 Key Components Detailed

#### Brain.jsx (3D Visualization)
```javascript
Purpose: Interactive 3D brain visualization for seizure localization
Features:
- Loads GLTF brain model from /obj/blender/Brain2.gltf
- Three.js + React Three Fiber rendering
- OrbitControls for rotation, zoom, pan
- Click detection on brain regions
- Heatmap overlay for anomaly highlighting
- Multiple viewing angles support
- Custom shader materials for visualization
- 6 directional lights for proper 3D rendering
- Popups on region click with information

State Management:
- Local component state for camera, controls
- Integration with parent PatientDetails component

Integration:
- Receives visualization data from Python API (localhost:8000)
- Displays processed EEG analysis results
- Allows user interaction with 3D model
```

#### Dashboard.jsx (Analytics)
```javascript
Purpose: Real-time analytics and KPI dashboard
Components:
1. KPI Cards (4 total):
   - Total Patients
   - Total Scans/EEG uploads
   - Epilepsy Positive Patients
   - Epilepsy Negative Patients

2. Charts (using Victory.js):
   - Age Groups Distribution (VictoryBar)
   - Datewise Patient Entry (VictoryBar)
   - Datewise EEG Scans (VictoryBar)
   - Epilepsy Status Distribution (VictoryPie)

3. Data Aggregation:
   - Fetches from GET /patients/statistics
   - Processes raw data into chart-friendly format
   - Groups patients by age, creation date, epilepsy status

Features:
- Real-time data refresh
- Dynamic chart generation
- Responsive layout using grid system
- Color-coded status indicators
- Date formatting with Moment.js
```

#### PDFGenerator.jsx (Report Generation)
```javascript
Purpose: Generate printable clinical reports in PDF format
Features:
- Patient information section
  - Name, DOB, gender, email, comments
  - Epilepsy status badge (color-coded)

- Brain visualizations (11 viewing angles):
  - medial, rostral, caudal, dorsal, ventral
  - frontal, parietal, axial, sagittal, coronal, lateral

- Report generation:
  - Uses jsPDF for PDF creation
  - Uses html2canvas for image capture
  - Auto page breaks for long content
  - Professional formatting with borders & captions
  - Page numbering
  - Filename: {PatientFirstName}_{PatientLastName}_Report.pdf

Integration:
- Captured from PatientDetails component
- Takes 3D brain visualizations as input
- Renders at multiple angles
- Exports as high-quality PDF

Technology:
- jsPDF 2.5.1 (PDF generation)
- html2canvas 1.4.1 (DOM to image conversion)
- Multiple Canvas renders for each angle
```

#### Dashboard.jsx (Patient Management)
```javascript
Purpose: CRUD operations for patient records
Features:
- Table display using PrimeReact DataTable
- Columns: Name, Email, DOB, Gender, Epilepsy Status, Actions
- Sorting and filtering on multiple fields
- Create patient (Modal dialog + PatientForm)
- Edit patient (Modal dialog + PatientForm)
- Delete patient (Confirmation dialog)
- View details (Navigate to PatientDetails)
- Search/filter by name, email, DOB

State Management:
- Redux: Store list of patients
- Local: Filter criteria, dialog visibility, selected row
- API calls: GET /patients, PUT /patients, DELETE /patients/:id, POST /patients

Validation:
- Client-side form validation in PatientForm
- Server-side validation in Backend
```

#### EpiCareHubLogin.jsx & RegistrationPage.jsx (Authentication)
```javascript
Purpose: User authentication (login/registration)
Features:
- Login form: Username, Password
- Registration form: First Name, Last Name, Username, Email, Password
- Client-side validation
- Form submission via Axios
- Session storage (localStorage flag)
- Error message display
- Redirect on successful auth

Security:
- Password minimum 8 characters
- Email validation
- Username 5-10 characters, alphanumeric only
- Server-side bcrypt password hashing

Integration:
- POST /register (register new user)
- POST /login (authenticate user)
- POST /logout (clear session)
- localStorage: 'isLoggedIn' flag
```

### 3.4 State Management (Redux)
```javascript
Store Structure:
store.js
├── patientSlice (Redux Toolkit)
│   ├── state: {
│   │   uploadedPatientId: null  // ID of last uploaded patient
│   │ }
│   ├── setUploadedPatientId(action.payload)
│   └── clearUploadedPatientId()
│
└── Selectors:
    └── selectUploadedPatientId

Usage:
- Tracks patient ID after EEG upload
- Used in Brain component to fetch visualization
- Clears after successful processing
```

### 3.5 Styling Architecture
```
Tailwind CSS (Primary):
- Utility-first CSS framework
- Responsive design classes
- Custom colors defined in tailwind.config.js
- Color scheme: eh-1 through eh-15 (custom colors)

Material-UI (Secondary):
- Form components (@mui/material)
- Icons (@mui/icons-material)
- Dialogs and modals
- Material Design principles

SCSS/Sass (Component-specific):
- Component-scoped styles
- CSS variables
- Mixins and functions

PostCSS:
- Autoprefixer for browser compatibility
- Tailwind CSS processing
```

### 3.6 API Integration (Frontend)
```javascript
Base URL: http://localhost:3000

Endpoints Used:

Authentication:
- POST /register
  Payload: { firstName, lastName, username, email, password }
  Response: { message, userId }

- POST /login
  Payload: { username, password }
  Response: { message, userId }

- POST /logout
  Response: { message }

Patients:
- GET /patients
  Response: [ { _id, firstName, lastName, dob, gender, email, isEpilepsy, comments, eegVisuals } ]

- POST /patients
  Payload: { firstName, lastName, dob, gender, email, isEpilepsy, comments }
  Response: { message, patientId, patient }

- PUT /patients
  Payload: { _id, firstName, lastName, dob, gender, email, isEpilepsy, comments }
  Response: { message, patient }

- DELETE /patients/:id
  Response: { message }

- GET /patients/:id
  Response: { patient: { _id, firstName, lastName, ... } }

- GET /patients/statistics
  Response: {
    totalPatients: number,
    totalScans: number,
    epilepsyPatients: number,
    nonEpilepsyPatients: number,
    ageGroups: { "0-18": 5, "19-30": 10, ... },
    patientsByDate: { "2024-01-01": 2, ... },
    scansByDate: { "2024-01-01": 1, ... }
  }

- POST /patients/upload (EEG file)
  Payload: FormData { file, patientId }
  Response: { message, patientId, visualizationUrl }

Brain Visualization (Python API):
- POST http://localhost:8000/visualize_brain
  Payload: { eeg_file, patient_id }
  Response: { visualization_urls: { medial, rostral, ... } }

- POST http://localhost:8000/visualize_brain_historic
  Payload: { patient_id, upload_id }
  Response: { visualization_urls: { medial, rostral, ... } }
```

### 3.7 Testing (Jest)
```
Test Coverage Status: 8% (2/25 components)

Test Files:
1. __tests__/Home.test.js
   - Tests Home component rendering
   - Tests navigation link presence

2. __tests__/EpiCareHubLogin.test.js
   - Tests login form rendering
   - Tests form input handling
   - Tests form submission
   - Tests error display

Setup:
- jest.config.cjs: Configuration file
- setupTests.js: Jest DOM setup
- Babel for JSX/ES6 transpilation

Missing Tests (23 components):
- Brain.jsx (3D visualization)
- Dashboard.jsx (charts & analytics)
- PatientDetails.jsx
- PatientForm.jsx (form validation)
- Patients.jsx (table & CRUD)
- AdminPage.jsx (user management)
- PDFGenerator.jsx (report generation)
- RegistrationPage.jsx
- DataTableComponent.jsx
- ... and others

Test Framework:
- Jest 29.7.0
- React Testing Library 14.2.1
- @testing-library/jest-dom 6.4.2
```

---

## 4. BACKEND APPLICATION

### 4.1 Directory Structure
```
Backend/
├── config/
│   ├── mongoConnection.js     # MongoDB connection & collection management
│   ├── mongoCollections.js    # MongoDB collection factory functions
│   ├── settings.js            # Configuration settings (DB credentials)
│   └── index.js               # Config exports
│
├── data/                      # Data access layer (Business logic)
│   ├── index.js               # Data module exports
│   ├── patients.js            # Patient CRUD operations
│   ├── user.js                # User authentication
│   ├── usersDetails.js        # User management
│   └── helper.js              # Validation utility functions
│
├── routes/                    # API route handlers
│   ├── index.js               # Router initialization & route mounting
│   ├── patients.js            # Patient endpoints
│   ├── user.js                # User endpoints
│   ├── usersDetails.js        # User management endpoints
│   └── __test__/              # Route tests
│       ├── index.test.js
│       └── userDetails.test.js
│
├── app.js                     # Express app setup & middleware
├── package.json               # Dependencies & scripts
├── edf.py                     # Python integration (orphaned/unused)
└── README.md                  # Backend documentation
```

### 4.2 Application Flow

#### Express App Setup (app.js)
```javascript
1. Import dependencies
   - Express, cors, body-parser
   - Session middleware
   - MongoDB connection
   - Route modules

2. Initialize Express app

3. Configure middleware:
   - CORS: Allowed origin localhost:5173
   - body-parser: JSON parsing
   - express-session: Session management
     - Secret key: from settings.js
     - Session store: memory (NOT recommended for production)
     - Cookie settings

4. Connect to MongoDB
   - Connect using settings.js credentials

5. Mount routes:
   - app.use('/', routes)

6. Error handling middleware
   - Catch-all error handler
   - Log errors to console

7. Start server on port 3000
   - console.log('Server running on localhost:3000')
```

### 4.3 Database Layer (data/)

#### patients.js (Patient CRUD)
```javascript
Functions:

1. createPatient(firstName, lastName, dob, gender, email, isEpilepsy, comments)
   - Validates all inputs using helper functions
   - Checks email uniqueness
   - Inserts into 'patients' collection
   - Returns: { success: true/false, patient, error }

2. getAllPatients()
   - Returns all patients sorted by creationDate (descending)
   - Returns: Array of patient documents

3. getPatientById(patientId)
   - Fetches single patient by _id
   - Returns: Patient document or null

4. updatePatient(patientId, updates)
   - Updates patient fields
   - Validates inputs
   - Returns: { success: true/false, patient, error }

5. deletePatient(patientId)
   - Deletes patient record
   - Returns: { success: true/false, deletedCount, error }

6. searchPatients(filters)
   - Filters by firstName, lastName, dob, email, isEpilepsy
   - Returns: Array of matching patients

7. getPatientStatistics()
   - Aggregates data:
     - Total patient count
     - Total EEG upload count
     - Epilepsy positive/negative counts
     - Age group distribution
     - Patients by creation date
     - EEG uploads by date
   - Returns: { totalPatients, totalScans, epilepsyPatients, ... }

MongoDB Collection: 'patients'
Schema:
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  dob: String (MM/DD/YYYY),
  gender: String,
  email: String (unique index),
  isEpilepsy: Boolean,
  comments: String,
  creationDate: ISO DateTime,
  eegVisuals: [
    {
      uploadDate: String,
      visualizationUrls: { medial, rostral, ... },
      modelFile: String (URL)
    }
  ]
}
```

#### user.js (Authentication)
```javascript
Functions:

1. registerUser(firstName, lastName, username, email, password)
   - Validates all inputs
   - Checks username/email uniqueness
   - Hashes password with bcrypt (14 salt rounds)
   - Inserts into 'users' collection
   - Returns: { success, userId, error }

2. loginUser(username, password)
   - Finds user by username
   - Compares password with bcrypt
   - Returns: { success, userId, error }

3. logoutUser(sessionId)
   - Destroys session
   - Clears authentication state
   - Returns: { success, error }

MongoDB Collection: 'users'
Schema:
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  username: String (unique index, 5-10 chars),
  email: String (unique index),
  password: String (bcrypt hashed),
  createdAt: ISO DateTime
}

Validation Rules:
- Username: 5-10 alphanumeric characters, no numbers
- Password: Min 8 chars, 1 uppercase, 1 number, 1 special char
- Email: RFC-compliant email format
- Names: Alphabetic characters only
```

#### usersDetails.js (User Management)
```javascript
Functions:

1. getAllUsers()
   - Returns all users (excluding passwords)
   - Returns: Array of user documents

2. getUserById(userId)
   - Fetches single user
   - Excludes password field
   - Returns: User document or null

3. updateUser(userId, updates)
   - Updates user fields
   - Validates inputs
   - Returns: { success, user, error }

4. deleteUser(userId)
   - Deletes user record
   - Returns: { success, deletedCount, error }

Used by: AdminPage for user management
```

#### helper.js (Validation)
```javascript
Validation Functions:

1. validateEmail(email) -> boolean
   - Checks RFC-compliant email format

2. validatePassword(password) -> boolean
   - Checks: min 8 chars, 1 uppercase, 1 number, 1 special char

3. validateUsername(username) -> boolean
   - Checks: 5-10 alphanumeric characters, no numbers
   - Note: Contradictory (says "no numbers" but param is alphanumeric)

4. validateName(name) -> boolean
   - Checks alphabetic characters only

5. validateDOB(dob) -> boolean
   - Checks MM/DD/YYYY format
   - Ensures date is in past or today

6. validateGender(gender) -> boolean
   - Allowed: Male, Female, Others, Prefer not to say

Usage:
- Called by data layer functions before DB operations
- Returns true/false or throws error
- Centralized validation prevents invalid data entry
```

### 4.4 Routes Layer (routes/)

#### User Routes (user.js)
```javascript
POST /register
- Handler: registerUserRoute()
- Payload: { firstName, lastName, username, email, password }
- Calls: data.registerUser()
- Response: { success: true, userId, message }
- Error: { success: false, message: error details }

POST /login
- Handler: loginUserRoute()
- Payload: { username, password }
- Calls: data.loginUser()
- Response: { success: true, userId, message }
- Creates express-session after login
- Sets req.session.userId
- Error: { success: false, message: "Invalid credentials" }

POST /logout
- Handler: logoutUserRoute()
- Response: { success: true, message }
- Destroys session: req.session.destroy()
```

#### Patient Routes (patients.js)
```javascript
POST /patients
- Create new patient
- Payload: { firstName, lastName, dob, gender, email, isEpilepsy, comments }
- Calls: data.createPatient()
- Response: { success: true, patientId, patient }

GET /patients
- Health check / List all patients
- Returns: Array of all patients
- Calls: data.getAllPatients()

GET /patients/:id
- Get single patient
- Returns: { patient: {...} }
- Calls: data.getPatientById(id)

PUT /patients
- Update patient
- Payload: { _id, firstName, lastName, ... }
- Calls: data.updatePatient()
- Response: { success: true, patient }

DELETE /patients/:id
- Delete patient
- Response: { success: true, deletedCount: 1 }
- Calls: data.deletePatient(id)

POST /patients/get
- Search/filter patients
- Payload: { firstName, lastName, dob, email, isEpilepsy }
- Calls: data.searchPatients(filters)
- Response: Array of matching patients

GET /patients/statistics
- Get dashboard statistics
- Returns: { totalPatients, totalScans, epilepsyPatients, nonEpilepsyPatients, ageGroups, patientsByDate, scansByDate }
- Calls: data.getPatientStatistics()

POST /patients/upload
- Upload EEG file
- Payload: FormData { file, patientId }
- Middleware: express-fileupload
- Calls: Python FastAPI endpoint at localhost:8000
- Returns: { visualizationUrls, patientId }
```

#### User Management Routes (usersDetails.js)
```javascript
GET /usersDetails
- Get all users
- Response: Array of user objects
- Calls: data.getAllUsers()

GET /usersDetails/:id
- Get single user
- Response: { user: {...} }
- Calls: data.getUserById(id)

PUT /usersDetails/:id
- Update user
- Payload: { firstName, lastName, email, ... }
- Calls: data.updateUser()
- Response: { success: true, user }

DELETE /usersDetails/:id
- Delete user
- Response: { success: true, deletedCount: 1 }
- Calls: data.deleteUser(id)
```

### 4.5 MongoDB Database

#### Connection Setup (mongoConnection.js)
```javascript
Connection Pattern: Singleton
- Uses native MongoDB driver
- Lazy-loads collections on first use
- Connection pooling via MongoDB driver

Settings (config/settings.js):
- Hardcoded credentials (SECURITY RISK)
- MongoDB Atlas cloud connection:
  - Host: epicarehub.72pd3xe.mongodb.net
  - Database: epicarehub
  - Collections: users, patients

Collections:

1. users
   - Document: { _id, firstName, lastName, username, email, password, createdAt }
   - Indexes: username (unique), email (unique)
   - Usage: Authentication, user management

2. patients
   - Document: { _id, firstName, lastName, dob, gender, email, isEpilepsy, comments, creationDate, eegVisuals }
   - Indexes: email (unique), creationDate (for sorting)
   - Usage: Patient records, medical data storage

Operations:
- CRUD: insertOne, updateOne, deleteOne, find, findOne
- Aggregation: $match, $group, $sort (for statistics)
- Transactions: None currently
```

### 4.6 Testing (Jest)
```
Test Coverage Status: 13% (2/15 modules)

Test Files:
1. routes/__test__/index.test.js
   - Tests POST /register endpoint
   - Tests user creation with valid/invalid data
   - Uses Supertest for HTTP testing
   - Mocks MongoDB and bcrypt

2. routes/__test__/userDetails.test.js
   - Tests user CRUD operations
   - Tests data retrieval and updates
   - Uses Supertest and manual mocks

Configuration:
- jest.config.js in package.json
- Babel for ES6 module transpilation
- Test pattern: **/__tests__/**/*.mjs, **/?(*.)+(spec|test).js

Missing Tests (13 modules):
- patients.js (CRUD operations)
- Patient routes (all endpoints)
- Statistics aggregation
- Error handling
- Input validation (helper.js)
- Authentication flows
```

### 4.7 Security Issues

#### Hardcoded Credentials
```javascript
1. MongoDB Connection (config/settings.js)
   - Connection string with credentials hardcoded
   - Should use environment variables

2. PostgreSQL Credentials (edf.py)
   - user: "postgres"
   - password: "admin123"
   - Exposed in source code
   - Should use .env file

3. Cloudinary API Keys (Localization-Algorithm/brain_visualizer.py)
   - Hardcoded API keys
   - Publicly exposed in repository
```

#### Session Management
```javascript
- Using memory store (not production-ready)
- Session data lost on server restart
- Should use MongoDB/Redis for production
- No session timeout configuration
- Secret key should be from environment variable
```

#### Password Security
```javascript
- Using bcrypt with 14 salt rounds (GOOD)
- Passwords validated (GOOD)
- No password reset mechanism
- No password expiration policy
```

---

## 5. PYTHON ML SERVICE (Localization Algorithm)

### 5.1 Directory Structure
```
Localization-Algorithm/
├── brain_api.py              # FastAPI application & endpoints
├── brain_visualizer.py       # Brain visualization & ML logic
├── helper.py                 # Helper functions & ML models
├── environment.yml           # Conda dependencies
├── config.json              # Configuration file
└── README.md                # (Empty/minimal documentation)
```

### 5.2 FastAPI Application (brain_api.py)
```python
Framework: FastAPI 0.103.0 + Uvicorn 0.20.0
Port: 8000
Base URL: http://localhost:8000

Endpoints:

POST /visualize_brain
- Purpose: Process new EEG file and generate brain visualization
- Payload:
  {
    "eeg_file": <file upload>,
    "patient_id": "63f3b1c4d5e2f1a0b9c3d5e6"
  }
- Process:
  1. Validate file upload
  2. Parse EEG data (.edf or .fif format)
  3. Extract evoked responses
  4. Run ConvDip_ESI neural network inference
  5. Generate source localization map
  6. Create 3D brain visualizations (11 angles)
  7. Upload images to Cloudinary
  8. Save visualization URLs to MongoDB
- Response:
  {
    "patient_id": "...",
    "visualization_urls": {
      "medial": "https://...",
      "rostral": "https://...",
      "caudal": "https://...",
      "dorsal": "https://...",
      "ventral": "https://...",
      "frontal": "https://...",
      "parietal": "https://...",
      "axial": "https://...",
      "sagittal": "https://...",
      "coronal": "https://...",
      "lateral": "https://..."
    },
    "model_file": "https://... (3D model)"
  }

POST /visualize_brain_historic
- Purpose: Re-visualize previously uploaded EEG data
- Payload:
  {
    "patient_id": "...",
    "upload_id": "..."
  }
- Process:
  1. Retrieve previous visualization data
  2. Regenerate visualizations (optional reprocessing)
  3. Return stored visualization URLs
- Response: Same as /visualize_brain

Configuration:
- CORS: Allowed origin http://localhost:5173
- File upload size limits
- Cloudinary credentials: Hardcoded (SECURITY RISK)
- Base paths: Configurable via config.json
```

### 5.3 Brain Visualization (brain_visualizer.py)
```python
Purpose: Core visualization and image generation logic

Functions:

1. load_eeg_data(file_path)
   - Reads EEG file (.edf or .fif)
   - Uses MNE library
   - Extracts raw EEG signal
   - Returns: MNE Raw object

2. preprocess_eeg(raw_eeg)
   - Filtering (bandpass filter)
   - Artifact removal
   - Downsampling if needed
   - Returns: Preprocessed MNE Raw object

3. extract_evoked_response(raw_eeg)
   - Identifies evoked response components
   - Extracts signal epochs
   - Averages responses
   - Returns: MNE Evoked object

4. localize_seizure_source(evoked_response)
   - Uses helper.ConvDip_ESI model
   - Performs neural network inference
   - Generates source localization map (1984D vector)
   - LCMV beamforming for spatial filtering
   - Returns: Localization map array

5. create_brain_visualization(patient_brain_model, localization_map, angle)
   - Loads 3D brain model (VTK/PyVista)
   - Maps localization values to brain surface
   - Creates heatmap overlay
   - Renders from specified angle
   - Returns: PNG image

6. generate_all_views(patient_brain_model, localization_map)
   - Calls create_brain_visualization() for 11 angles:
     medial, rostral, caudal, dorsal, ventral,
     frontal, parietal, axial, sagittal, coronal, lateral
   - Returns: Dictionary of image URLs

7. upload_to_cloudinary(image_data)
   - Uploads image to Cloudinary cloud storage
   - Returns: Cloudinary URL
   - (Credentials hardcoded - SECURITY RISK)

Libraries Used:
- MNE 1.6.1: EEG/MEG signal processing
- PyVista 0.43.4: 3D visualization
- VTK 9.2.6: Underlying 3D graphics
- Nilearn 0.10.3: Neuroimaging analysis
- NumPy/SciPy: Numerical operations
- Cloudinary: Cloud image storage
```

### 5.4 Helper Functions (helper.py)
```python
Purpose: ML models and utility functions

Classes & Functions:

1. ConvDip_ESI
   - PyTorch neural network model
   - Architecture: Convolutional layers with attention
   - Input: EEG signal (1984 features)
   - Output: Seizure localization map (1984D)
   - Uses: Squeeze-and-Excitation (SE) modules
   - Trained on: Epilepsy patient EEG database
   - Purpose: Seizure source localization

2. load_model(model_path)
   - Loads pretrained ConvDip_ESI model
   - PyTorch checkpoint loading
   - Returns: Model in eval mode

3. preprocess_signal(eeg_signal)
   - Normalizes signal
   - Extracts features
   - Prepares for neural network input
   - Returns: PyTorch tensor

4. run_inference(model, eeg_signal)
   - Feeds signal through neural network
   - No gradients (eval mode)
   - Returns: Localization map (1984D vector)

5. post_process_localization(raw_output)
   - Applies threshold to localization map
   - Smooths output using Gaussian filter
   - Maps to brain surface coordinates
   - Returns: Processed localization map

Dependencies:
- PyTorch 2.2.2: Neural network framework
- NumPy/SciPy: Numerical processing
- H5PY: Model file storage (HDF5 format)
```

### 5.5 Environment & Dependencies

#### Conda Environment (environment.yml)
```yaml
name: epicarehub-ml
channels:
  - conda-forge
  - pytorch
dependencies:
  - python=3.11

  # Web Framework
  - fastapi=0.103.0
  - uvicorn=0.20.0
  - python-multipart

  # EEG/Neuroscience
  - mne=1.6.1
  - pyvista=0.43.4
  - vtk=9.2.6
  - nilearn=0.10.3

  # Machine Learning
  - pytorch::pytorch
  - pytorch::pytorch::cudatoolkit
  - pytorch::torchvision
  - pytorch::torchaudio
  - scikit-learn=1.4.1

  # Data Processing
  - numpy=1.26.4
  - scipy=1.13.0
  - pandas=2.2.1
  - h5py=3.10.0

  # Cloud Storage
  - pip
  - pip::cloudinary
```

### 5.6 Configuration (config.json)
```json
{
  "base_brain_model_path": "/path/to/brain/model",
  "eeg_upload_directory": "/path/to/eeg/files",
  "output_visualization_directory": "/path/to/visualizations",
  "model_checkpoint_path": "/path/to/convdip_esi.pth",
  "cloudinary": {
    "cloud_name": "epicarehub",
    "api_key": "...",
    "api_secret": "..."  // HARDCODED - SECURITY RISK
  }
}
```

### 5.7 Integration with Backend

```
Flow:
1. Frontend uploads EEG file to Backend (POST /patients/upload)
2. Backend receives file, saves temporarily
3. Backend calls Python API (POST http://localhost:8000/visualize_brain)
4. Python FastAPI:
   - Receives EEG file
   - Processes with brain_visualizer.py
   - Runs ML model from helper.py
   - Generates visualizations
   - Uploads to Cloudinary
   - Returns URLs
5. Backend stores URLs in MongoDB patient.eegVisuals
6. Frontend fetches visualizations and displays in Brain.jsx component

Error Handling: None (potential improvement area)
Timeouts: Long-running (can take minutes for large EEG files)
Rate Limiting: None
Caching: None (redoes work for repeated requests)
```

---

## 6. TESTING INFRASTRUCTURE

### 6.1 CircleCI Configuration

#### Current Setup (.circleci/config.yml)
```yaml
version: 2.1
orbs:
  node: circleci/node@5

jobs:
  test-frontend:
    executor: node/default
    working_directory: ~/project/Frontend
    steps:
      - checkout: path: ~/project
      - node/install-packages: pkg-manager: yarn
      - run: name: Run tests
              command: yarn test --passWithNoTests

  test-backend:
    executor: node/default
    working_directory: ~/project/Frontend  # BUG: Should be Backend
    steps:
      - checkout: path: ~/project
      - node/install-packages: pkg-manager: yarn
      - run: name: Run tests
              command: yarn test --passWithNoTests

workflows:
  build-and-test:
    jobs:
      - test-frontend
      - test-backend
    # - deploy: (commented out)

Issues:
1. Backend job has WRONG directory (Frontend instead of Backend)
2. --passWithNoTests flag allows passing with no tests
3. No Python/Conda setup for Localization-Algorithm
4. No Selenium test execution
5. No deployment job (commented out)
6. Loose test requirements
```

### 6.2 Frontend Testing

#### Jest Configuration (jest.config.cjs)
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': '<rootDir>/jest.mock.js'
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  }
}
```

#### Test Files (2 only)
1. `__tests__/Home.test.js` - Tests Home component
2. `__tests__/EpiCareHubLogin.test.js` - Tests login form

#### Missing Tests (23 components)
- Brain.jsx, Dashboard.jsx, PatientDetails.jsx, PatientForm.jsx
- Patients.jsx, AdminPage.jsx, PDFGenerator.jsx, RegistrationPage.jsx
- DataTableComponent.jsx, Navbar.jsx, Loader.jsx
- And 12 other components

### 6.3 Backend Testing

#### Jest Configuration (package.json)
```javascript
"jest": {
  "moduleFileExtensions": ["js", "mjs"],
  "testMatch": ["**/__tests__/**/*.mjs", "**/?(*.)+(spec|test).js"]
}
```

#### Test Files (2 only)
1. `routes/__test__/index.test.js` - Tests user creation
2. `routes/__test__/userDetails.test.js` - Tests user operations

#### Missing Tests (13 modules)
- patients.js (data layer)
- Patient routes and endpoints
- Statistics aggregation
- Error handling
- Input validation (helper.js)

### 6.4 Selenium End-to-End Tests

#### Location: /Automation/venv/tests/

#### Test Files:
1. `conftest.py` - Pytest fixture setup
   - WebDriver initialization
   - Chrome options configuration

2. `test_login.py` - Login functionality tests
   - test_successful_login()
   - test_invalid_password()
   - test_invalid_username()

3. `page_objects/LoginPage.py` - Page Object Model
   - Locators for login page elements
   - Methods for user interactions

#### Coverage: <5%
- Only login tests implemented
- Missing: Patient CRUD, visualization, PDF generation, admin panel

#### Not in CI Pipeline
- No CircleCI integration
- Manual execution only

### 6.5 Python Testing

#### Status: ZERO
- No pytest files found
- No test_*.py files
- No test fixtures
- No ML model testing

#### Should Be Tested:
- FastAPI endpoints
- EEG file processing
- ML inference pipeline
- Visualization generation
- Error handling

---

## 7. CURRENT ISSUES & GAP ANALYSIS

### 7.1 Critical Issues (Must Fix)

| Issue | Severity | Impact | Details |
|-------|----------|--------|---------|
| CircleCI Backend Test Path | CRITICAL | CI Broken | Wrong directory path causes backend tests to fail |
| Hardcoded Credentials | CRITICAL | Security | MongoDB, PostgreSQL, Cloudinary credentials in source code |
| Zero Pytest Coverage | CRITICAL | Quality | No tests for Python ML service |
| 92% Frontend Tests Missing | CRITICAL | Quality | Only 2/25 components tested |
| 87% Backend Tests Missing | CRITICAL | Quality | Only 2/15 modules tested |

### 7.2 High Priority Issues

| Issue | Severity | Impact | Details |
|-------|----------|--------|---------|
| No Environment Configuration | HIGH | Deployment | No .env file or template |
| No Docker Setup | HIGH | Deployment | No containerization |
| No API Documentation | HIGH | Usability | No Swagger/OpenAPI docs |
| Incomplete Selenium Tests | HIGH | Quality | Only login tests, missing workflows |
| No Logging/Monitoring | HIGH | Operations | Can't track errors in production |

### 7.3 Medium Priority Issues

| Issue | Severity | Impact | Details |
|-------|----------|--------|---------|
| No Error Boundaries | MEDIUM | Reliability | Component crashes can crash entire app |
| Limited Form Validation | MEDIUM | UX | Client-side validation missing |
| No Pagination | MEDIUM | Performance | Can't handle large datasets |
| Unused PostgreSQL | MEDIUM | Maintenance | edf.py orphaned, confusing |
| No Input Sanitization | MEDIUM | Security | Risk of XSS/injection attacks |

### 7.4 What's Actually Working

✅ **Fully Functional:**
- React Frontend (rendering, routing, components)
- Express Backend (API endpoints, validation)
- 3D Brain Visualization (Three.js, interaction)
- Dashboard Charts (Victory.js visualizations)
- PDF Report Generation (jsPDF + html2canvas)
- User Authentication (bcrypt, sessions)
- Patient CRUD Operations (all endpoints working)
- MongoDB Connection (data persistence)
- Python ML Pipeline (EEG processing, visualization)

❌ **Broken/Missing:**
- CircleCI CI/CD pipeline (wrong config)
- Test coverage (92% missing)
- Environment configuration
- Docker/Kubernetes
- API documentation
- Error handling in Python API
- Logging system
- Monitoring/alerts

---

## 8. README CLAIMS VS REALITY

| Technology | README Claims | Actual Implementation | Status |
|-----------|---------------|----------------------|--------|
| React | ✓ | ✓ Fully implemented | ✓ |
| Node.js | ✓ | ✓ Express server | ✓ |
| Python | ✓ | ✓ FastAPI ML service | ✓ |
| MongoDB | ✓ | ✓ Primary database | ✓ |
| PostgreSQL | ✓ | Minimal (EDF files only) | ✗ Not primary |
| Jest Testing | ✓ | Configured but 8% coverage | ✗ Incomplete |
| Pytest Testing | ✓ | 0% - Not implemented | ✗ Missing |
| Selenium Testing | ✓ | <5% - Login only | ✗ Incomplete |
| CircleCI | ✓ | Configured but BROKEN | ✗ Broken |
| 3D Brain Viz | (Implicit) | ✓ Fully functional | ✓ |
| Dashboards | (Implicit) | ✓ Fully functional | ✓ |
| PDF Reports | (Implicit) | ✓ Fully functional | ✓ |

---

## 9. RECOMMENDED NEXT STEPS

### Phase 1: Critical Fixes (Week 1-2)
1. Fix CircleCI configuration (backend directory path)
2. Add environment variable support (.env files)
3. Remove hardcoded credentials
4. Add frontend component tests (aim for 50% coverage)

### Phase 2: Quality Assurance (Week 3-4)
5. Complete Jest test coverage (80%+ target)
6. Implement Pytest suite (80%+ target)
7. Expand Selenium tests
8. Add input validation and error handling

### Phase 3: Infrastructure (Week 5-6)
9. Dockerize application (Frontend, Backend, Python)
10. Create docker-compose orchestration
11. Set up Kubernetes manifests
12. Configure deployment pipeline

### Phase 4: Documentation (Week 7)
13. Add OpenAPI/Swagger documentation
14. Write API documentation
15. Create Postman collections
16. Update Localization-Algorithm README

### Phase 5: Production Readiness (Week 8+)
17. Add monitoring and logging
18. Set up error tracking
19. Implement rate limiting
20. Add health check endpoints

---

## 10. FILE LOCATIONS & KEY FILES

### Frontend
- **Main entry:** `/Frontend/src/main.jsx`
- **App router:** `/Frontend/src/App.jsx`
- **Redux store:** `/Frontend/src/store.js`
- **Key components:** `/Frontend/src/components/`
- **Tests:** `/Frontend/src/__tests__/`

### Backend
- **App setup:** `/Backend/app.js`
- **Data layer:** `/Backend/data/`
- **Routes:** `/Backend/routes/`
- **Config:** `/Backend/config/`
- **Tests:** `/Backend/routes/__test__/`

### Python ML
- **FastAPI:** `/Localization-Algorithm/brain_api.py`
- **Visualization:** `/Localization-Algorithm/brain_visualizer.py`
- **Helpers:** `/Localization-Algorithm/helper.py`
- **Config:** `/Localization-Algorithm/config.json`
- **Environment:** `/Localization-Algorithm/environment.yml`

### CI/CD
- **CircleCI:** `/.circleci/config.yml`
- **Automation:** `/Automation/venv/tests/`

---

## CONCLUSION

EpiCareHub is a **mature medical platform** with:
- ✓ Full-stack implementation (Frontend, Backend, ML)
- ✓ Core features working (visualization, dashboards, reports)
- ✓ Clean code architecture
- ✗ Incomplete testing (8% coverage frontend, 0% python)
- ✗ Broken CI/CD pipeline
- ✗ Missing production infrastructure
- ✗ Security issues (hardcoded credentials)

The platform demonstrates solid engineering fundamentals but needs investment in testing, security, and deployment infrastructure before production use.

---

This document provides a comprehensive reference for understanding the EpiCareHub project's architecture, components, and current state.

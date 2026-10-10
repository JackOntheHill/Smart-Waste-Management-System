# EcoCivic - Smart Waste Management System

A full-stack municipal civic-services web application built strictly with the **MERN Stack (MongoDB, Express.js, React.js, Node.js)** with TypeScript. Connects citizens reporting localized garbage accumulation with authorized municipal collection workers and administrative dispatchers.

---

## 1. Architectural Highlights

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React icons, Leaflet OpenStreetMap.
- **Backend**: Node.js, Express.js, RESTful JSON APIs, JWT authentication with HttpOnly cookies, Multer file upload validation, MongoDB with Mongoose object modeling.
- **Database**: MongoDB with GeoJSON `2dsphere` spatial indexing for proximity queries, audit chronologies, relational population, and transactions. Embedded in-memory MongoDB engine (`mongodb-memory-server`) initializes automatically out of the box when no external cluster URI is set.
- **Visual Design**: Municipal civic-services identity adhering strictly to anti-slop guidelines:
  - Deep Forest Green (`#285943`)
  - Muted Sage (`#A8B9A1`)
  - Warm Off-White (`#F7F7F2`)
  - Charcoal (`#252B27`)
  - Zero-pill metadata discipline, unboxed typographic metadata, tabular figures.

---

## 2. Default Demonstration Accounts

The database is pre-seeded with clean demonstration records. You can switch between roles immediately using the **Instant Demo Access** cards on the login screen or enter the credentials below:

| Role | Name | Email | Password | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Citizen** | Arun Patel | `arun.patel@gmail.com` | `CitizenPass@123` | South Fort Ward Resident |
| **Citizen** | Priya Nair | `priya.nair@gmail.com` | `CitizenPass@123` | Colaba Ward Resident |
| **Field Worker** | Rajesh Kumar | `rajesh.kumar@ecocivic.gov.in` | `WorkerPass@123` | EMP-W-402 (Ward 4 Tipper Truck) |
| **Field Worker** | Anita Sharma | `anita.sharma@ecocivic.gov.in` | `WorkerPass@123` | EMP-W-409 (Ward 7 Compactor Van) |
| **Administrator** | Municipal Desk | `admin@ecocivic.gov.in` | `AdminPass@123` | Department Commissioner |

---

## 3. End-to-End Core Workflows

### Workflow 1: Citizen Report Submission
1. Sign in as Citizen (Arun Patel).
2. Click **Report Garbage Accumulation**.
3. Select Garbage Classification (Hazardous tags trigger elevated priority).
4. Pinpoint location using the interactive Leaflet map or click **Detect My Location** (reverse geocodes street address). If a nearby pending report is within 300m, an advisory duplicate alert appears.
5. Upload at least **3 distinct photographs** (enforced by frontend and backend validation).
6. Verify summary in the confirmation dialog and lodge report into MongoDB.

### Workflow 2: Collection Worker Field Operations
1. Sign in as Field Worker (Rajesh Kumar).
2. The terminal queries MongoDB via `$nearSphere` geospatial indexing within a configurable radius (2 km, 5 km, 10 km, 20 km).
3. Open a task card to see original photos, distances, and contact details.
4. Click **Navigate in Maps** to open Google Maps directions to the exact GPS coordinates.
5. Click **Start Collection** to begin site clearance.

### Workflow 3: End Task Verification
1. Click **End Task** on the active task.
2. Worker must upload at least **3 distinct photographs** of the cleared area (different angles, container).
3. Worker must upload **1 on-site worker verification photograph** and check consent.
4. The server records receipt timestamps and validates evidence before transitioning the report to `Resolved`.

### Workflow 4: Citizen Feedback & Grievances
1. Citizen inspects the resolved report dossier with worker evidence pictures.
2. Citizen rates satisfaction (1–5 stars) and confirms clearance.
3. If dissatisfied, citizen lodges a civic grievance linked to the report.

---

## 4. RESTful API Contract

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Citizen registration (workers cannot self-register)
- `POST /api/auth/login` - Secure login verifying account role against backend
- `POST /api/auth/quick-login` - Fast demo authentication
- `POST /api/auth/logout` - Clear session cookie
- `GET /api/auth/me` - Current session profile

### Garbage Reports (`/api/reports`)
- `POST /api/reports` - Lodge new report (validates min 3 images, coordinates, contact)
- `GET /api/reports` - Query user or municipal reports with pagination & status filters
- `GET /api/reports/:id` - Full report dossier with photo gallery & audit trail
- `PATCH /api/reports/:id` - Edit report details (restricted to `Pending` status)
- `POST /api/reports/check-duplicate` - Geospatial duplicate check within 300m
- `POST /api/reports/:id/feedback` - Citizen post-resolution rating & verification

### Worker Dispatch (`/api/worker`)
- `GET /api/worker/nearby` - Geospatial query for eligible tasks near worker coordinates
- `GET /api/worker/tasks` - Worker's active & assigned tasks
- `POST /api/worker/tasks/:id/accept` - Claim pending task
- `POST /api/worker/tasks/:id/start` - Commence collection (`In Progress`)
- `POST /api/worker/tasks/:id/complete` - End task requiring 3+1 verified photos (`Resolved`)

### Grievances & Complaints (`/api/complaints`)
- `POST /api/complaints` - Lodge grievance linked to report
- `GET /api/complaints` - List grievances
- `PATCH /api/complaints/:id` - Administrator review and resolution notes

### Administrative Command (`/api/admin`)
- `GET /api/admin/overview` - Aggregate live database KPIs & resolution times
- `GET /api/admin/reports` - Full dispatch registry
- `PATCH /api/admin/reports/:id/assign` - Assign field worker to report
- `POST /api/admin/workers` - Authorize and provision field worker accounts

---

## 5. Local Setup & Execution

### Prerequisites
- Node.js 20+
- npm

### Installation
```bash
npm install
```

### Environment Configuration (`.env`)
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ecocivic # Optional: falls back to embedded MongoDB automatically
JWT_SECRET=ecocivic-super-secure-production-jwt-key-2026
```

### Development
```bash
npm run dev
```
The server will boot on `http://localhost:3000` with the embedded MongoDB instance and Vite middleware.

# Site Safety Forms

> **Construction Crew Safety & Photo Log** — A mobile-first full-stack web application designed for construction companies to manage daily safety inspections completed by field workers before commencing work at job sites.

---

## Live Deployment & Demo Credentials

* **Web Application:** [https://site-safety-psi.vercel.app](https://site-safety-psi.vercel.app)
* **REST API Health:** [https://site-safely-api.onrender.com/api/health](https://site-safely-api.onrender.com/api/health)

### Demo Accounts

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@sitesafety.com` | `demo1234` | Full metrics dashboard, site filters, missing worker tracking |
| **Worker** | `john@sitesafety.com` | `demo1234` | Daily checklist submission, photo upload, personal history |

---

## The Problem It Solves

Construction teams frequently struggle with fragmented paper safety forms, unorganized text messages, and lost condition photos. **Site Safety Forms** replaces manual paperwork with a centralized digital system:

* **Workers** quickly verify PPE compliance, identify hazards, upload site condition photos directly from mobile devices, and submit their daily inspection in under two minutes.
* **Admins** review submissions in real-time, filter by job site, worker, or date, and immediately identify workers who have not completed their mandatory daily safety submission.

---

## Tech Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React 19, JavaScript, Vite | Fast client-side rendering, component-driven architecture |
| **Styling** | Vanilla CSS | Custom properties, responsive mobile design, no framework lock-in |
| **Backend** | Node.js, Express.js | Structured REST API with layered separation of concerns |
| **Database** | PostgreSQL (via Supabase) | Relational integrity with foreign keys, constraints, and RLS policies |
| **Authentication** | Supabase Auth | Secure email/password authentication with JWT token verification |
| **Storage** | Supabase Storage | Object storage bucket for site inspection photos |
| **Hosting** | Vercel (Frontend), Render (Backend) | Independent production deployment and CI/CD pipelines |

---

## Architecture Overview

```
Browser (React Client)
   │
   ▼ HTTP / REST (JWT Bearer Token)
Express.js REST API
   ├── Routes      (URL mapping & middleware execution)
   ├── Controllers (Request parsing & response dispatching)
   ├── Services    (Business logic & authorization rules)
   └── DB Layer    (Supabase client & SQL execution)
   │
   ▼
PostgreSQL & Supabase Storage
```

* **Entity-Relationship Diagram (ERD):** [View the full database schema and ERD here](ERD.md).

---

## Repository Structure

```
site-safety-forms/
├── client/          # React frontend (Vite + Vanilla CSS)
│   ├── src/
│   │   ├── components/  # Reusable UI elements (Navbar, ErrorBoundary, WorkerDashboard)
│   │   ├── context/     # AuthContext state management
│   │   ├── lib/         # Supabase client initialization
│   │   ├── pages/       # Application views (Dashboard, SafetyForm, SubmissionDetails, Login)
│   │   └── services/    # Axios API client functions
│   ├── vercel.json      # Production SPA routing configuration
│   └── package.json
│
├── server/          # Express.js REST API
│   ├── routes/          # API route definitions
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic layer
│   ├── middleware/      # Auth, authorization, validation, file upload
│   ├── db/              # Database connection & schema scripts
│   ├── scripts/         # Automated seed and demo provisioning scripts
│   └── server.js        # Server entry point
│
├── .gitignore       # Production gitignore
├── README.md        # Project documentation
└── package.json     # Workspace management scripts
```

---

## Safety Inspection Checklist

The standardized safety checklist validates 8 essential site safety standards:

1. Hard hat worn (PPE)
2. High-visibility safety vest worn (PPE)
3. Steel-toe work boots worn (PPE)
4. Eye protection worn (PPE)
5. Fall protection installed and secured
6. Ladders and scaffolding inspected
7. Tools and electrical cords in safe working condition
8. Site inspected for undocumented hazards

---

## Security & Authorization

* **Authentication:** Token-based authentication using Supabase JWTs attached via custom Axios request interceptors.
* **Role-Based Access Control:**
  * `framer` (Worker): Can only submit new assessments and view their own past submissions.
  * `admin`: Complete visibility across all sites, aggregated analytics, multi-field filtering, and missing worker tracking.
* **Row-Level Security (RLS):** PostgreSQL policies guarantee data isolation directly at the database engine level.
* **Server-Side Validation:** Rigid verification of required boolean checklist fields, site active status, and image file types.

---

## API Endpoints

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/login` | Authenticate user & get JWT | Public |
| **GET** | `/api/auth/me` | Get current user profile | Worker / Admin |
| **GET** | `/api/sites` | List active job sites | Worker / Admin |
| **POST** | `/api/submissions` | Create safety form (w/ photos) | Worker / Admin |
| **GET** | `/api/submissions` | Get own past submissions | Worker / Admin |
| **GET** | `/api/submissions/:id` | Get specific submission details | Worker / Admin |
| **PUT** | `/api/submissions/:id` | Update submission details | Worker / Admin |
| **DELETE**| `/api/submissions/:id` | Delete submission | Worker / Admin |
| **GET** | `/api/admin/summary` | Dashboard stats (missing/active) | Admin |
| **GET** | `/api/admin/submissions` | Filterable list of all submissions | Admin |
| **GET** | `/api/admin/missing-workers`| Check which assigned workers are missing | Admin |

---

## Local Development Setup

### Prerequisites

* **Node.js** (v18.0.0 or higher)
* **npm** (v9.0.0 or higher)
* A **Supabase** project account (for PostgreSQL, Auth, and Storage)

### 1. Clone the Repository

```bash
git clone https://github.com/vaibhav-24hr/site-safely-dummy.git
cd site-safely-dummy
```

### 2. Configure Environment Variables

**Backend (`server/.env`):**

```bash
cp server/.env.example server/.env
```

Fill in your Supabase project URL and keys:
* `PORT=5000`
* `NODE_ENV=development`
* `CLIENT_ORIGIN=http://localhost:5173`
* `SUPABASE_URL=https://your-project-id.supabase.co`
* `SUPABASE_ANON_KEY=your-supabase-anon-key`
* `SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key`

**Frontend (`client/.env`):**

```bash
cp client/.env.example client/.env
```

Fill in your client settings:
* `VITE_API_URL=http://localhost:5000/api`
* `VITE_SUPABASE_URL=https://your-project-id.supabase.co`
* `VITE_SUPABASE_ANON_KEY=your-supabase-anon-key`
* `VITE_SUPABASE_PROJECT_ID=your-project-id`

### 3. Install Dependencies

```bash
# Install root, server, and client dependencies
npm install
npm --prefix server install
npm --prefix client install
```

### 4. Run the Development Servers

From the root directory:

```bash
# Run both backend and frontend concurrently:
npm run dev

# Or in separate terminals:
npm run server   # Express API (http://localhost:5000)
npm run client   # React Vite App (http://localhost:5173)
```

---

## License

ISC

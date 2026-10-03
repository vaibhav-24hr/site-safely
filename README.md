# ⛑️ Site Safety Forms

> **Construction Crew Safety & Photo Log** — A mobile-first full-stack web application designed for construction companies to manage daily safety inspections completed by field workers before commencing work at job sites.

---

## 🏗️ The Problem It Solves

Construction teams frequently struggle with fragmented paper safety forms, unorganized text messages, and lost condition photos. **Site Safety Forms** replaces manual paperwork with a centralized digital system:
* **Workers** quickly verify PPE, identify hazards, upload site condition photos directly from mobile devices, and submit their daily inspection in under two minutes.
* **Supervisors** review submissions in real-time, filter by job site, worker, or date, and immediately identify workers who have not completed their mandatory daily safety submission.

---

## 🛠️ Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React, JavaScript, Vite | Fast client-side rendering, component-driven architecture |
| **Styling** | Tailwind CSS | Mobile-first utility design with consistent ergonomics |
| **Backend** | Node.js, Express.js | Structured REST API with layered separation of concerns |
| **Database** | PostgreSQL (via Supabase) | Relational integrity with foreign keys, constraints, and SQL queries |
| **Authentication** | Supabase Auth | Secure email/password authentication with JWT verification |
| **Storage** | Supabase Storage | Secure object storage for site inspection photos |
| **Hosting** | Vercel (Frontend), Render (Backend) | Independent deployment and production CI/CD pipelines |

---

## 📐 Architecture Overview

```
Browser (React Client)
   │
   ▼ HTTP / REST
Express.js REST API
   ├── Routes      (URL mapping & middleware mounting)
   ├── Controllers (Request parsing & response dispatching)
   ├── Services    (Business rules & validation logic)
   └── DB Layer    (SQL queries & data access)
   │
   ▼
PostgreSQL & Supabase Storage
```

---

## 📂 Repository Structure

```
site-safety-forms/
├── client/          # React frontend (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/  # Reusable UI elements (Navbar, Button, Loading, etc.)
│   │   ├── pages/       # Application views (Worker & Admin dashboards, Forms)
│   │   ├── services/    # API client functions
│   │   ├── hooks/       # Custom React hooks
│   │   └── utils/       # Utility helpers
│   └── package.json
│
├── server/          # Express.js REST API
│   ├── routes/          # API route definitions
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic layer
│   ├── middleware/      # Auth, authorization, validation, error handling
│   ├── db/              # Database connection & query modules
│   └── server.js        # Server entry point
│
├── .gitignore       # Production gitignore
├── README.md        # Project documentation
└── package.json     # Workspace management scripts
```

---

## 🚀 Getting Started Locally

### Prerequisites
* **Node.js** (v18.0.0 or higher)
* **npm** (v9.0.0 or higher)
* A free **Supabase** project account (for PostgreSQL, Auth, and Storage)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/site-safety-forms.git
cd site-safety-forms
```

### 2. Configure Environment Variables

**Backend (`server/.env`):**
```bash
cp server/.env.example server/.env
```
Fill in your Supabase project URL and service/anon keys.

**Frontend (`client/.env`):**
```bash
cp client/.env.example client/.env
```
Fill in your backend API URL and Supabase public credentials.

### 3. Install Dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 4. Run the Development Servers
From the root directory:
```bash
# Run BOTH backend and frontend concurrently:
npm run dev

# Or run them in separate terminals:
npm run server   # Express API (http://localhost:5000)
npm run client   # React Vite App (http://localhost:5173)
```

---

## 📋 Key Safety Checklist Items

The fixed safety checklist validates 8 essential site safety standards:
1. 🦺 Hard hat worn
2. 🦺 Safety vest worn
3. 🥾 Safety boots worn
4. 🥽 Eye protection worn
5. 🧗 Fall protection in place
6. 🪜 Ladders & scaffolding inspected
7. 🔌 Tools and electrical cords in good condition
8. ⚠️ Site hazards identified

---

## 🔒 Security & Authorization

* **Authentication**: Token-based authentication using Supabase JWTs.
* **Role-Based Access Control**:
  * `framer`: Can only create submissions and view their own past forms.
  * `admin`: Access to aggregate metrics, multi-factor filters, and missing worker tracking.
* **Server-side Validation**: Strict verification of required fields, boolean values, and photo file properties.

---

## 📄 License
ISC

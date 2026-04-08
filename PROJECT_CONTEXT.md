# QA Automation Portfolio Project

## 🎯 Purpose

This project is a QA Automation portfolio project designed to simulate a real-world system.

The focus is to build a testable application with:

* API testing
* End-to-End testing (E2E)
* Real database interactions
* Clean and scalable architecture

The domain may evolve into a mini ERP (e.g., construction), but the initial focus is authentication and core system structure.

---

## 🧱 Tech Stack

### Backend

* Node.js
* Express
* Prisma ORM
* SQLite (initial database)
* Future migration: PostgreSQL

### Frontend

* HTML
* CSS
* JavaScript (Vanilla)

### Testing (planned)

* Cypress (E2E)
* API testing

---

## ⚠️ Core Rules

* DO NOT use mocks or in-memory arrays for data
* ALL database operations MUST use Prisma
* `schema.prisma` is the single source of truth
* Keep code simple, organized, and testable
* Avoid overengineering

---

## 📂 Project Structure (Current)

```
C:\projetos\qa-portfolio-project\
├── PROJECT_CONTEXT.md      # This file - project documentation
├── backend/
│   ├── .env                # Database URL and environment variables
│   ├── package.json        # Node dependencies
│   ├── prisma.config.ts    # Prisma configuration
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema (User, Client models)
│   │   └── migrations/     # Database migrations (auto-generated)
│   └── src/
│       ├── config/
│       │   └── prisma.js     # Centralized Prisma client instance
│       ├── controllers/
│       │   └── authController.js
│       ├── routes/
│       │   ├── auth.js       # Auth routes
│       │   └── index.js      # Route aggregator
│       ├── services/
│       │   └── authService.js
│       ├── app.js            # Express app setup
│       └── server.js         # Entry point
├── frontend/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── app.js
│   └── index.html
└── tests/
    ├── api/
    │   └── auth.cy.js
    └── e2e/
        └── login.cy.js
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Run Prisma Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations (creates database)
npm run db:migrate
```

### 3. Run the Project

```bash
# Development mode (with auto-reload)
npm run dev
```

The backend will start (default: http://localhost:3000).

---

## 🧩 Current Domain (Initial)

### User

* id
* name
* email
* password
* role

---

## 🔜 Future Entities

* Client
* Project (Construction / Obra)
* Cost
* Step

---

## 🎯 Current Technical Goal

* Set up Prisma correctly
* Ensure database connection works
* Run migrations successfully
* Replace any old models or mock data with Prisma
* Prepare for authentication (login)

---

## 🧭 Development Phases

### Phase 1 (Current - MVP)

* User login
* Prisma setup
* Basic backend + frontend
* API testing

### Phase 2

* User CRUD
* Validation and error handling
* API test coverage

### Phase 3

* Domain expansion (ERP)
* E2E with Cypress

---

## 🧪 QA Focus

This project should allow:

* API testing with real database
* E2E flows (login, CRUD)
* Predictable and resettable data
* Easy test setup and teardown

---

## 🧪 Testability Rules (Frontend)

All frontend elements MUST follow a consistent `data-testid` pattern to support automated testing.

### Pattern

data-testid="domain-page-element-action"

### Examples

* data-testid="auth-login-input-email"
* data-testid="auth-login-input-password"
* data-testid="auth-login-button-submit"

### Rules

* Use lowercase
* Use hyphen-separated names
* Keep names descriptive and consistent
* Do NOT use dynamic or random values
* Test IDs must be stable for automation

### Goal

Ensure reliable and maintainable E2E tests using Cypress.

---

## 🚀 Expectations for Code Changes

When modifying this project:

* Keep structure clean and minimal
* Follow separation of concerns (controller/service)
* Use Prisma Client for ALL DB access
* Do not introduce unnecessary complexity

---

## ❗ Important

If something is broken or missing:

* Identify the issue
* Explain clearly what is wrong
* Suggest the fix BEFORE applying it
* Wait for confirmation before making changes

The goal is learning and understanding, not just automatic fixing.

---

## 🤖 AI Collaboration Rules

* Always explain before applying changes
* Do not modify files without confirmation
* Prefer simple solutions over complex ones
* Focus on learning and clarity
* Break tasks into small steps when possible

The goal is to assist development, not replace understanding.

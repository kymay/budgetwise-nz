# BudgetWise NZ

**Course:** SD203 Investigative Studio 1 - Assessment 2 (Part A Prototype)
**Team Members:** Kyle May, Kieran Jacobs
**Repository:** [github.com/kylemay/budgetwise-nz](https://github.com/kylemay/budgetwise-nz)

---

## Overview

**BudgetWise NZ** is a cross-platform personal budgeting web application built to help New Zealand students manage their day-to-day finances in NZD. Designed as a lightweight, clutter-free alternative to generic budgeting tools, it allows users to set monthly category limits, track income and expenses, monitor savings goals, and view a live financial overview.

### Key Features (Part A Prototype)

- **Authentication & Protected Routes:** User sign-up and login powered by Supabase Auth and Next.js middleware (`middleware.ts`).
- **Dashboard:** Displays current net balance, a 6-month projected savings SVG line chart, recent transactions, and quick-action navigation.
- **Transactions Management:** Add, edit, and delete income and expense records (`app/transactions`).
- **Monthly Budget Tracking:** Set spending caps per category and monitor progress bars with limit alerts (`app/budget`).
- **Savings Goals:** Create savings targets and track progress (`app/savings-goals`).

---

## Tech Stack\*

**Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS

- **Backend & Database:** Next.js API Routes (`app/api/`), Supabase (PostgreSQL, Auth, `@supabase/ssr`)
- **Deployment:** Vercel

---

## Project Structure

```text
budgetwise-nz/
├── app/
│   ├── api/                 # Backend REST API endpoints
│   │   ├── balance/         # Net balance & category totals calculation
│   │   ├── budget/          # Budget category CRUD handlers
│   │   ├── savings-goals/   # Savings goals CRUD handlers
│   │   └── transactions/    # Transactions CRUD & [id] dynamic routes
│   ├── budget/              # Budget setup & overview UI
│   ├── login/               # User authentication (login/signup) UI
│   ├── savings-goals/       # Savings goals tracking UI
│   ├── transactions/        # Transaction management UI
│   ├── layout.tsx           # Root application layout
│   └── page.tsx             # Main Dashboard view
├── components/              # Reusable UI components (e.g., Navbar)
├── utils/supabase/          # Client and server Supabase helpers
└── middleware.ts            # Session verification & route protection
```

## Getting Started (Running via Command Prompt)

### Prerequisites

- Node.js (v18 or later)
- npm
- A Supabase project with the required tables (`transactions`, `budget_categories`, `savings_goals`, `user_settings`) and Row Level Security (RLS) policies configured.

1. Clone the repository:

```bash
git clone [https://github.com/kylemay/budgetwise-nz.git](https://github.com/kylemay/budgetwise-nz.git)
cd budgetwise-nz
```

2. Install dependencies:

```bash
npm install
```

3. Configure Environment Variables:
   Create a `.env.local` file in the root directory and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the Development Server:

```bash
npm run dev
```

Open http://localhost:3000 in your browser to view and test the application.

---

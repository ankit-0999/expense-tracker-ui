# Expense Tracker — Frontend

React SPA for the Personal Expense & Income Tracker. Login/register, dashboard with balance, charts (Recharts), transaction list, add/edit form, month filter, and toasts (react-toastify).

## Requirements

- **Node.js 18+** and npm

## Setup

```bash
# From project root: expense-tracker/frontend
cd frontend

# Install dependencies
npm install
```

## Environment

All configuration is loaded from `.env`; nothing is hardcoded. Copy `.env.example` to `.env` and set every value.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API base URL |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Vite) at http://localhost:5173 |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Serve production build locally |

## Run

```bash
# Start development server
npm run dev
```

App runs at **http://localhost:5173**. Ensure the [backend](../backend/README.md) is running (e.g. http://localhost:8000) for API calls.

## Structure

```
frontend/
├── src/
│   ├── main.tsx           # Entry, React Query + Router
│   ├── App.tsx            # Routes, AuthProvider, ToastContainer
│   ├── AuthContext.tsx     # Auth state, login/logout
│   ├── api.ts             # Fetch client, types, getTransactionId
│   ├── index.css          # Tailwind, theme
│   ├── components/
│   │   ├── Navbar.tsx
│   │   └── ui/            # Button, Card, Input
│   └── pages/
│       ├── Login.tsx      # Login / Register
│       └── Dashboard.tsx  # Summary, charts, form, transaction list
├── package.json
└── README.md
```

## Stack

- **React 19** + **Vite** + **TypeScript**
- **TanStack Query** — Server state, mutations
- **React Router** — Login, dashboard routes
- **Tailwind CSS** — Styling
- **Recharts** — Bar chart (income vs expense), pie chart (by category)
- **react-toastify** — Success/error notifications
- **Lucide React** — Icons  
- **Radix (slot)** — Button composition (shadcn-style)

For full project details and backend setup, see the [root README](../README.md).

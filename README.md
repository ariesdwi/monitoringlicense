# License OS - Frontend Documentation

This repository contains the frontend application for License OS, built with **Next.js**. It provides role-based access for Admins, Technical Leads (TL), Security (CISO), and IGA counterparts to manage organizational software licensing workflows and state tracking.

## 🏗 Architecture & Stack

- **Framework**: Next.js (App Router) + React 19
- **Language**: TypeScript throughout the core.
- **Styling**: Vanilla CSS Modules (no heavy external CSS framework dependencies).
- **State & Data Fetching**: Custom API client with robust offline mock-data fallbacks.

## 📂 Project Structure

- `app/` - The Next.js App Router root boundary. Contains the central layout definitions and application page routes.
- `components/ui/` - Atomic and composite UI functional components (Dashboards, Tables, Navigation Elements, and the Login flow).
- `lib/` - The core application service, models, data integration bindings, and API layer.

## 🔌 API & Data Layer (`lib/`)

The application's data layer is designed around an API-first approach that interacts seamlessly via JSON with the NestJS backend, while providing robust offline capabilities for unhindered local development.

### `lib/api.ts`
The foundational HTTP client wrapping the Fetch API.
- Automatically injects the `Authorization: Bearer` JWT from `localStorage`.
- Unifies standard HTTP response failures into a customized `ApiError`.
- Communicates directly to the REST backend defined by `NEXT_PUBLIC_API_URL` (defaulting to `:3001`).

### `lib/auth.ts`
The Authentication boundary.
- Resolves mapping of uppercase API Server Roles (`ADMIN`, `TL`, `CISO`, `IGA`) into frontend specific UI key definitions (`admin`, `tl`, `ciso`, `iga`).
- Marshals base User records emitted by login tokens into full specialized avatar classes, titles, and layout keys.
- Directly handles JWT `localStorage` mounting / un-mounting logic.

### `lib/services.ts`
Domain-specific interface boundaries executing the discrete data lifecycle actions.
- Includes methods ranging from complex state machine progressions (e.g. `createAccount`, `inviteGroup`, `confirmUsage`) to dashboard aggregations (`fetchMetrics`, `fetchActivities`).
> [!NOTE] 
> **Offline Dev Mode Resilience:** Every domain method in `services.ts` features a fallback try/catch net. If an underlying `TypeError` is discovered (indicative of the nest backend being unreachable), it dynamically resolves `lib/mockData.ts` objects allowing full system interface viewing without needing the live API active.

### `lib/types.ts`
Holds the central source of truth for the Application's domain entity shapes including `LicenseRequest`, `LicenseStatus` state literals, `Quota`, `User` schemas, and generic paginated responses.

## 🎭 Role-Based Access Control (RBAC)

The interface layout, routing logic, and data panels respond automatically based on an active session. The 4-tier hierarchy dictates conditional view bindings:
1. **Admin**: Has visibility across global licensing counts and the power to manually curate assignments.
2. **Technical Lead (TL)**: Acts within their `teamQuota` constraints. Operates on localized data to draft allocations and accept post-process accounts on behalf of their developers.
3. **CISO**: Dedicated security flow view allowing singular sign-off tasks (account provisioning and access authorizations).
4. **IGA Team**: Executes finalized software distribution provisioning routines post-CISO clearance.

## 🎨 Major UI View Components

All presentation layer elements are housed inside `components/ui/`.
- `Dashboard.tsx`: Primary logic conductor rendering conditional analytics, feed arrays, grids, and panel tabs.
- `LoginPage.tsx`: Stateful barrier handling authentication mutations.
- `RequestsPanel.tsx` & `LicenseTable.tsx`: Interaction grids for approving, dismissing, tracking, and editing allocations across teams.
- `Overview Widgets`: `ActivityFeed.tsx`, `HistoryTable.tsx`, `Badges.tsx`, and `QuotaPanel.tsx`.

## 🚀 Getting Started

First, ensure dependencies are installed:
```bash
npm run install
# or
yarn install
```

Start the application on development build:
```bash
npm run dev
```

Point your browser to [http://localhost:3000](http://localhost:3000).

> [!TIP]
> **API Connection**: To interact closely with the database flow, ensure your NestJS project is live at `http://localhost:3001` or set the `.env.local` variables natively matching `NEXT_PUBLIC_API_URL`.
# monitoringlicense

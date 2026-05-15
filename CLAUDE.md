# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BBP is a pet grooming shop management system (ระบบจัดการร้านอาบน้ำตัดขนสัตว์เลี้ยง) built with Next.js 16, React 19, and TypeScript. It includes bookings, POS, customer/pet management, hotel stays, products, services, and promotions. The UI has Thai-language labels and validation messages throughout.

## Commands

```bash
pnpm dev          # Start development server on http://localhost:3000
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # ESLint check
```

There is no test runner configured in `package.json` despite `__tests__/` existing. The `pnpm type-check` command mentioned in CONTRIBUTING.md is also not wired up; run `npx tsc --noEmit` directly for type checking.

## Required Environment Variables

```env
AUTH_PASSWORD=          # Single shared password for login
AUTH_SECRET=            # HMAC signing secret for session cookies
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CSRF_SECRET=            # Optional, falls back to "csrf-secret-key" if unset
```

## Architecture

### Authentication

Single-password auth — no user accounts. Login posts to `/api/auth/login`, which sets an HTTP-only cookie (`bbp_auth`) containing a base64url-encoded JSON payload signed with HMAC-SHA256. The dashboard layout (`app/(dashboard)/layout.tsx`) is a server component that reads and validates this cookie on every request; unauthenticated requests redirect to `/login`.

### API Layer (`app/api/`)

All routes are Next.js Route Handlers using `supabaseAdmin` (service-role client from `lib/supabase.ts`) — not the anon client. Every mutating route (POST/PUT/DELETE) must:
1. Call `validateCsrfFromRequest(request)` from `lib/csrf.ts`
2. Call `checkRateLimit(ip, config)` from `lib/rate-limit.ts`
3. Parse body with a Zod schema from `lib/schemas.ts`
4. Wrap the handler in try/catch and return via `errorResponse(error, context)` from `lib/error-handler.ts`

CSRF tokens are single-use HMAC tokens. The client fetches one from `GET /api/csrf-token` and passes it in the `x-csrf-token` header.

Successful responses use `successResponse(data)` which wraps data as `{ success: true, data, timestamp }`. Error responses follow `{ error, code, details?, timestamp }`.

### Data Flow: API Hooks vs. Zustand Stores

There are two parallel data layers — understand which to use:

**API hooks** (`lib/hooks/use-*.ts`) — fetch from Supabase via the API routes. Used for data that lives in the database: bookings, customers, products, services, hotel, sales, promotions. Each hook manages its own `loading`/`error` state and exposes CRUD functions that call fetch internally.

**Zustand stores** (`lib/store.ts`) — in-memory (non-persistent for most stores, except `useCounterStore` which persists ID counters to localStorage). These stores mirror the database for local UI operations. `useCounterStore` tracks auto-increment IDs client-side; call `syncWithDatabase(maxIds)` after fetching to prevent ID collisions.

**POS flow**: `usePOSStore` (in `lib/store.ts`) manages the cart, selected customer, selected pets, applied promotion, and linked booking/hotel booking. The POS page assembles a sale from this state and posts to `/api/sales`.

### Service Configuration

Pet types and sizes are configurable at runtime via `/api/config/pet-types` and `/api/config/pet-sizes`. The `ServiceConfigProvider` context (`lib/contexts/service-config-context.tsx`) wraps the dashboard and exposes `useServiceConfigContext()`. Services have a price matrix keyed on `(petTypeId, sizeId)`.

### Key Type Definitions

- `lib/types.ts` — core domain types: `Customer`, `Pet`, `Service`, `ServicePrice`, `Promotion`, `Product`, `Booking`
- `lib/api-types.ts` — API request/response shapes
- Zod schemas in `lib/schemas.ts` mirror these types with Thai error messages

### Error Handling

Throw typed error classes from `lib/error-handler.ts`: `ValidationError` (400), `AuthError` (401), `ForbiddenError` / `CsrfError` (403), `NotFoundError` (404), `RateLimitError` (429), `DatabaseError` (500). `handleApiError()` maps these to consistent HTTP responses. In React components, use `ErrorBoundary` from `components/error-boundary.tsx`.

### UI Components

All primitive UI components come from shadcn/ui (`components/ui/`). Feature components are colocated under `components/<feature>/`. The sidebar (`components/app-sidebar.tsx`) is the main navigation. `Sonner` is used for toast notifications via helpers in `lib/toast-helper.ts`.

### Database Schema

See `supabase/schema.sql`. Key tables: `customers`, `pets`, `services`, `service_prices`, `bookings`, `booking_pets`, `sales`, `sale_items`, `products`, `promotions`, `pet_type_configs`, `pet_size_configs`, `hotel_bookings`. All timestamps use `timestamptz`. The `booking_pets` join table links bookings to multiple pets with a `service_type` per pet.

## Conventions

- **Commit format**: `<type>: <subject>` (lowercase, imperative, ≤50 chars). Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `chore`, `ci`.
- **TypeScript**: strict mode, no `any`. Use interfaces for objects, type aliases for unions.
- **Imports**: group as React → third-party → local (`@/` alias for project root).
- **Validation error messages**: Thai language in Zod schemas to match the app's language.
- Rate limit configs are in `lib/rate-limit.ts` (`login`: 5/15min, `standard`: 60/min, `strict`: 10/min).
- `console.*` calls are stripped from production builds via `next.config.mjs`. Use `lib/logger.ts` or `lib/logger-advanced.ts` for structured logging.

# Pet Grooming Management System (BBP) - Frontend

ระบบจัดการร้านอาบน้ำตัดขนสัตว์ - Frontend Application

A modern, secure, and production-ready pet grooming shop management system built with Next.js 16, React 19, and TypeScript.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm 8+
- Supabase account

### Installation

1. **Clone the repository**
```bash
git clone <repo-url>
cd bbp-front
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Fill in the required variables:
```env
# Required
AUTH_PASSWORD=your_secure_password
AUTH_SECRET=your_secure_secret
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. **Run development server**
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes (products, sales, customers, bookings)
│   ├── dashboard/         # Dashboard pages
│   ├── layout.tsx         # Root layout with error boundaries
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── error-boundary.tsx # Error boundary for component errors
│   └── ui/               # UI components (buttons, forms, modals)
├── lib/                   # Utility functions and helpers
│   ├── auth.ts           # Authentication logic
│   ├── csrf.ts           # CSRF token generation/validation
│   ├── error-handler.ts  # Centralized error handling
│   ├── logger.ts         # Structured logging
│   ├── rate-limit.ts     # Rate limiting per IP
│   ├── schemas.ts        # Zod validation schemas
│   ├── pagination.ts     # Pagination helpers
│   ├── store.ts          # Zustand state management
│   ├── api-types.ts      # API response types
│   ├── toast-helper.ts   # Toast notification helpers
│   ├── loading-states.ts # Global loading state management
│   └── optimistic-updates.ts # Optimistic UI updates pattern
├── docs/                  # Documentation
│   └── API.md            # API reference documentation
├── __tests__/            # Unit tests
├── _skill/               # Custom command documentation
├── _task/                # Task management
└── public/               # Static files
```

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 16.0.10 with React 19.2.0
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand with localStorage persistence
- **Validation**: Zod (runtime schema validation)
- **Notifications**: Sonner (toast library)

### Backend Integration
- **Database**: Supabase PostgreSQL with RLS
- **Authentication**: Session-based with HMAC token validation
- **API**: RESTful with pagination

### Security
- **CSRF Protection**: HMAC-based tokens with timing-safe validation
- **Rate Limiting**: In-memory per-IP rate limiter
- **Input Validation**: Zod schemas with Thai error messages
- **Error Handling**: Centralized error classes with consistent responses
- **Logging**: Structured JSON logging with context

---

## 🧪 Testing

### Run Unit Tests
```bash
pnpm test
```

Tests are located in `__tests__/` and cover:
- Authentication logic
- Store operations
- Error handling
- Input validation

### Run Tests in Watch Mode
```bash
pnpm test:watch
```

### Generate Coverage Report
```bash
pnpm test:coverage
```

---

## 📦 Building

### Development Build
```bash
pnpm dev
```

### Production Build
```bash
pnpm build
pnpm start
```

### Lint Code
```bash
pnpm lint
```

---

## 📚 API Documentation

Complete API reference is available in [docs/API.md](docs/API.md)

### Key Endpoints

**Products**
- `GET /api/products` - Get all products with pagination
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

**Sales**
- `GET /api/sales` - Get sales with pagination
- `POST /api/sales` - Create sale

**Customers**
- `GET /api/customers` - Get customers with pagination
- `POST /api/customers` - Create customer

**Bookings**
- `GET /api/bookings` - Get bookings
- `POST /api/bookings` - Create booking

All POST/PUT/DELETE requests require CSRF token in `x-csrf-token` header. Get token from `GET /api/csrf-token`.

---

## 🔒 Security Features

### Authentication
- Session-based with HMAC-SHA256 signing
- Secure HTTP-only cookies
- Environment variable validation on startup

### Input Validation
- Zod schemas for all API inputs
- Type-safe request/response objects
- Thai error messages for validation failures

### API Security
- **CSRF Protection**: Token-based with timing-safe comparison
- **Rate Limiting**: 60 req/min (standard), 5 req/15min (login), 10 req/min (strict)
- **Error Responses**: Consistent format without sensitive data leakage
- **SQL Injection**: Prevented by Supabase RLS and parameterized queries

### Data Protection
- Supabase Row Level Security (RLS) policies
- No hardcoded credentials (environment variables required)
- Structured logging without sensitive data

---

## 📊 Performance Optimizations

### Database
- Pagination on all list endpoints (1-100 items per page)
- Query optimization guide in `lib/query-optimizer.ts`
- Batch operations for related data fetching
- N+1 query prevention patterns

### Frontend
- Server-side rendering with Next.js
- Component-level error boundaries
- Optimistic UI updates pattern
- Global loading state management
- Zustand state with localStorage persistence

### Caching
- Next.js automatic static optimization
- Selective data revalidation

---

## 🐛 Debugging

### Enable Detailed Logging
Set `DEBUG=*` or use advanced logger in code:

```typescript
import { useLogger } from 'lib/logger-advanced';

const log = useLogger('MyComponent');
log.info('User action', { userId: 123 });
```

### Check Error Boundaries
Errors in React components are caught by `ErrorBoundary` and `AsyncErrorBoundary` in the root layout. Check the browser console for detailed stack traces.

### API Error Responses
All API errors follow this format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { /* additional info */ },
  "timestamp": "2026-05-14T10:30:45.123Z"
}
```

---

## 🚦 Development Guidelines

### Code Style
- Follow ESLint rules in `.eslintrc.json`
- Use TypeScript strict mode
- Avoid `any` types - use proper types
- Write components as functional components with hooks

### State Management
- Use Zustand for global state
- Persist important state to localStorage
- Sync local state with server on critical updates

### Error Handling
- Use error classes from `lib/error-handler.ts`
- Throw specific errors (ValidationError, AuthError, etc.)
- Let centralized handler catch and respond consistently

### API Development
- Validate inputs with Zod schemas
- Check CSRF token for mutations
- Check rate limits
- Return consistent response format
- Log API operations with context

### Testing
- Write tests for critical paths
- Test error cases and edge cases
- Mock external dependencies
- Use integration tests for API routes

---

## 📋 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

---

## 🔄 Deployment

### Supabase Setup
1. Create a Supabase project
2. Run database migrations (schema defined in Supabase)
3. Set up RLS policies for data access

### Environment Setup
1. Copy `.env.example` to `.env.production.local`
2. Set all required environment variables
3. Ensure `AUTH_SECRET` is strong and unique

### Deployment Steps
```bash
# Build the project
pnpm build

# Test the build locally
pnpm start

# Deploy to your hosting platform
# (Vercel, Netlify, Docker, etc.)
```

### Production Checklist
- ✅ All environment variables set
- ✅ CSRF protection enabled
- ✅ Rate limiting configured
- ✅ Error boundaries active
- ✅ Logging system operational
- ✅ Database RLS policies in place
- ✅ HTTPS enforced
- ✅ Security headers configured

---

## 📞 Support

For issues, questions, or feature requests, open an issue on GitHub or contact the development team.

---

## 📄 License

This project is proprietary software. All rights reserved.

---

**Last Updated**: 2026-05-14  
**Version**: 1.0.0  
**Status**: Production Ready ✅

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YueFa (约发) - A mobile H5 platform for cosplay wig stylists to showcase portfolios, collect customer inquiries, and manage orders. Built as a pnpm monorepo with Vue 3 frontend and Express.js backend.

## Development Commands

```bash
# Install dependencies (from /codes directory)
pnpm install

# Development - run both frontend and backend
pnpm dev

# Run individual services
pnpm dev:web          # Frontend on :3000
pnpm dev:server       # Backend on :4000

# Testing
pnpm test             # Run all tests
pnpm --filter web test        # Frontend tests only
pnpm --filter server test     # Backend tests only

# Build
pnpm build
```

## Architecture

### Monorepo Structure
```
codes/
├── packages/
│   ├── web/      # Vue 3 + Vite + Vant 4 (mobile UI)
│   └── server/   # Express.js + sql.js (SQLite in-memory)
```

### Tech Stack
- **Frontend:** Vue 3, Vite, Pinia (state), Vant 4 (mobile components), Tailwind CSS
- **Backend:** Express.js, sql.js (SQLite), JWT auth, bcryptjs
- **Testing:** Vitest, Vue Test Utils, Supertest, Playwright (E2E)

### API Communication
- Frontend proxies `/api` to `http://localhost:4000`
- All backend routes prefixed with `/api/v1/`
- JWT tokens stored client-side for authentication

### Key User Flows
1. **Public:** `/s/:slug` - View stylist portfolio, submit inquiry
2. **Admin:** `/login` → `/admin/profile` → `/admin/works` → `/admin/orders`

### Backend Route Structure
```
/api/v1/auth       - SMS login, verification
/api/v1/users      - Profile management
/api/v1/works      - Portfolio CRUD
/api/v1/inquiries  - Customer form submissions
/api/v1/orders     - Order management
/api/v1/upload     - File uploads
/api/health        - Health check
```

### Database Models
Located in `packages/server/src/models/`:
- User, Work, Order, Inquiry, SmsCode

### Frontend State
Pinia stores in `packages/web/src/stores/` - user state management

## Business Documentation

Product requirements and architecture docs are in `/YueFa-business/` (Chinese):
- `产品需求文档PRD-MVP精简版.md` - MVP requirements
- `约发MVP系统架构与开发计划.md` - Architecture plan

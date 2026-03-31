# RetailPro SaaS - Product Requirements Document

## Original Problem Statement
Production-grade, secure, multi-tenant SaaS application for retail businesses (medical shops, hardware stores, wholesalers) with inventory management, billing (POS), reporting, subscription tiers, and Microsoft Authenticator-based MFA.

## Architecture
- **Backend**: Python FastAPI + MongoDB (motor async driver)
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI
- **Auth**: JWT (httpOnly cookies) + bcrypt + TOTP MFA
- **Payment**: Stripe (Emergent integration library)
- **AI**: OpenAI GPT-5.2 (Emergent LLM key) - planned for demand forecasting

## User Personas
- **OWNER**: Full access, subscription management, user/MFA management
- **MANAGER**: Inventory, POS, reports, user creation (staff only)
- **STAFF**: Basic inventory view, POS operations

## Core Requirements (Static)
1. Multi-tenant isolation via tenant_id on all collections
2. Role-based access control (OWNER, MANAGER, STAFF)
3. TOTP MFA with Microsoft Authenticator compatibility
4. MFA backup codes (8 single-use codes)
5. Subscription tiers (Basic $29, Standard $79, Premium $199)
6. Stripe hosted checkout for subscriptions
7. Audit logging for all actions

## What's Been Implemented (March 29, 2026)
### Phase 1 - MVP Complete
- [x] Auth system (login, register, JWT, refresh tokens, brute force protection)
- [x] TOTP MFA setup (QR code + manual key)
- [x] MFA verification during login
- [x] MFA backup codes (generate, login, regenerate)
- [x] Admin MFA reset for staff users
- [x] Multi-tenant data model with strict isolation
- [x] RBAC enforcement at API level
- [x] Inventory CRUD (products, categories, stock, batch tracking)
- [x] POS/Billing (cart, invoice creation, stock deduction, GST)
- [x] Dashboard with KPIs, revenue chart, recent invoices
- [x] Reports (sales, top products, date filters)
- [x] User management (create, update, delete, activate/deactivate)
- [x] Settings (shop details, MFA config, subscription plans)
- [x] Stripe checkout integration for plan upgrades
- [x] Audit logging for all actions
- [x] Low stock alerts
- [x] Collapsible sidebar navigation

### Phase 2 - AI Forecasting + Purchase Management (March 29, 2026)
- [x] AI Demand Forecasting (OpenAI GPT-5.2 via Emergent LLM key)
  - Revenue trend analysis (30 days)
  - Demand predictions per product
  - Restock recommendations with priority
  - Business insights
  - Revenue forecasts (weekly/monthly)
- [x] Purchase Management module
  - Supplier CRUD (add, list, delete)
  - Purchase order creation with multi-item support
  - Purchase receiving with stock auto-update
  - Status tracking (pending/partial/received)
  - GST calculation on purchases

### Phase 3 - Analytics Access Control Refactoring (March 31, 2026)
- [x] Moved admin-only analytics to Platform Admin panel
  - Customer insights & frequency distribution → Platform Admin only
  - API usage heatmap & feature breakdown → Platform Admin only
  - Real-time monitoring (live request log, active endpoints) → Platform Admin only
  - CSV export (revenue, API usage) → Platform Admin only
- [x] Owner/Manager analytics streamlined to: Overview, Revenue, Products tabs only
- [x] Backend endpoints updated with platform_admin access checks
- [x] Platform admin gets aggregated cross-tenant data


## Prioritized Backlog
### P0 (Critical - Next Sprint)
- [ ] Email recovery for MFA (SendGrid integration)
- [ ] Invoice PDF generation & print

### P1 (Important)
- [ ] Multi-branch support (Premium tier)
- [ ] Advanced reports (profit margins, category analysis)
- [ ] Batch & expiry tracking alerts
- [ ] Supplier-linked purchase analytics

### P2 (Nice to Have)
- [ ] API access for external integrations (Premium)
- [ ] Barcode scanner support
- [ ] Customer management & credit tracking
- [ ] Export data (CSV/Excel)
- [ ] Dark mode toggle

## Next Tasks
1. Implement AI demand forecasting using OpenAI GPT-5.2
2. Integrate SendGrid for MFA email recovery
3. Add purchase management module
4. Invoice PDF generation
5. Multi-branch support for Premium tier

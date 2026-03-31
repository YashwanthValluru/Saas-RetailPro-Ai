# RetailPro SaaS - Product Requirements Document

## Original Problem Statement
Production-grade, secure, multi-tenant SaaS application for retail businesses (medical shops, hardware stores, wholesalers, mall supermarkets, large-scale supermarkets) with inventory management, billing (POS), reporting, subscription tiers, Microsoft Authenticator-based MFA, and scalable architecture for businesses from single small shops to large supermarket chains. Must support 100K+ products per branch with high availability and low latency.

## Architecture
- **Backend**: Python FastAPI + MongoDB (motor async driver) — server.py (6,600+ lines)
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI — 35 pages (12,000+ lines)
- **Auth**: JWT (httpOnly cookies) + bcrypt + TOTP MFA + backup codes
- **Payment**: Stripe (Emergent integration library)
- **AI**: OpenAI GPT-5.2 (Emergent LLM key) — forecasting, substitution, pulse, refill predictions
- **Database**: MongoDB with 62+ indexes, tenant-scoped + branch-scoped isolation

## User Personas
- **OWNER**: Full access, subscription mgmt, user/MFA/branch management, staff branch assignment
- **MANAGER**: Inventory, POS, reports, user creation, analytics (branch-scoped if assigned)
- **STAFF**: POS operations, inventory view (ONLY assigned branch), can view cross-branch availability
- **PLATFORM ADMIN**: Cross-tenant management, analytics, admin CRUD
- **PRODUCT ADMIN**: Similar to platform admin

## Core Requirements (Static)
1. Multi-tenant isolation via tenant_id
2. Multi-branch support via branch_id (Premium) + centralized DB
3. Role-based access control (OWNER, MANAGER, STAFF, PLATFORM_ADMIN, ADMIN)
4. Staff branch assignment (view own branch, see all branch availability)
5. TOTP MFA with Microsoft Authenticator
6. Subscription tiers (Basic, Standard, Premium)
7. Stripe hosted checkout
8. Cross-branch product availability + transfer requests
9. Smart search with category auto-suggestions
10. Support 100K+ products per branch
11. Category hierarchy (unlimited nesting)

## What's Been Implemented

### Supermarket-Scale Features (Latest - Jan 2026)
- [x] Cross-branch product availability (search across all branches)
- [x] Transfer request system (create, list, approve/reject with auto stock update)
- [x] Staff branch assignment (OWNER assigns, staff sees own branch only)
- [x] Smart product search with auto-suggestions
- [x] Category breadcrumb navigation
- [x] Branch-filtered inventory endpoints
- [x] 12 new compound indexes for 100K+ product scale

### Phase 1 Features
- [x] Bug fix: access requests endpoint
- [x] Multi-branch CRUD (Premium)
- [x] Category hierarchy (unlimited nesting)
- [x] Bulk product upload (CSV, Excel, JSON)
- [x] Barcode label PDF generation

### Phase 2 Features
- [x] Advanced profit margin dashboard
- [x] Batch expiry alert system
- [x] Invoice email sending

### Phase 3 Features
- [x] Sales trends analytics (hourly/daily/weekday)
- [x] Customer RFM analysis (5-segment scoring)
- [x] Product performance scoring
- [x] Branch comparison analytics

### Core Features (Previously Implemented)
- [x] JWT auth, TOTP MFA, backup codes, brute-force protection
- [x] Inventory CRUD, stock adjustments, barcode lookup
- [x] POS billing, invoice PDF, digital receipts
- [x] Customer management, credit tracking
- [x] Purchase management, supplier CRUD
- [x] AI features (forecasting, substitution, pulse, refill predictions)
- [x] Premium features (promo codes, auto reorder, advance orders)
- [x] Platform admin panel
- [x] Security (CSRF, rate limiting, IP whitelisting, audit logs)
- [x] Data export (CSV/Excel)
- [x] Support ticket system

## Known Issues / Mocked
- Voice/SMS notifications: MOCKED
- Email notifications: Requires tenant SMTP configuration
- External preview URL routing: Platform infrastructure limitation

## Prioritized Backlog
### P0
- [ ] Real-time WebSocket sync across branches
- [ ] Twilio integration for SMS/voice

### P1
- [ ] ERP/Accounting/CRM API integrations
- [ ] PWA mobile wrapper for on-floor staff
- [ ] WhatsApp Business API
- [ ] Offline-capable POS for network outages

### P2
- [ ] Customer loyalty/rewards program
- [ ] Multi-language support
- [ ] Data encryption at rest

## Next Tasks
1. Real-time WebSocket inventory sync
2. ERP/Accounting/CRM API integrations
3. PWA mobile wrapper
4. Twilio SMS/Voice integration
5. Offline-capable POS

# RetailPro SaaS - Product Requirements Document

## Original Problem Statement
Production-grade, secure, multi-tenant SaaS application for retail businesses (medical shops, hardware stores, wholesalers, mall supermarkets, large-scale supermarkets) with inventory management, billing (POS), reporting, subscription tiers, Microsoft Authenticator-based MFA, and scalable architecture for businesses from single small shops to large supermarket chains.

## Architecture
- **Backend**: Python FastAPI + MongoDB (motor async driver) — server.py (6,300+ lines)
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI — 32 pages (10,000+ lines)
- **Auth**: JWT (httpOnly cookies) + bcrypt + TOTP MFA + backup codes
- **Payment**: Stripe (Emergent integration library)
- **AI**: OpenAI GPT-5.2 (Emergent LLM key) — forecasting, substitution, pulse, refill predictions
- **Database**: MongoDB with 50+ indexes, tenant-scoped + branch-scoped isolation

## User Personas
- **OWNER**: Full access, subscription management, user/MFA management, branch management
- **MANAGER**: Inventory, POS, reports, user creation (staff only), analytics
- **STAFF**: Basic inventory view, POS operations
- **PLATFORM ADMIN**: Cross-tenant management, analytics, admin CRUD
- **PRODUCT ADMIN**: Similar to platform admin but without platform admin CRUD

## Core Requirements (Static)
1. Multi-tenant isolation via tenant_id on all collections
2. Multi-branch support via branch_id (Premium)
3. Role-based access control (OWNER, MANAGER, STAFF, PLATFORM_ADMIN, ADMIN)
4. TOTP MFA with Microsoft Authenticator compatibility
5. MFA backup codes (8 single-use codes)
6. Subscription tiers (Basic ₹999, Standard ₹2999, Premium ₹7999)
7. Stripe hosted checkout for subscriptions
8. Audit logging for all actions
9. Category hierarchy support (unlimited nesting)
10. Scalability for large datasets (thousands to millions of products)

## What's Been Implemented (Jan 2026)

### Phase 1 — Bug Fix + Multi-Branch + Categories + Bulk Upload + Barcode
- [x] Fixed access requests bug (query variable undefined)
- [x] Multi-branch CRUD (Premium) — create, update, delete, stats
- [x] Branch product transfer
- [x] Category hierarchy — unlimited nesting, tree & flat views
- [x] Bulk product upload (CSV, Excel, JSON — up to 10K products)
- [x] Bulk upload templates (CSV, Excel, JSON download)
- [x] Barcode label PDF generation (Code128, 3 sizes, multi-copy)

### Phase 2 — Advanced Analytics + Invoice Email
- [x] Advanced profit margin dashboard (period comparison, category breakdown)
- [x] Batch expiry alert system (4-tier severity)
- [x] Invoice email sending (HTML email via tenant SMTP)

### Phase 3 — Supermarket-Scale Analytics
- [x] Sales trends (hourly, daily, weekday patterns)
- [x] Peak hour/day detection
- [x] Customer RFM analysis (5-segment scoring)
- [x] Product performance scoring (velocity, margin, score 0-100)
- [x] Slow-mover detection
- [x] Branch comparison analytics
- [x] Database indexes for all new collections (8 new indexes)

### Previously Implemented
- [x] JWT auth, TOTP MFA, backup codes, brute-force protection
- [x] Inventory CRUD, stock adjustments, barcode lookup
- [x] POS billing, invoice PDF, digital receipts
- [x] Customer management, credit tracking
- [x] Purchase management, supplier CRUD
- [x] AI features (forecasting, substitution, pulse, refill predictions)
- [x] Premium features (promo codes, auto reorder, advance orders)
- [x] Platform admin panel (tenant/admin management)
- [x] Security (CSRF, rate limiting, IP whitelisting, audit logs)
- [x] Data export (CSV/Excel)
- [x] Support ticket system

## Known Issues / Mocked
- Voice notifications: MOCKED (no Twilio)
- SMS sending: MOCKED (WhatsApp link only)
- Email notifications: Requires tenant SMTP configuration
- Stripe webhooks: Handler exists, needs prod testing

## Prioritized Backlog
### P0 (Critical)
- [ ] Twilio integration for SMS/voice
- [ ] Real-time WebSocket sync across branches

### P1 (Important)
- [ ] ERP/Accounting/CRM API integrations
- [ ] WhatsApp Business API integration
- [ ] PWA wrapper for mobile-first use
- [ ] Barcode label batch printing from mobile

### P2 (Nice to Have)
- [ ] Customer loyalty/rewards program
- [ ] Multi-language support
- [ ] Data encryption at rest
- [ ] Advanced batch expiry alert notifications

## Next Tasks
1. ERP/Accounting/CRM API integrations (user deferred)
2. Twilio integration for real SMS/voice
3. Real-time WebSocket inventory sync
4. PWA mobile wrapper
5. WhatsApp Business API automation

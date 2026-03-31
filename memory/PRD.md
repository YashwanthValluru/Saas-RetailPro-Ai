# RetailPro SaaS - Product Requirements Document

## Original Problem Statement
Production-grade, secure, multi-tenant SaaS application for retail businesses (medical shops, hardware stores, wholesalers) with inventory management, billing (POS), reporting, subscription tiers, and Microsoft Authenticator-based MFA.

## Architecture
- **Backend**: Python FastAPI + MongoDB (motor async driver) — single server.py (5,321 lines)
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI — 25 pages (8,728 lines)
- **Auth**: JWT (httpOnly cookies) + bcrypt + TOTP MFA + backup codes
- **Payment**: Stripe (Emergent integration library)
- **AI**: OpenAI GPT-5.2 (Emergent LLM key) — forecasting, substitution, pulse, refill predictions
- **Database**: MongoDB with 42+ indexes, tenant-scoped isolation

## User Personas
- **OWNER**: Full access, subscription management, user/MFA management
- **MANAGER**: Inventory, POS, reports, user creation (staff only)
- **STAFF**: Basic inventory view, POS operations
- **PLATFORM ADMIN**: Cross-tenant management, analytics, admin CRUD
- **PRODUCT ADMIN**: Similar to platform admin but without platform admin CRUD

## Core Requirements (Static)
1. Multi-tenant isolation via tenant_id on all collections
2. Role-based access control (OWNER, MANAGER, STAFF, PLATFORM_ADMIN, ADMIN)
3. TOTP MFA with Microsoft Authenticator compatibility
4. MFA backup codes (8 single-use codes)
5. Subscription tiers (Basic ₹999, Standard ₹2999, Premium ₹7999)
6. Stripe hosted checkout for subscriptions
7. Audit logging for all actions

## What's Been Implemented (Comprehensive Audit - Jan 2026)

### Authentication & Security
- [x] JWT auth (httpOnly cookies, access + refresh tokens)
- [x] Registration (restricted after first tenant)
- [x] Login with brute-force protection (5 attempts → 15-min lockout)
- [x] TOTP MFA (QR + manual key), backup codes
- [x] Admin MFA reset, IP whitelisting, temp access grants
- [x] CSRF protection, security headers, rate limiting
- [x] Idle timeout auto-logout, heartbeat
- [x] 3 seeded accounts (Admin OWNER, Platform Admin, Product Admin)

### Inventory
- [x] Product CRUD (SKU, barcode, category, GST, HSN, batch, expiry)
- [x] Stock adjustments, low-stock alerts, expiry alerts
- [x] Barcode lookup (local → UPCitemdb → Open Food Facts)
- [x] Smart product recommendations, AI substitution (GPT-5.2)

### POS / Billing
- [x] Invoice creation with GST, stock deduction, auto-numbering
- [x] Invoice PDF generation (ReportLab A4)
- [x] Digital receipts with share links, WhatsApp sharing
- [x] Public receipt page, promo code validation
- [x] Mobile barcode scanner (session-based, QR access)

### Customer Management
- [x] Customer CRUD, credit tracking, transaction history
- [x] Customer-linked invoices, export (CSV/Excel)

### Purchase Management
- [x] Supplier CRUD, purchase orders, receiving with stock update
- [x] Status tracking (pending/partial/received)

### Reports & Analytics
- [x] Dashboard KPIs, 7-day revenue chart
- [x] Sales, profit margins, category analysis, purchase analytics
- [x] Owner/Manager analytics (Overview, Revenue, Products)
- [x] Platform Admin analytics (cross-tenant, API usage, realtime)
- [x] AI Business Pulse (daily briefing via GPT-5.2)

### Premium Features
- [x] Promo codes, auto reorder, notification templates
- [x] Advance payment orders, SMTP email settings
- [x] API keys for external access

### Platform Admin
- [x] Tenant CRUD, owner creation, admin CRUD
- [x] Financial access request system
- [x] Cross-tenant analytics, support ticket management

### Data Export
- [x] Inventory, invoices, customers, audit logs (CSV/Excel)
- [x] Analytics export (admin only)

### Security & Compliance
- [x] Fraud detection alerts, audit logging (immutable)
- [x] User activity monitoring, cache stats

### AI Features (GPT-5.2 via Emergent LLM)
- [x] Demand forecasting, smart substitution
- [x] Business pulse, refill predictions

## Known Issues
- Voice notifications are MOCKED (no Twilio)
- SMS sending is MOCKED (WhatsApp link only)
- Access requests endpoint has potential undefined variable bug (line 3211)
- Registration restricted — admin-only after first tenant

## Prioritized Backlog
### P0 (Critical)
- [ ] Fix access requests bug (line 3211)
- [ ] Twilio integration for SMS/voice

### P1 (Important)
- [ ] Multi-branch support (Premium tier)
- [ ] Invoice email sending
- [ ] WhatsApp Business API integration
- [ ] Barcode label printing

### P2 (Nice to Have)
- [ ] Customer loyalty/rewards program
- [ ] Advanced batch expiry alert dashboard
- [ ] Mobile-first PWA wrapper

## Next Tasks
1. Fix access requests endpoint bug
2. Add real SMS/voice via Twilio
3. Multi-branch support for Premium tier
4. Invoice email/print enhancements
5. WhatsApp Business API for automated notifications

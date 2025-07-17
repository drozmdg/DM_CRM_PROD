# 📑 Weekly Task Breakdown – 10-Week Green-Field CRM Build  
### *Version 1.0 – in-house JWT Auth, based on PLAN.md + project docs*

> **How to use**  
> • Copy each week’s checklist into your tracker (Jira, Linear, GitHub Projects, etc.).  
> • Mark ✅ / ❌ as tasks move to “Done”.  
> • Unassigned tasks default to the functional lead (BE, FE, DB, DevOps, QA, or PM).

---

## Week 0 ▪ Kick-off & Discovery

| # | Task | Owner |
|---|------|-------|
| 0.1 | Hold stakeholder workshop – lock MVP scope, success metrics | PM |
| 0.2 | Event-storm entities & user stories (process pipeline, 360°, risk radar) | PM + Tech Lead |
| 0.3 | Create repo root `/docs/` folder and drop: `PLAN.md`, `DATABASE_SCHEMA.md`, “legacy” assessment report | Tech Lead |
| 0.4 | Spin up Jira/Linear board ➜ import epics & this task list | PM |
| 0.5 | Schedule 1-day arch review for Week 1 Day 1 | PM |
| 0.6 | Collect compliance constraints (GDPR, audit retention) into `docs/compliance.md` | PM |

---

## Week 1 ▪ Architecture + Data-Model Spike

| # | Task | Owner | Est. |
|---|------|-------|-----|
| 1.1 | Prototype LocalStrategy `/auth/login` endpoint (NestJS) | BE A | 1 d |
| 1.2 | Prototype JwtStrategy + `AuthGuard` | BE A | 0.5 d |
| 1.3 | Decide cookie vs. header storage (spike) & ADR-01 | BE A + FE E | 0.5 d |
| 1.4 | Draft Prisma schema incl. `users`, `roles`, `permissions`, `user_refresh_tokens`, `process_feed_health`, `process_tasks`, `risks` | DB L | 1 d |
| 1.5 | Generate **Migration 0** & apply to dev DB | DB L | 0.5 d |
| 1.6 | Scaffold monorepo (PNPM workspaces) with `apps/web`, `apps/api`, `packages/shared` | DevOps |
| 1.7 | Set up CI job: lint, type-check, Jest, Storybook build | DevOps |
| 1.8 | Install Storybook + shadcn/ui; publish design-tokens page | FE E |
| 1.9 | Create dummy data fixtures for Exponent/MMIT feed | QA |
| 1.10 | Security review of auth flow (rate-limit, argon2 params) | Security |

---

## Week 2 ▪ Repo Skeleton & Tooling

| # | Task | Owner |
|---|------|-------|
| 2.1 | Add `apps/api/src/auth/` module skeleton (strategies, guards, decorators, DTOs) | BE A |
| 2.2 | Add `apps/web/lib/auth/` (session handler, `useAuth` hook) | FE E |
| 2.3 | Configure GraphQL codegen – shared hooks/types | BE A |
| 2.4 | Create `docker-compose.yml` (Postgres, Redis, MinIO, API, Web) | DevOps |
| 2.5 | Helm chart + Terraform skeleton for dev K3s / AWS EKS | DevOps |
| 2.6 | CI secrets management (JWT secret, S3 creds) via GitHub Actions OIDC + Vault | DevOps |
| 2.7 | Storybook: add Button, Input, Card, Badge components | FE E |
| 2.8 | Add Husky pre-commit (lint + prettier) | All |
| 2.9 | Draft API contract stubs (OpenAPI & GraphQL SDL) for `/auth/*`, `/customers`, `/contacts` | BE B |

---

## Week 3 ▪ Sprint 1 Kick-off  
### *Auth & Customer Foundations*

| # | Task | Owner |
|---|------|-------|
| 3.1 | `/auth/register` endpoint + Argon2 hashing + email confirm token | BE B |
| 3.2 | `/auth/login`, `/auth/logout`, `/auth/refresh` finished w/ cookies | BE A |
| 3.3 | `/users` CRUD (admin only) + RolesGuard | BE B |
| 3.4 | Unit tests – failed-login lockout & rate-limit | QA |
| 3.5 | Front-end Sign-in / Register pages (React-Hook-Form + zod) | FE E |
| 3.6 | Auth context provider + auto-refresh hook | FE E |
| 3.7 | Customers schema resolvers (CRUD) + basic search | BE A |
| 3.8 | Contacts CRUD (nested under Customer) | BE B |
| 3.9 | Front-end Dashboard v0 – header, sidebar nav, empty KPI cards | FE F |
| 3.10 | Playwright E2E: happy path sign-in, list customers | QA |
| 3.11 | CI gate: ≥60 % unit test coverage | DevOps |

---

## Week 4 ▪ Sprint 1 Wrap-up / Hardening

| # | Task | Owner |
|---|------|-------|
| 4.1 | Rate-limit `/auth/*` via Redis store (express-rate-limit) | BE A |
| 4.2 | CSRF token middleware for credential forms | BE A |
| 4.3 | Activity Feed base schema + emit auth events | BE B |
| 4.4 | Storybook docs for Auth pages & Customer list | FE E |
| 4.5 | Accessibility audit of Sign-in + Dashboard v0 | QA |
| 4.6 | **Sprint Review / Retrospective** – demo sign-in + customer CRUD | Team |

---

## Week 5 ▪ Sprint 2 Kick-off  
### *Teams, Processes, Tasks*

| # | Task | Owner |
|---|------|-------|
| 5.1 | Teams CRUD + relation to Customer | BE A |
| 5.2 | Processes CRUD (status, SDLC, due date, functional_area) | BE A |
| 5.3 | `process_team` M-N resolver & Prisma hooks | BE B |
| 5.4 | Process Tasks API (kanban fields + % complete) | BE B |
| 5.5 | Feed-Health ingest worker (cron -> `process_feed_health`) | BE C |
| 5.6 | UI: Implementation Pipeline – swim-lane board (dummy data) | FE F |
| 5.7 | UI: Process 360° skeleton – Overview + Tasks tab | FE E |
| 5.8 | Jest unit tests for Tasks percent-complete calc | QA |
| 5.9 | k6 script: 50 rps on Processes endpoints | QA |
| 5.10 | Update OpenAPI & GraphQL docs | BE A |

---

## Week 6 ▪ Sprint 2 Wrap-up

| # | Task | Owner |
|---|------|-------|
| 6.1 | SLA countdown calc on Processes (Postgres view) | DB L |
| 6.2 | Front-end Pipeline – SLA badges, risk pill placeholder | FE F |
| 6.3 | Storybook: Card, Badge, Modal polished | FE E |
| 6.4 | Security pen-test on auth endpoints (ZAP / Burp) | Security |
| 6.5 | Sprint Review: demo Pipeline board drag-and-drop | Team |

---

## Week 7 ▪ Sprint 3 Kick-off  
### *Documents, Notes, Important Dates, Risks, Activity Feed, AI Module*

| # | Task | Owner |
|---|------|-------|
| 7.1 | S3 signed-URL upload + versioning for Docs | BE C |
| 7.2 | Customer Notes CRUD + Markdown support | BE B |
| 7.3 | Important Dates CRUD + reminder scheduler (cron) | BE C |
| 7.4 | Risks CRUD (severity, mitigation owner) | BE A |
| 7.5 | Activity Feed stream emitters for Tasks, Docs, Risks | BE B |
| 7.6 | Front-end: Risk Radar widget (heat-map) | FE F |
| 7.7 | Front-end: Process 360° – Data Feeds & Risks tabs | FE E |
| 7.8 | AI Context Service – assemble prompt fragments | BE C |
| 7.9 | Streaming `/v1/ai/chat` endpoint (SSE) | BE C |
| 7.10 | Chat UI hook with optimistic scroll | FE E |
| 7.11 | Unit tests for AI PII scrub filter | QA |

---

## Week 8 ▪ Buffer / AI Polish / Integration QA

| # | Task | Owner |
|---|------|-------|
| 8.1 | TOTP MFA (feature-flag) – stretch goal | BE A |
| 8.2 | Seed synthetic Processes + feed-health + risks | QA |
| 8.3 | System-wide E2E: create customer → process → release | QA |
| 8.4 | k6 load test: 2 M feed-health events/h via Redis | QA |
| 8.5 | UX polish pass – spacing, focus rings, colour contrast | FE team |
| 8.6 | Performance audit (Lighthouse) | FE E |
| 8.7 | Sprint Review: demo AI Assistant answering “show at-risk processes this week” | Team |

---

## Week 9 ▪ UAT & Hardening

| # | Task | Owner |
|---|------|-------|
| 9.1 | Deploy to staging K8s (blue-green) | DevOps |
| 9.2 | Run full Playwright regression suite on staging | QA |
| 9.3 | Pen-test critical paths; remediate CVEs | Security |
| 9.4 | Final accessibility re-audit (WCAG AA) | QA |
| 9.5 | Prepare runbooks: on-call, incident, backup/restore | DevOps |
| 9.6 | Draft SLO dashboards (Prometheus + Grafana) | DevOps |
| 9.7 | **UAT sign-off meeting** with stakeholders | PM |

---

## Week 10 ▪ Go-Live & Handover

| # | Task | Owner |
|---|------|-------|
| 10.1 | Production DNS switch (blue-green) | DevOps |
| 10.2 | Run smoke tests; auto-rollback gate | QA |
| 10.3 | 24-h hyper-care on-call schedule | PM |
| 10.4 | Export final ADRs & Deployment Guide (JWT auth) | Tech Lead |
| 10.5 | Record KT session + upload to Confluence | PM |
| 10.6 | Post-go-live retro (collect action items) | Team |

---

### Legend
* **BE** – Backend developer  
* **FE** – Front-end developer  
* **DB L** – Database lead  
* **DevOps** – DevOps/Infrastructure engineer  
* **QA** – Quality engineer  
* **Security** – AppSec/Infosec engineer  
* **PM** – Project manager / Scrum master  
* **Tech Lead** – Lead architect / staff engineer

---

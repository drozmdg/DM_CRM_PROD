# 📋 Green-Field Implementation Plan (Option B)  
### Production-grade CRM built **from scratch** with an **in-app JWT Auth system**

This replaces the original Keycloak-based plan. Timeline remains **10 weeks**.

---

## 0  Kick-off & Discovery  (Week 0)

| Step | Outputs |
|------|---------|
| Stakeholder workshop | • Lock MVP scope (Customers, Sales Teams, Processes, Contacts, Docs, AI assistant).<br>• Definition-of-Done & success metrics (99.9 % uptime, <1 h TTR, ≥80 % test coverage). |
| Domain walk-through | • Event-storm core entities & user stories (process pipeline, process 360°, risk radar). |

---

## 1  High-Level Architecture  (Week 1)

| Layer | Tech stack | Rationale |
|-------|------------|-----------|
| **Frontend** | **Next.js 14 (App Router)**, React 18, TypeScript, Tailwind CSS, shadcn/ui | SSR for public pages, client components for app; matches PRD UI tech. |
| **Backend** | **NestJS (Node 18)** with GraphQL **+ REST gateway** | Opinionated DI, modular, easy testing; GraphQL = typed hooks for React Query. |
| **Database** | **PostgreSQL 15** + **Prisma ORM** | Prisma migrations = single source of truth; aligns with `DATABASE_SCHEMA.md`. |
| **AuthN / AuthZ** | In-house **NestJS AuthModule** using `passport-local`, `@nestjs/jwt`, `argon2id` hashing | Removes external IdP; JWT cookies (15 min) + refresh tokens (7 days). |
| **RBAC** | `roles`, `permissions`, `user_roles` tables + NestJS `RolesGuard` + Prisma row policies | Fine-grained access; tenant isolation on `customer_id`. |
| **Real-time** | **Redis Streams** → NestJS event bus | Activity feed & feed-health events. |
| **File storage** | S3-compatible bucket (MinIO dev, AWS S3 prod) | Documents & artefacts. |
| **AI Assistant** | Service-to-service call to OpenAI / local LLM via LangChain; dynamic prompt service | Mirrors AI guide while isolating LLM. |
| **DevOps** | GitHub Actions → Docker → Kubernetes (K3s dev, EKS prod) | Blue-green deploys, horizontal scaling. |

---

## 2  Data-Model Blueprint  (Week 1)

* Migration 0 adds baseline ERD + auth tables:  

  * `users`, `roles`, `permissions`, `user_roles`, `user_refresh_tokens`  
  * `process_feed_health`, `process_tasks`, `risks`

* Keep enums: `customer_phase`, `sdlc_stage`, `process_status`, `risk_severity`.

* Soft-delete (`deleted_at`) on every root entity.

---

## 3  Project Skeleton & Tooling  (Week 2)

| Area | Tasks |
|------|-------|
| Monorepo | PNPM workspace: `apps/web`, `apps/api`, `packages/shared`. |
| Auth module | `apps/api/src/auth` scaffold (LocalStrategy, JwtStrategy, guards, decorators). |
| CI pipeline | Lint, type-check, test, build, Docker-compose up; block merge on red. |
| Coding standards | ESLint, Prettier, Husky, Conventional Commits. |
| Storybook | UI components in isolation. |
| GraphQL codegen | Shared hooks/types incl. `feedHealth`, `risks`. |

---

## 4  Backend Feature Sprints (Weeks 3-6)

| Sprint | Epics Delivered |
|--------|-----------------|
| **S-1 (W 3-4)** | • **Auth & User CRUD** (`/auth/*`, `/users`).<br>• Customers & Contacts API.<br>• **Feed-Health ingest micro-service** (upsert `process_feed_health`). |
| **S-2 (W 4-5)** | • Teams, Services, Processes APIs.<br>• **Process ⇄ Team** M-N join.<br>• **Process Tasks** CRUD & %-complete calc. |
| **S-3 (W 5-6)** | • Documents & Notes (S3 signed URLs, versioning).<br>• Important Dates & reminders.<br>• **Risks** CRUD.<br>• Activity Feed via Redis Streams. |

_All endpoints include Zod validation; OpenAPI + GraphQL schemas auto-generated._

---

## 5  Frontend Feature Sprints (Weeks 3-7, parallel)

| Epic | Key Screens |
|------|-------------|
| Core dashboard | KPI cards, Process Health Board (status + feed-health pill), Activity Feed. |
| Implementation Pipeline | Swim-lane view (SDLC columns, SLA countdown, risk badges). |
| Process 360° | Tabs: Overview, Tasks (kanban), Data Feeds (last arrival, delta %), Risks, Docs. |
| Search & Global Nav | Fuzzy search; quick-filter chip “At Risk”. |
| Auth pages | Sign-in, Register, Password Reset (Next.js + React-Hook-Form). |

Accessibility audit each sprint.

---

## 6  AI Assistant Module  (Weeks 6-7)

* **Context Service** in NestJS assembles prompt incl. feed-health + risk summary.  
* Streaming endpoint `/v1/ai/chat` (SSE / WebSocket).  
* React hook for chat UI with optimistic scroll.  
* PII scrub filter.

---

## 7  Cross-Cutting Concerns

| Concern | Implementation |
|---------|----------------|
| Security | Helmet, `express-rate-limit` (+ Redis), CSRF token on auth forms, Argon2 hashing, lockout after 5 fails. |
| Error handling | NestJS global filters → RFC 7807 Problem JSON. |
| Observability | OpenTelemetry → Grafana Tempo (traces), Loki (logs), Prometheus (metrics). |
| Testing | Jest unit ≥80 % lines; Playwright E2E (happy paths); CI gates. |

---

## 8  Data Migration / Seeding (Week 8)

* Optionally ETL demo Supabase data → new schema.  
* Always seed synthetic feed-health, tasks, risks for QA.

---

## 9  UAT & Hardening (Week 9)

* Staging cluster freeze; load-test (k6 floods 2 M feed-health events/h).  
* Pen-test; fix critical CVEs.  
* UX polish, accessibility re-audit.

---

## 10  Go-Live & Handover (Week 10)

| Step | Detail |
|------|--------|
| DNS switch | Blue-green K8s deployment. |
| Smoke tests | Automated E2E suite; rollback gate. |
| Hyper-care | 24 h dev on-call; daily stand-ups for one week. |
| Docs & KT | Runbooks, SLOs, ADRs, updated Deployment Guide (JWT auth, Prisma). |

---

## 📅 Timeline at a Glance

W0 Discovery
W1 Arch + Data-model
W2 Repo + CI skeleton
W3 BE S-1 (Auth, Cust/Contact) | FE S-1 (Dashboard v0)
W4 BE S-1 cont. | FE S-1 cont.
W5 BE S-2 (Team/Process/Tasks) | FE S-2 (Pipeline, Process 360°)
W6 BE S-3 (Docs/Risks) | FE S-3 (Risk Radar, Docs)
W7 AI module + Buffer
W8 Data migration + QA
W9 UAT / Hardening
W10 Go-Live & Handover


---

## Key Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Password/MFA complexity | Argon2, rate-limit, lockout; MFA feature-flagged Week 7. |
| Scope creep (new dashboards) | Change-control board; pipeline & 360° locked for MVP. |
| LLM cost / latency | Feature flag for local model vs OpenAI. |
| Data migration surprises | Dry-run in Week 8 with checksum validation. |

---

## Outcome

* **Full green-field CRM** meets every functional & non-functional PRD requirement.  
* In-house JWT auth eliminates external IdP overhead while keeping security best practices.  
* Clean, modular codebase with automated CI/CD, observability and robust test coverage — ready to expand into analytics, mobile, or customer portal features.

---

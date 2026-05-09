# Maternal & Child Health System
### อาริฟ คลินิก — Arif Clinic

A full-stack digital health system that replaces the paper **Maternal and Child Health Handbook (สมุดสุขภาพแม่และเด็ก พ.ศ. 2568)** with a multi-platform app.

---

## Platforms

| Platform | Tech | Who Uses It |
|---|---|---|
| LINE OA + LIFF | LINE Messaging API | Patients |
| Mobile App | Flutter (iOS + Android) | Patients |
| Web Portal | Next.js 15 | Clinic Staff |
| REST API | Node.js + Hono | All |

---

## Monorepo Structure

```
arif-clinic/
├── apps/
│   ├── api/          # Hono REST API (Node.js + TypeScript)
│   ├── web/          # Next.js staff portal + LIFF
│   └── mobile/       # Flutter iOS/Android (coming soon)
├── packages/
│   ├── db/           # Drizzle ORM schema + migrations
│   ├── types/        # Shared TypeScript types
│   ├── ui/           # Shared React components
│   └── ...           # eslint-config, typescript-config
```

---

## Prerequisites

- **Node.js** 20+
- **npm** 10+
- **PostgreSQL** 16 (or a free [Railway](https://railway.app) database)
- **Flutter** 3.x (for mobile, later)

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/KitCJX/maternal-health-system.git
cd maternal-health-system
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in:
- `DATABASE_URL` — your PostgreSQL connection string from Railway
- `JWT_SECRET` — any long random string (e.g. `openssl rand -base64 32`)
- `LINE_*` — from [LINE Developers Console](https://developers.line.biz) (can leave blank for now)

### 3. Run database migrations

```bash
cd packages/db
npm run db:push      # pushes schema to your database
```

### 4. Start development servers

```bash
# From repo root — starts API + Web in parallel
npm run dev
```

- API → http://localhost:8080
- Web → http://localhost:3000
- Health check → http://localhost:8080/health

---

## What's Built So Far (Phase 0 — partial)

- [x] Turborepo monorepo scaffold
- [x] Hono API with CORS + health check (`apps/api`)
- [x] Complete database schema — 21 tables covering all handbook modules (`packages/db/src/schema.ts`)
- [x] Shared types package (`packages/types`)

---

## What to Build Next

### Phase 0 — Finish Foundation

> Complete these before moving to Phase 1. Both teacher and student work on these together.

**Backend (`apps/api`)**
- [ ] Set up Drizzle migrations and push schema to Railway PostgreSQL
- [ ] `POST /auth/register` — staff registration (name, email, password, role)
- [ ] `POST /auth/login` — returns JWT
- [ ] `GET /auth/me` — returns current user from JWT
- [ ] Auth middleware — validates JWT on protected routes
- [ ] LINE Login callback endpoint — links LINE uid to patient account

**Web (`apps/web`)**
- [ ] Install shadcn/ui + Tailwind (`npx shadcn@latest init`)
- [ ] Login page (`/login`) — email + password form
- [ ] Protected layout — redirects to `/login` if no JWT
- [ ] Basic dashboard shell — sidebar, header, empty content area

**DevOps**
- [ ] Deploy API to Railway (free tier)
- [ ] Deploy Web to Vercel (free)
- [ ] GitHub Actions CI — runs `tsc` + `eslint` on every push

**Academic deliverable:** ER diagram + OpenAPI spec

---

### Phase 1 — Patient & Pregnancy Core

> After Phase 0 auth is working.

**Backend**
- [ ] `POST /patients` — register patient (HN, name, DOB, ID card, phone)
- [ ] `GET /patients` — list all patients (paginated, searchable by HN/name)
- [ ] `GET /patients/:id` — patient detail with active pregnancy
- [ ] `POST /patients/:id/pregnancies` — register pregnancy (LMP → auto-calc EDD, GA)
- [ ] `POST /pregnancies/:id/visits` — record antenatal visit (BP, weight, FHR, GA, notes)
- [ ] `POST /pregnancies/:id/risks` — save 27-factor risk assessment (R01–R27)

**Web**
- [ ] Patient list page — table with HN, name, EDD, risk flags
- [ ] Patient registration form
- [ ] Pregnancy detail page — visit history timeline
- [ ] Antenatal visit form — BP, weight, FHR, gestational age, notes
- [ ] Risk assessment form — 27 checkboxes + notes (1st visit only)

**LINE / Patient side**
- [ ] LIFF page: patient can view their own pregnancy record
- [ ] LIFF page: upcoming appointment card

**Academic deliverable:** REST API design doc, tested Postman collection

---

### Phase 2 — Lab & Screening (Week 6–7)

- Lab results: CBC, blood type, HIV, HBsAg, VDRL, rubella
- GDM screening: 50g GCT / 75g OGTT / 100g OGTT
- Ultrasound records + image upload (Cloudflare R2)
- Maternal vaccines: Tdap/aP, dT with lot/expiry tracking
- Auto-flag abnormal results

---

### Phase 3 — Growth Charts (Week 8–9)

- Weight gain charts (4 BMI categories, handbook curves)
- Child growth charts (weight-for-age, height-for-age, WHO z-scores)
- Recharts on web, fl_chart on Flutter

---

### Phase 4 — Vaccinations (Week 10–11)

- EPI vaccination schedule (Thailand MoPH)
- Vaccination record with lot/expiry
- Missed vaccine alerts via LINE

---

### Phase 5 — Developmental Screening (Week 12–13)

- DSPM at 9 / 18 / 30 / 42 / 60 months
- DAIM for high-risk infants (birth weight < 2500g, hypoxia)
- Result classification + referral flags

---

### Phase 6 — Mental Health & Screening (Week 14–15)

- EPDS postnatal depression screening (10 questions, score ≥ 13 = risk)
- Alcohol use screening
- Dental records (pregnancy + child)

---

### Phase 7 — Notifications & Appointments (Week 16–17)

- Appointment scheduling
- LINE push notifications (appointment reminders, abnormal results)
- Rich menu setup in LINE OA

---

### Phase 8 — Patient Education Content (Week 18–19)

- Kick count diary (patient-entered, 3× daily)
- Emergency first aid guide (offline in Flutter)
- Breastfeeding + nutrition guides

---

### Phase 9 — PDPA & Production Hardening (Week 20–22)

- Consent management (patient consent before data collection)
- Audit log on all PHI access
- Data export / deletion rights
- Security review, penetration test
- Deploy to Thai cloud (NIPA Cloud) if needed for compliance

---

## Branch Strategy

```
main                  ← stable, always deployable
├── phase/0-auth      ← teacher works here first
├── feature/patient-registration
├── feature/antenatal-visits
└── ...
```

Students fork the repo, create a branch, and open a PR against `main`.

---

## Tech Stack Reference

| Layer | Technology |
|---|---|
| API | Node.js + TypeScript + [Hono](https://hono.dev) |
| ORM | [Drizzle ORM](https://orm.drizzle.team) |
| Web | [Next.js 15](https://nextjs.org) App Router + [shadcn/ui](https://ui.shadcn.com) |
| Mobile | Flutter 3.x + Riverpod |
| Database | PostgreSQL 16 ([Railway](https://railway.app)) |
| File Storage | Cloudflare R2 |
| Auth | JWT + LINE Login OAuth 2.0 |
| LINE | Messaging API + LIFF |

# Timeflux — ITS Timesheet Workflow System

AI-assisted internal timesheet management for the Division of Information Technology and Services.

---

## What This App Does

Timeflux automates the weekly timesheet lifecycle using an AI-guided interview + multi-agent LangGraph workflow. Employees answer guided questions; an AI structures their responses into a timesheet; it is reviewed by a Manager then Gwen before final approval.

**Full lifecycle:**
1. Employee registers → profile stored in DB
2. Employee starts a timesheet → AI interview begins
3. AI asks guided questions about hours, leave, overtime
4. AI converts answers to a structured draft
5. Employee reviews and submits
6. Manager reviews → approves or requests correction
7. If approved by Manager → Gwen reviews
8. Both approved → timesheet is finalized
9. All parties see live status on their dashboards
10. Full audit trail and version history preserved

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Next.js App Router                       │
│  ┌──────────┐  ┌────────────┐  ┌───────────┐  ┌────────────┐   │
│  │ Auth     │  │ Dashboards │  │ Timesheets│  │ Approvals  │   │
│  │ (login/  │  │ (employee/ │  │ (interview│  │ (manager/  │   │
│  │  register)│ │  manager/  │  │  /review) │  │  gwen)     │   │
│  └──────────┘  │  executive)│  └───────────┘  └────────────┘   │
│                └────────────┘                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                     API Routes (Next.js)
                              │
          ┌───────────────────┼────────────────────┐
          │                   │                    │
  ┌───────────────┐  ┌─────────────────┐  ┌──────────────┐
  │  LangGraph    │  │   Services      │  │  Prisma ORM  │
  │  Workflow     │  │  (user,         │  │  (PostgreSQL)│
  │  Graphs       │  │   timesheet,    │  └──────────────┘
  └───────────────┘  │   approval,     │
          │          │   notification, │
  ┌───────────────┐  │   audit)        │
  │  OpenAI       │  └─────────────────┘
  │  gpt-4o       │
  └───────────────┘
```

---

## LangGraph Multi-Agent Design

All graphs are **invoked per HTTP request** (stateless, Vercel-compatible). Workflow state persists in PostgreSQL between invocations.

### Graph 1: Registration Workflow
```
START → [registration_agent] → [profile_validation_agent] → END
```

### Graph 2: Interview Workflow (per turn)
```
START → [interview_agent] → END
```
Each POST loads conversation history from DB, appends the new message, calls OpenAI, and saves back. Detects completion signal `{"status":"COMPLETE"}`.

### Graph 3: Generation Workflow
```
START → [structuring_agent] → [compliance_agent] → (valid?) → [persist_node] → END
                                                  → (invalid?) → END
```
AI output is validated with Zod before any DB write — never trusted blindly.

### Graph 4: Submission + Approval Workflow
```
START → [submission_agent] → [approval_routing_agent] → END
```
Creates Manager task (sequence=1) + Gwen task (sequence=2, AWAITING_PRIOR). Activates Gwen's task after Manager approves.

### Graph 5: Approval Decision
```
START → [approval_decision_node] → END
```
Manager approve → activates Gwen. Gwen approve → finalizes. Either correct → resets chain.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth | NextAuth v4 (Credentials + `@auth/prisma-adapter`) |
| ORM | Prisma |
| Database | PostgreSQL |
| AI | OpenAI gpt-4o |
| Workflow | @langchain/langgraph |
| Validation | Zod |
| Deployment | Vercel |

---

## Quickstart (Local)

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill environment variables
cp .env.example .env.local
# Edit .env.local — see section below

# 3. Run database migrations
npm run db:migrate

# 4. Seed demo data (9 accounts, work categories, holidays)
npm run db:seed

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
# PostgreSQL — local or cloud (Neon/Supabase recommended for Vercel)
DATABASE_URL="postgresql://postgres:password@localhost:5432/timeflux?schema=public"

# NextAuth — generate with: openssl rand -base64 32
NEXTAUTH_SECRET="<your-secret>"
NEXTAUTH_URL="http://localhost:3000"   # Change to https://your-app.vercel.app on Vercel

# OpenAI
OPENAI_API_KEY="sk-proj-..."
```

**Security:**
- Never commit `.env.local` — it is in `.gitignore`
- Rotate any key that has been accidentally pasted in chat or committed to git

---

## Demo Accounts

All passwords follow the pattern shown. Use these after running `npm run db:seed`.

| Role | Email | Password |
|---|---|---|
| Employee | employee1@its.org | Employee@123 |
| Employee | employee2@its.org | Employee@123 |
| Manager | manager1@its.org | Manager@123 |
| Gwen | gwen@its.org | Gwen@123 |
| Director | director1@its.org | Director@123 |
| Commissioner | commissioner1@its.org | Commissioner@123 |
| HR Lead | hrlead1@its.org | HRLead@123 |
| CITO | cito1@its.org | CITO@123 |
| Admin | admin1@its.org | Admin@123 |

---

## Vercel Deployment

### Step 1 — Create a PostgreSQL database

Use one of these providers (all have free tiers and work with Vercel):
- **[Neon](https://neon.tech)** — serverless PostgreSQL, best Vercel integration, recommended
- **[Supabase](https://supabase.com)** — PostgreSQL with free tier
- **[Railway](https://railway.app)** — simple setup

Copy the connection string — you'll need it in Step 3.

### Step 2 — Push code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/timeflux.git
git push -u origin main
```

### Step 3 — Create Vercel project

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your GitHub repo
2. In the **Environment Variables** section, add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon/Supabase connection string |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` locally and paste the output |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` (your actual Vercel URL) |
| `OPENAI_API_KEY` | Your OpenAI key |

3. Click **Deploy**

### Step 4 — Run migrations on production database

After first deploy, run from your local machine (pointing at the production DB):

```bash
# Set your production DATABASE_URL temporarily
export DATABASE_URL="your-production-connection-string"

npm run db:migrate:prod
npm run db:seed
```

Or set `DATABASE_URL` in `.env.local` temporarily and run the commands — just don't commit it.

### Step 5 — Verify

Open `https://your-app.vercel.app` → login with any demo account from the table above.

---

## Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

Test files in `tests/`:
- `rbac.test.ts` — role-based access control rules
- `status-transitions.test.ts` — valid/invalid status transitions
- `approval-routing.test.ts` — sequential approval chain logic
- `versioning.test.ts` — version snapshots and hour calculations
- `llm-output-validation.test.ts` — Zod schema validation of AI output

---

## Timesheet Status Model

```
DRAFT → IN_INTERVIEW → GENERATED → SUBMITTED → UNDER_REVIEW
                                                    ↓            ↓
                                           MANAGER_APPROVED  NEEDS_CORRECTION
                                                    ↓                ↓
                                                APPROVED       RESUBMITTED → ...
                                                    ↓
                                               FINALIZED
```

Terminal states: `APPROVED`, `FINALIZED`, `REJECTED`

---

## Approval Model

**Sequential, with correction at any stage:**

1. Employee submits → Manager task created (PENDING), Gwen task created (AWAITING_PRIOR)
2. Manager approves → Gwen task activated (PENDING), Manager task COMPLETED
3. Gwen approves → timesheet FINALIZED, Gwen task COMPLETED
4. Either party requests correction → all open tasks SUPERSEDED, status → NEEDS_CORRECTION
5. Employee resubmits → new approval chain starts from Manager

---

## Access Control (Server-Side Enforced)

| Role | Own Records | Direct Reports | Org-Wide |
|---|---|---|---|
| EMPLOYEE | ✅ | ❌ | ❌ |
| MANAGER | ✅ | ✅ | ❌ |
| GWEN | ✅ | Assigned tasks only | ❌ |
| DIRECTOR | ✅ | ✅ | ✅ |
| COMMISSIONER | ✅ | ✅ | ✅ |
| HR_LEAD | ✅ | ✅ | ✅ |
| CITO | ✅ | ✅ | ✅ |
| ADMIN | ✅ | ✅ | ✅ |

All access control is enforced in the service layer — not just the UI.

---

## Known Limitations

1. **In-app notifications only** — no email/SMS. Notification system is interface-based; email can be added without changing callers.
2. **Serverless timeout** — very long AI conversations may hit Vercel's default 10s limit. `vercel.json` extends interview and generation routes to 60s (requires Vercel Pro).
3. **Single Gwen** — system assigns to the first user with `role=GWEN`. Multi-Gwen delegation not yet supported.
4. **No password reset** — credentials-only auth, no email reset flow.
5. **No PDF export** — timesheet PDF generation not yet implemented.
6. **Manual holiday list** — holidays are seeded manually; no calendar API integration.

---

## Folder Structure

```
timeflux/
├── prisma/
│   ├── schema.prisma          # DB schema (14 models)
│   └── seed.ts                # Demo data (9 users, categories, holidays)
├── src/
│   ├── app/
│   │   ├── api/               # REST API routes
│   │   │   ├── auth/          # NextAuth + register
│   │   │   ├── timesheets/    # CRUD + submit + versions
│   │   │   ├── approvals/     # Approval tasks + decisions
│   │   │   ├── notifications/ # In-app notifications
│   │   │   ├── audit/         # Audit log
│   │   │   ├── users/         # Profile + org listing
│   │   │   └── workflow/      # Interview + generate
│   │   ├── (auth)/            # Login + register pages
│   │   ├── dashboard/         # Role-specific dashboards
│   │   ├── timesheets/        # Interview + detail + list
│   │   ├── notifications/     # Notification center
│   │   ├── profile/           # Profile edit
│   │   └── audit/             # Audit log viewer
│   ├── components/
│   │   ├── ui/                # Primitives (Button, Input, Badge...)
│   │   ├── layout/            # Navbar, Sidebar
│   │   ├── timesheets/        # InterviewChat, TimesheetDetail
│   │   ├── dashboard/         # StatsCard
│   │   └── providers/         # SessionProvider
│   ├── lib/
│   │   ├── ai/                # OpenAI client + retry wrapper
│   │   ├── workflow/
│   │   │   ├── agents/        # 10 specialized agent nodes
│   │   │   ├── graphs/        # 5 LangGraph StateGraphs
│   │   │   ├── state.ts       # Annotated state types
│   │   │   └── index.ts       # Workflow exports
│   │   ├── validation/        # Zod schemas (including AI output)
│   │   ├── auth.ts            # NextAuth config + RBAC helpers
│   │   ├── prisma.ts          # Prisma singleton
│   │   ├── utils.ts           # Shared utilities
│   │   └── constants.ts       # Status transitions + role labels
│   ├── services/              # Domain service layer
│   │   ├── user.service.ts
│   │   ├── timesheet.service.ts
│   │   ├── approval.service.ts
│   │   ├── notification.service.ts
│   │   └── audit.service.ts
│   └── types/
│       └── next-auth.d.ts     # Session type augmentation
├── tests/                     # Jest unit tests
├── .env.example               # Template — copy to .env.local
├── .gitignore
├── vercel.json                # Route timeout config
├── next.config.js
├── tailwind.config.ts
└── jest.config.js
```

---

## Available Scripts

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server
npm test                 # Run Jest tests
npm run db:generate      # Regenerate Prisma client
npm run db:migrate       # Run migrations (dev)
npm run db:migrate:prod  # Run migrations (production)
npm run db:seed          # Seed demo data
npm run db:studio        # Open Prisma Studio (DB GUI)
```

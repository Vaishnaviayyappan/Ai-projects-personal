# NetBank Transfer POC

A small Internet Banking fund-transfer proof-of-concept demonstrating
end-to-end TypeScript type safety (frontend, backend, and E2E tests share
one set of interfaces) and Playwright E2E testing driven by the Playwright
MCP server.

## Stack

- **shared/** — `TransferRequest` / `TransferResponse` / `ApiError` interfaces, consumed by every workspace
- **backend/** — Node 20, Express 4.19, TypeScript 5.4, `pg` 8.12, `express-session`, `bcryptjs`
- **frontend/** — Vite 5, React 18.3, TypeScript 5.4, `react-router-dom` 6.24, Tailwind CSS 3.4, `lucide-react`
- **e2e/** — `@playwright/test` 1.45, typed page objects, storageState auth fixture
- **PostgreSQL 16** via Docker Compose

All money amounts are integer rupees (`INTEGER` columns, `number` fields — never floats).

## Features

- **Fund transfer** between SB1001 (Savings) and CA2001 (Current), with amount/balance/daily-limit
  validation and an idempotency guard against duplicate submissions.
- **Step-up OTP** on transfers over ₹10,000: `POST /api/transfer` returns `{status:'OtpRequired', otpRef}`
  instead of completing directly; `POST /api/transfer/confirm` finishes it. Demo OTP is always `123456`,
  expires after 120s. Idempotent on both legs (repeated initiation *and* repeated confirm).
- **Beneficiaries**: save a nickname for an account; saved beneficiaries also appear in the transfer
  page's "To Account" dropdown as `Nickname — ACCT`.
- **Statements**: CSV export (`GET /api/statement.csv`) with a running `balance_after` column computed
  entirely in SQL via a window function; the frontend both previews it as a table and downloads it.
- **Limits API**: `GET /api/limits` backs a dashboard meter (amber >70% of the daily limit, red >90%)
  and a 7-day spending sparkline (plain inline SVG, no charting library).
- **Security hardening**: a rolling 10-minute session idle timeout, a 5-attempts-per-15-minutes login
  throttle, and an audit log (`GET /api/audit`) covering login, failed login, transfer, OTP confirm,
  and beneficiary add/delete — rendered as an Activity timeline in the UI.

One deliberate deviation from a literal reading of the spec: OTP triggers for amounts **strictly greater
than** ₹10,000, not `>=`. The original happy-path E2E test transfers exactly ₹10,000 expecting immediate
completion; `>=` would have broken that unchanged test, so the boundary was shifted by one rupee instead.

## Environment variables (backend)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4000` | HTTP port |
| `PGHOST` / `PGPORT` / `PGUSER` / `PGPASSWORD` / `PGDATABASE` | see `backend/src/db.ts` | Postgres connection |
| `SESSION_SECRET` | dev placeholder | express-session signing secret |
| `ENABLE_TEST_ENDPOINTS` | unset | Set to `1` to mount `POST /api/test/reset` and `POST /api/test/expire-session`. `NODE_ENV=test` has the same effect. The E2E `webServer` config sets this automatically. |
| `TEST_IDLE_MS` | `600000` (10 min) | Overrides the session idle timeout. Left at the real 10-minute default for the E2E suite — see the note on `/api/test/expire-session` below for why. |

## Setup

### 1. Start PostgreSQL

```
docker compose up -d
```

This starts `postgres:16-alpine` on host port **5434** (mapped to avoid clashing
with other Postgres instances on a shared machine) and seeds it from
`backend/db/init.sql`:

- user `john` / password `Password123`
- account `SB1001` (Savings, ₹50,000)
- account `CA2001` (Current, ₹20,000)

### 2. Install dependencies (root, npm workspaces)

```
npm install
```

### 3. Run the dev servers

```
npm run dev:backend    # http://localhost:4000
npm run dev:frontend   # http://localhost:3000 (proxies /api -> :4000)
```

Set `ENABLE_TEST_ENDPOINTS=1` (or `NODE_ENV=test`) on the backend to expose
`POST /api/test/reset` — the E2E suite's `webServer` config does this automatically.

### 4. Run the E2E suite

```
npm run test:e2e
# or, from e2e/:
npx playwright test
npx playwright show-report
```

`playwright.config.ts` boots both dev servers itself (`webServer` array) if
they aren't already running, and `global-setup.ts` resets the database before
the run starts.

## Workflow

```
Customer
   │  fills form (typed React state)
   ▼
React + TypeScript (frontend/)
   │  fetch, typed with shared/types.ts
   ▼
Express API (backend/)
   │  validates in order: amount>0 → balance → daily limit
   │  BEGIN … debit, credit, insert txn … COMMIT
   ▼
PostgreSQL (accounts, transactions)
   │
   ▼
Playwright verification loop (e2e/, driven by Playwright MCP during dev)
   │  drives the real browser, asserts UI state
   │  cross-checks DB state via request.get('/api/accounts' | '/api/transactions')
   └─ any mismatch fails the build
```

## UI

The frontend is styled with Tailwind CSS 3.4 (design tokens in
`frontend/tailwind.config.ts`: navy `#0F2A4A` / teal `#0E9F8A` palette, Inter
font, 12px card / 8px input radius) and `lucide-react` icons — a sidebar-and-
top-bar app shell wraps the authenticated Fund Transfer page, which contains
both the transfer form and the account/transaction dashboard. All money is
rendered through a single `formatINR` helper
(`frontend/src/lib/format.ts`, `Intl.NumberFormat('en-IN', …)`) — no floats,
no ad-hoc formatting elsewhere. This was a **visual-only restyle**: every
selector the E2E suite depends on (`#username`, `#fromAccount`, button text
"Transfer", `data-testid="balance-SB1001"`, etc.) is unchanged, and the full
existing Playwright suite passes headless with zero spec edits.

Screenshots (captured via Playwright MCP against the running dev server):

| Page | Desktop (1440px) | Mobile (390px) |
|---|---|---|
| Login | [docs/screenshots/login-1440.png](docs/screenshots/login-1440.png) | [docs/screenshots/login-390.png](docs/screenshots/login-390.png) |
| Fund Transfer | [docs/screenshots/transfer-1440.png](docs/screenshots/transfer-1440.png) | [docs/screenshots/transfer-390.png](docs/screenshots/transfer-390.png) |

At 1440px the sidebar shows full nav labels ("Dashboard" and "Fund Transfer",
both pointing at the same `/transfer` route — there is only one authenticated
page) and the dashboard renders as a second column beside the form. Under the
768px breakpoint the sidebar collapses to icon-only and the two-column layout
stacks to a single column. A successful transfer
([docs/screenshots/transfer-success-1440.png](docs/screenshots/transfer-success-1440.png))
shows the green success banner, the updated balances, and the new row in
Recent Transactions with a signed, colored amount.

## TypeScript catches it first

`shared/types.ts` defines `TransferRequest.amount` as `number`, not `string`.
The file contains a commented-out example showing what happens if a caller
tries to pass a stringified amount:

```ts
const bad: TransferRequest = {
  fromAccount: 'SB1001',
  toAccount: 'CA2001',
  amount: "10000", // Type 'string' is not assignable to type 'number'.
  remarks: 'Rent',
};
```

This is a compile-time error in **every** workspace that imports
`@netbank/shared` (frontend, backend, e2e) — a malformed amount never reaches
the network, let alone the database, because the shared interface is the
single source of truth for the request shape.

## Playwright MCP setup (for teammates)

Phases 3 and 4 of this project were built by driving a real browser through
the **Playwright MCP server**, not simulated results. To register it in a new
Claude Code session:

```
claude mcp add --scope project playwright npx @playwright/mcp@latest
```

This creates `.mcp.json` in the repo root:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

`.mcp.json` is committed — don't gitignore it. After adding it, reload/restart
your Claude Code session so the MCP server connects, then run:

```
npx playwright install chromium
```

(and `npx playwright install-deps` on Linux) so a real Chromium binary is
available for both the MCP server and the `@playwright/test` runner.

## Demo script v2: three live failure moments

Each of these is a single, deliberate code change that turns exactly one spec red —
useful for demonstrating that the E2E suite actually tests what it claims to.

**(a) Idempotency guard — `idempotency.spec.ts`**

The guard that makes double-clicking Transfer produce exactly one transaction is a
single line in
[`frontend/src/pages/TransferPage.tsx:78`](frontend/src/pages/TransferPage.tsx#L78):

```ts
if (submittingRef.current) return;
```

This runs synchronously on the very first line of `handleTransfer`, so the second
click of a double-click is rejected before it can send its own `Idempotency-Key` —
before React has even re-rendered the disabled button. Comment it out, re-run
`npx playwright test idempotency.spec.ts`: two clicks now fire two independent
requests, producing two transaction rows and a double debit.

**(b) OTP threshold — `otp.spec.ts`**

The amount above which a transfer requires step-up OTP is one constant in
[`backend/src/routes/transfer.ts:11`](backend/src/routes/transfer.ts#L11):

```ts
export const OTP_THRESHOLD_RUPEES = 10000;
```

Change it to, say, `20000` and re-run `npx playwright test otp.spec.ts`: the
₹15,000 transfer that's supposed to open the OTP modal now completes directly
instead, and the "opens the OTP modal" assertion fails.

**(c) CSV running balance — `statement.spec.ts`**

The running `balance_after` column is computed entirely in SQL via a window
function in
[`backend/src/routes/statement.ts:58`](backend/src/routes/statement.ts#L58):

```sql
($2::int - SUM(delta) OVER () + SUM(delta) OVER (ORDER BY created_at, txn_ref))::int AS balance_after
```

Swap it for a naive `SUM(delta) OVER (ORDER BY created_at, txn_ref)` (dropping the
`$2::int - SUM(delta) OVER () +` offset) and re-run
`npx playwright test statement.spec.ts`: the running balance now starts from 0
instead of the account's true opening balance, and the row-by-row `balance_after`
assertions fail.

## Acceptance criteria

- All 19 specs green on chromium, headless (`npx playwright test`)
- SB1001 50000→40000, CA2001 20000→30000 after the happy-path transfer
- Error strings identical across backend (`backend/src/messages.ts`), UI, and
  test assertions — one source of truth, imported everywhere
- Zero `any` types, zero floats for money, no TODOs, all dependency versions pinned exactly

# QA Setup Guide

## GitHub Secrets (required for CI to work)

Go to: **GitHub → Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → service_role key |
| `PLAYWRIGHT_BASE_URL` | `https://nationalcheckinweek.com` |
| `PLAYWRIGHT_ADMIN_EMAIL` | Your admin login email |
| `PLAYWRIGHT_ADMIN_PASSWORD` | Your admin login password |
| `SENTRY_ORG` | Sentry → Settings → Organization slug |
| `SENTRY_PROJECT` | Sentry → Settings → Projects → project slug |
| `CHECKLY_API_KEY` | Checkly → Settings → API Keys → Create API key |
| `CHECKLY_ACCOUNT_ID` | Checkly → Settings → Account → Account ID |

---

## Sentry Setup (Lane 4)

1. Go to [sentry.io](https://sentry.io) and create a free account
2. Create a new project → **Next.js**
3. Copy your DSN from **Project Settings → Client Keys (DSN)**
4. Add to your Vercel environment variables:
   - `NEXT_PUBLIC_SENTRY_DSN` = your DSN
   - `SENTRY_ORG` = your org slug
   - `SENTRY_PROJECT` = your project slug
5. Also add these to GitHub Secrets (for the build step)
6. Deploy — Sentry will automatically capture errors

---

## Checkly Setup (Lane 5)

1. Go to [checklyhq.com](https://checklyhq.com) and create a free account
2. Click **+ Add check → Browser check**
3. Add the following checks:

| Check name | URL | Alert if |
|---|---|---|
| Homepage | `https://nationalcheckinweek.com` | Status ≠ 200 |
| Victoria state page | `https://nationalcheckinweek.com/states/victoria` | Status ≠ 200 |
| Issues listing | `https://nationalcheckinweek.com/issues` | Status ≠ 200 |
| Admin login | `https://nationalcheckinweek.com/admin/login` | Status ≠ 200 |

4. Set check frequency to **5 minutes**
5. Add your email under **Alert Settings** for immediate notifications

---

## Running tests locally

```bash
# Unit tests
npm test

# Data integrity tests (needs Supabase env vars in .env.local)
npm run test:integrity

# E2E tests against production
npm run test:e2e

# E2E tests with interactive UI
npm run test:e2e:ui

# Install Playwright browsers (first time only)
npx playwright install chromium
```

---

## What runs in CI

On every push to `main`:
- TypeScript check (`tsc --noEmit`)
- ESLint
- Unit tests (Vitest, no secrets needed)
- Next.js build
- Data integrity tests (queries production Supabase)
- Playwright E2E tests against `nationalcheckinweek.com`

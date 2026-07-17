# LearnToCodeLab Deployment Guide

This document describes the production deployment, infrastructure, environment variables, maintenance procedures, disaster recovery, and deployment workflow for LearnToCodeLab.

---

# Infrastructure

Production Architecture

```
Browser
    │
    ▼
Cloudflare DNS
    │
    ▼
Vercel
    │
    ▼
Next.js Application
    │
    ├────────► Supabase Authentication
    │
    ├────────► Supabase Database
    │
    ├────────► Supabase Storage
    │
    └────────► Server Actions / API Routes
```

Primary production URL

```
https://learntocodelab.com
```

Additional URLs

```
https://www.learntocodelab.com
```

Redirects to:

```
https://learntocodelab.com
```

Developer deployment

```
https://learntocodelab.vercel.app
```

---

# Git Workflow

Every production deployment follows this workflow.

```
git status
git add .
git commit -m "Describe your changes"
git push origin main
```

Pushing to `main` automatically triggers a production deployment in Vercel.

---

# Vercel Configuration

Framework

```
Next.js
```

Production Branch

```
main
```

Custom Domain

```
learntocodelab.com
```

Additional Domain

```
www.learntocodelab.com
```

Automatic Deployments

Enabled

---

# Environment Variables

## Public

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL=https://learntocodelab.com
```

## Server Only

These MUST NEVER be exposed through `NEXT_PUBLIC`.

Example:

```
SUPABASE_SERVICE_ROLE_KEY
```

---

## Maintenance

```
MAINTENANCE_OVERRIDE=database
```

Possible values

```
database
force-on
force-off
```

Legacy compatibility

```
MAINTENANCE_MODE=false
```

Optional server-only variables

```
MAINTENANCE_TITLE
MAINTENANCE_MESSAGE
MAINTENANCE_ESTIMATED_RETURN
```

---

# Supabase

Authentication

Enabled

- Email / Password
- Google OAuth

Production Callback

```
https://learntocodelab.com/auth/callback
```

Local Development

```
http://localhost:3000/auth/callback
```

Preview Deployments

Configure the current Vercel Preview URL pattern as an additional redirect.

---

# Database

Whenever new migrations are added:

1. Review the migration.
2. Apply it.
3. Verify tables.
4. Verify indexes.
5. Verify Row Level Security.
6. Verify policies.
7. Verify production functionality.

Never edit an already-applied production migration.

Always create a new corrective migration.

The admin support and user-management system requires:

```
supabase/migrations/202607160001_admin_support_system.sql
supabase/migrations/202607170001_support_ticket_production_polish.sql
supabase/migrations/202607170002_profile_onboarding_polish.sql
```

Apply these migrations in order before exercising `/admin/users`, `/admin/support`, `/admin/activity`, learner `/support`, or the new profile and onboarding flows. Confirm RLS with separate learner and staff sessions. Existing profiles default to active; no destructive backfill is performed.

The profile/onboarding migration must be applied before deploying its matching application code. Verify that the `avatars` Storage bucket is public for reads, limited to the declared image MIME types and 5 MB, and that authenticated users can insert, replace, or delete objects only inside their own user-ID folder. Confirm that existing profiles retain access while a newly created email or Google account is redirected to `/onboarding`.

---

# Owner Role

Verify owner access

```sql
select u.email, p.role
from auth.users u
join public.profiles p
on p.id = u.id;
```

Assign owner

```sql
update public.profiles
set role='owner'
where id=(
    select id
    from auth.users
    where lower(email)=lower('your-email@example.com')
);
```

---

# Maintenance Mode

Normal maintenance is controlled through

```
/admin/maintenance
```

Only verified server-side owners and admins may access maintenance controls.

Maintenance never blocks

- /maintenance
- /staff/sign-in
- /auth/callback
- /auth/continue
- /auth/sign-out
- /auth/forgot-password
- /auth/reset-password
- required auth API routes
- static assets
- logo assets

---

## Emergency Recovery

Disable maintenance directly

```sql
update public.site_settings
set maintenance_enabled=false,
updated_at=now()
where id='global';
```

Override through Vercel

```
MAINTENANCE_OVERRIDE=force-off
```

Force maintenance

```
MAINTENANCE_OVERRIDE=force-on
```

Return to database-controlled maintenance

```
MAINTENANCE_OVERRIDE=database
```

Environment-variable changes require a redeployment.

---

# Production Checklist

Before every deployment

- [ ] Tests pass
- [ ] TypeScript passes
- [ ] Lint passes
- [ ] Production build passes
- [ ] No secrets committed
- [ ] Environment variables verified
- [ ] Database migrations applied
- [ ] README updated
- [ ] DEPLOYMENT.md updated

---

# Disaster Recovery

If Supabase remains available

- Disable maintenance using SQL.
- Verify owner role.
- Sign in through `/staff/sign-in`.

If Supabase is unavailable

Use

```
MAINTENANCE_OVERRIDE=force-off
```

or

```
MAINTENANCE_OVERRIDE=force-on
```

Redeploy Vercel.

---

# Local Development

Install dependencies

```
npm install
```

Run development server

```
npm run dev
```

Run lint

```
npm run lint
```

Run tests

```
npm test
```

Run production build

```
npm run build
```

---

# Deployment Verification

After every deployment verify

- Homepage
- Authentication
- Google OAuth
- Dashboard
- Onboarding
- Admin Panel
- Maintenance Mode
- Profile
- Settings
- Theme switching
- Mobile layout
- Desktop layout
- Production domain
- WWW redirect
- Vercel deployment URL

---

# Future Planned Systems

These systems are intentionally **not yet production complete**.

- AI Tutor
- AI Lesson Recommendations
- AI Code Review
- AI Hint System
- AI Personalized Learning Paths
- AI Curriculum Generator

These should not be marked as production-ready until fully implemented and tested.

---

Last Updated

July 2026

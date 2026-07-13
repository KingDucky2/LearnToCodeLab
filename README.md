# LearnToCode Lab

An adaptive coding school by Luke Giordano, rebuilt as a Next.js + TypeScript platform with Supabase authentication, learner profiles, privacy controls, and Vercel deployment.

## Local Setup

```bash
pnpm install
pnpm dev
```

Open:

```text
http://localhost:3000/
```

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-public-publishable-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Do not commit `.env.local`, Google credential JSON files, client secrets, service-role keys, or private credentials.

## Supabase Auth Configuration

Site URL:

```text
https://learntocodelab.com
```

Allowed redirect URLs:

```text
https://learntocodelab.com/**
https://www.learntocodelab.com/**
https://learntocodelab.vercel.app/**
http://localhost:3000/**
```

Google OAuth redirect URI:

```text
https://fjdwijneunzkghusabea.supabase.co/auth/v1/callback
```

Recommended Supabase email template links:

```text
Confirm signup: {{ .ConfirmationURL }}
Reset password: {{ .ConfirmationURL }}
Email change: {{ .ConfirmationURL }}
```

The app passes `/auth/callback` as the redirect target when it starts signup, OAuth, and reset flows. Confirm that generated email links ultimately return to `/auth/callback` on the LearnToCodeLab domain, then continue to `/dashboard`, `/reset-password`, or `/settings`.

## Database

Run migrations in order from `supabase/migrations`, then run `supabase/seed.sql` for starter curriculum and practice questions.

Current auth/profile migration:

```text
supabase/migrations/202607120001_production_auth_profiles.sql
```

The profile trigger creates a private one-to-one `profiles` row from Supabase auth metadata. Row Level Security only allows authenticated users to read and update their own private profile.

## Auth Routes

```text
/login
/signup
/forgot-password
/reset-password
/auth/callback
/dashboard
/profile
/settings
```

Legacy routes under `/auth/sign-in`, `/auth/create-account`, `/auth/forgot-password`, and `/auth/reset-password` redirect to the new routes.

## Delete Account

The delete-account UI and server route are implemented. Deleting the Supabase auth user requires this server-only Vercel environment variable:

```env
SUPABASE_SERVICE_ROLE_KEY=
```

Never expose that key in browser code and never prefix it with `NEXT_PUBLIC_`.

## Deployment

- Source code lives on GitHub.
- Vercel deploys preview and production environments automatically.
- Configure `LearnToCodeLab.com` and `www.LearnToCodeLab.com` in Vercel.
- Store Supabase public variables separately for preview and production.

## Auth Testing Checklist

- Create an email/password account.
- Receive the confirmation email.
- Confirm the account and land back on LearnToCodeLab.
- Sign in with email/password.
- Refresh and remain signed in.
- Log out.
- Request a password-reset email.
- Reset the password.
- Sign in with the new password.
- Sign in with Google.
- Cancel Google login and return safely to `/login`.
- Access `/dashboard` while logged out and confirm redirect to `/login`.
- Access `/login` while logged in and confirm redirect to `/dashboard`.
- Confirm profile creation after email signup.
- Confirm profile creation after Google signup.
- Confirm one user cannot read another user’s private profile.
- Confirm production build succeeds.

Maintenance page:

- `maintenance.html` is standalone and has the official logo embedded.
- For GitHub Pages homepage maintenance mode, upload the maintenance page as `index.html`.
- `maintenance-index.html` is a copy made for that purpose.

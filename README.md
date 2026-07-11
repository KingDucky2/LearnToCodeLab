# LearnToCode Lab

An adaptive coding school by Luke Giordano, rebuilt as a Next.js + TypeScript platform.

The app now includes:
- Next.js App Router and Tailwind
- Supabase auth/database wiring
- Email/password and Google OAuth UI
- Onboarding for experience, language knowledge, goals, and preferences
- Learning paths for HTML, CSS, JavaScript, Python, C++, Swift, and Lua
- Lesson pages with structured curriculum sections
- Practice/placement engine seed
- Dashboard, profile, settings, and privacy pages
- Supabase migration and seed SQL
- Vercel deployment configuration

Run locally:

```bash
pnpm install
pnpm dev
```

Then open:

```text
http://localhost:3000/
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Maintenance page:
- `maintenance.html` is standalone and has the official logo embedded.
- For GitHub Pages homepage maintenance mode, upload the maintenance page as `index.html`.
- `maintenance-index.html` is a copy made for that purpose.

Deployment:
- Source code lives on GitHub.
- Vercel deploys preview and production environments automatically.
- LearnToCodeLab.com should be configured as the production custom domain.
- See `DEPLOYMENT.md`.

Do not upload:
- `client_secret_*.json`

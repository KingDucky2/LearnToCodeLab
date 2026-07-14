# Deployment

LearnToCode Lab is now designed as a Next.js application deployed on Vercel from GitHub.

## Vercel

1. Push this repository to GitHub.
2. Import the GitHub repository into Vercel.
3. Set the framework preset to Next.js.
4. Add preview and production environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SITE_URL`
   - `MAINTENANCE_OVERRIDE=database`
   - `MAINTENANCE_MODE=false` (legacy compatibility)
5. Configure automatic deployments from GitHub.
6. Add `LearnToCodeLab.com` as the production custom domain in Vercel.

## Supabase

1. Create separate Supabase projects or clearly separated environments for preview and production.
2. Run the SQL migration in `supabase/migrations`.
3. Run `supabase/seed.sql` to add the first language paths and starter practice questions.
4. Enable email/password auth and Google OAuth.
5. Configure auth redirect URLs:
   - `https://learntocodelab.com/auth/callback`
   - Vercel preview URL pattern for branch previews
   - `http://localhost:3000/auth/callback` for local development

## Maintenance fallback

Normal maintenance is controlled through `/admin/maintenance` and stored in Supabase. Run `supabase/migrations/202607130001_maintenance_system.sql`, then assign an `admin` or `owner` role before using the control panel.

For an application-level emergency, set `MAINTENANCE_OVERRIDE=force-on` in Vercel and redeploy. To force the application online while repairing the database setting, use `MAINTENANCE_OVERRIDE=force-off` and redeploy. Set it back to `database` after recovery. The older `MAINTENANCE_MODE=true` value still forces maintenance only when `MAINTENANCE_OVERRIDE` is unset. Optional server-only variables are `MAINTENANCE_TITLE`, `MAINTENANCE_MESSAGE`, and `MAINTENANCE_ESTIMATED_RETURN`.

`maintenance.html` remains a standalone emergency artifact. If the Vercel app must be replaced temporarily, upload that file as `index.html` to a static host. It contains no secret keys and loads the official logo from the public GitHub repository.

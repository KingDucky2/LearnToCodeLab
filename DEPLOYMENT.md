# Deployment

LearnToCode Lab is now designed as a Next.js application deployed on Vercel from GitHub.

## Vercel

1. Push this repository to GitHub.
2. Import the GitHub repository into Vercel.
3. Set the framework preset to Next.js.
4. Add preview and production environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
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

`maintenance.html` is still a standalone emergency file with the official logo embedded. If Vercel or the app needs to be temporarily replaced, upload the contents of `maintenance-index.html` as `index.html` to a static host.

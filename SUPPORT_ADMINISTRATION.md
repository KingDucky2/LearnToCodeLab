# Support and user administration

Learners use `/support`, `/support/new`, and `/support/[ticketId]`. Row Level Security restricts tickets and messages to their owner. Verified `admin` and `owner` accounts use `/admin/users`, `/admin/support`, and `/admin/activity`; the shared admin layout remains the server authorization boundary. Supabase Auth administration is isolated in a server-only client, and `SUPABASE_SERVICE_ROLE_KEY` must never use a `NEXT_PUBLIC_` prefix or reach a client component.

Apply `supabase/migrations/202607160001_admin_support_system.sql` before enabling these routes. It adds account status, provider synchronization, support tables, private staff notes, account-status history, append-only audit records, indexes, narrow RLS policies, atomic ticket creation, and narrowly authorized status/session functions. Existing accounts default to `active`.

## Password and account recovery

Staff never view or receive passwords, reset tokens, or generated recovery links. Password assistance asks Supabase Auth to send its normal recovery email. Successful requests are limited to one per target account every ten minutes, and attempts are recorded without the email body, token, or link.

- Admins can act on learner, user, and moderator accounts.
- Only owners can act on admin accounts.
- No staff member can suspend an owner or themselves.
- Session revocation uses a restricted database function after server-side role verification.
- Suspension history and staff notes are append-only.

Suspended users are redirected away from protected learner areas but retain support, password recovery, authentication callbacks, sign-out, and maintenance recovery access.
Suspension changes access only: it does not delete the account, profile, tickets, lesson progress, attempts, or skill data.

## Support data handling

Ticket subjects are limited to 140 characters and messages to 5,000. Initial messages and tickets are created atomically. The database rejects rapid bursts and a matching open subject within 24 hours. Page context must be an internal path. Browser diagnostics are limited to the user agent and are stored only after explicit consent. Learners are warned not to submit passwords, reset links, tokens, payment details, or other secrets.

Private staff notes are stored separately from learner-visible messages. Audit summaries contain action metadata, target identifiers, outcome, timestamp, and correlation identifier—not full ticket bodies or credentials.

## Operational checks

1. A learner can see only their own tickets and messages.
2. A learner cannot read staff notes or audit records.
3. An admin cannot suspend an admin or owner.
4. An owner can suspend an admin but cannot suspend an owner or themselves.
5. Password assistance sends an email without displaying a recovery link.
6. Suspended accounts can still open support and password-recovery routes.
7. `/admin/activity` records sensitive action outcomes without secrets.

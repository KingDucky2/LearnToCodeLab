import { redirect } from "next/navigation";
import { NewSupportTicketForm } from "@/components/support/SupportForms";
import { PageShell, SectionHeader } from "@/components/PageShell";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function NewSupportPage() {
  const supabase = await createClient(); const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } }; if (!user) redirect("/login?next=/support/new");
  return <PageShell narrow><SectionHeader eyebrow="Support" title="Create a support ticket" copy="Share only the details needed to understand the issue. You can follow staff replies from your support history." /><NewSupportTicketForm /></PageShell>;
}

import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { PageShell } from "@/components/PageShell";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (user) redirect("/dashboard");

  return (
    <PageShell narrow>
      <Suspense fallback={<div className="glass rounded-lg p-6 font-black text-foreground">Loading sign in...</div>}>
        <LoginForm />
      </Suspense>
    </PageShell>
  );
}

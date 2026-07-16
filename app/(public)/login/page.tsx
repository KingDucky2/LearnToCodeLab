import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { PageShell } from "@/components/PageShell";

export default function LoginPage() {
  return (
    <PageShell narrow>
      <Suspense fallback={<div className="glass rounded-lg p-6 font-black text-foreground">Loading sign in...</div>}>
        <LoginForm />
      </Suspense>
    </PageShell>
  );
}

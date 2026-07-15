import { Suspense } from "react";
import { SignupForm } from "@/components/auth/SignupForm";
import { PageShell } from "@/components/PageShell";

export default function SignupPage() {
  return (
    <PageShell narrow>
      <Suspense fallback={<div className="glass rounded-lg p-6 font-black text-foreground">Loading account setup...</div>}>
        <SignupForm />
      </Suspense>
    </PageShell>
  );
}

import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { PageShell } from "@/components/PageShell";

export default function ResetPasswordPage() {
  return (
    <PageShell narrow>
      <Suspense fallback={<div className="glass rounded-lg p-6 font-black text-foreground">Checking reset link...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </PageShell>
  );
}

import { AuthForm } from "@/components/AuthForm";
import { PageShell } from "@/components/PageShell";

export default function CreateAccountPage() {
  return (
    <PageShell narrow>
      <AuthForm mode="create-account" />
    </PageShell>
  );
}

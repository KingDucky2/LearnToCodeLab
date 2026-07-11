import { AuthForm } from "@/components/AuthForm";
import { PageShell } from "@/components/PageShell";

export default function SignInPage() {
  return (
    <PageShell narrow>
      <AuthForm mode="sign-in" />
    </PageShell>
  );
}

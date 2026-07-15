import { redirect } from "next/navigation";
import { canonicalRouteWithSearch } from "@/lib/auth-utils";

export default async function LegacyResetPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  redirect(canonicalRouteWithSearch("/reset-password", await searchParams));
}

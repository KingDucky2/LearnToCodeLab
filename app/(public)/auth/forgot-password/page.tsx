import { redirect } from "next/navigation";
import { canonicalRouteWithSearch } from "@/lib/auth-utils";

export default async function LegacyForgotPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  redirect(canonicalRouteWithSearch("/forgot-password", await searchParams));
}

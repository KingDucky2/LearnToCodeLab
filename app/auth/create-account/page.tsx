import { redirect } from "next/navigation";
import { canonicalRouteWithSearch } from "@/lib/auth-utils";

export default async function LegacyCreateAccountPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  redirect(canonicalRouteWithSearch("/signup", await searchParams));
}

import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { confirmation?: string } | null;
  if (body?.confirmation !== "DELETE") {
    return NextResponse.json({ message: "Type DELETE to confirm account deletion." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user || !supabase) {
    return NextResponse.json({ message: "Sign in again before deleting your account." }, { status: 401 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ message: "Account deletion needs a server-only Supabase service-role key configured in Vercel." }, { status: 501 });
  }

  const admin = createAdminClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json({ message: "Account deletion could not be completed. Please contact support." }, { status: 500 });
  }

  return NextResponse.json({ message: "Account deleted." }, { headers: { "Cache-Control": "no-store" } });
}

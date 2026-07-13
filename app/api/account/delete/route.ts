import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types";

export async function POST() {
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

  const db = supabase as any;
  await db.from("lesson_progress").delete().eq("user_id", user.id);
  await db.from("skill_scores").delete().eq("user_id", user.id);
  await db.from("attempts").delete().eq("user_id", user.id);
  await db.from("privacy_preferences").delete().eq("user_id", user.id);
  await db.from("profiles").delete().eq("id", user.id);

  const admin = createAdminClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json({ message: "Account deletion could not be completed. Please contact support." }, { status: 500 });
  }

  await supabase.auth.signOut();
  return NextResponse.json({ message: "Account deleted." });
}

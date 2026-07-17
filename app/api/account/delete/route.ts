import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ message: "Account deletion needs a server-only Supabase service-role key configured in Vercel." }, { status: 501 });
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json({ message: "Account deletion could not be completed. Please contact support." }, { status: 500 });
  }

  return NextResponse.json({ message: "Account deleted." }, { headers: { "Cache-Control": "no-store" } });
}

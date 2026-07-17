import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isSameOriginMutation } from "@/lib/request-security";
import { createClient } from "@/lib/supabase/server";

const allowedTypes = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"], ["image/gif", "gif"]]);
const maxBytes = 5 * 1024 * 1024;

async function hasValidSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (file.type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === "image/png") return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  if (file.type === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (file.type === "image/gif") return ["GIF87a", "GIF89a"].includes(String.fromCharCode(...bytes.slice(0, 6)));
  return false;
}

async function context(request: Request) {
  if (!isSameOriginMutation(request)) return { error: NextResponse.json({ message: "Invalid request origin." }, { status: 403 }) };
  const supabase = await createClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!supabase || !user) return { error: NextResponse.json({ message: "Sign in again to update your avatar." }, { status: 401 }) };
  return { supabase, user };
}

async function removeStoredAvatars(supabase: any, userId: string, except?: string) {
  const { data = [] } = await supabase.storage.from("avatars").list(userId, { limit: 100 });
  const paths = data.map((file: { name: string }) => `${userId}/${file.name}`).filter((path: string) => path !== except);
  if (paths.length) await supabase.storage.from("avatars").remove(paths);
}

export async function POST(request: Request) {
  const auth = await context(request);
  if (auth.error) return auth.error;
  const form = await request.formData().catch(() => null);
  const file = form?.get("avatar");
  if (!(file instanceof File)) return NextResponse.json({ message: "Choose an image to upload." }, { status: 400 });
  const extension = allowedTypes.get(file.type);
  if (!extension) return NextResponse.json({ message: "Use a JPEG, PNG, WebP, or GIF image." }, { status: 415 });
  if (!file.size || file.size > maxBytes) return NextResponse.json({ message: "Avatar images must be 5 MB or smaller." }, { status: 413 });
  if (!await hasValidSignature(file)) return NextResponse.json({ message: "The selected file does not contain a valid image." }, { status: 415 });
  const path = `${auth.user.id}/avatar-${randomUUID()}.${extension}`;
  const storage = auth.supabase.storage.from("avatars");
  const { error: uploadError } = await storage.upload(path, file, { contentType: file.type, cacheControl: "3600", upsert: false });
  if (uploadError) return NextResponse.json({ message: "The avatar could not be uploaded." }, { status: 400 });
  const { data: publicData } = storage.getPublicUrl(path);
  const { error: profileError } = await (auth.supabase as any).from("profiles").update({ avatar_url: publicData.publicUrl, avatar_source: "custom" }).eq("id", auth.user.id);
  if (profileError) { await storage.remove([path]); return NextResponse.json({ message: "The avatar could not be saved to your profile." }, { status: 400 }); }
  await removeStoredAvatars(auth.supabase, auth.user.id, path);
  return NextResponse.json({ message: "Avatar updated.", avatarUrl: publicData.publicUrl }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: Request) {
  const auth = await context(request);
  if (auth.error) return auth.error;
  const { error } = await (auth.supabase as any).from("profiles").update({ avatar_url: null, avatar_source: "provider" }).eq("id", auth.user.id);
  if (error) return NextResponse.json({ message: "The avatar could not be removed." }, { status: 400 });
  await removeStoredAvatars(auth.supabase, auth.user.id);
  return NextResponse.json({ message: "Custom avatar removed. Your provider avatar or initials will be used." }, { headers: { "Cache-Control": "no-store" } });
}

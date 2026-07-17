import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isSameOriginMutation } from "@/lib/request-security";
import { createClient } from "@/lib/supabase/server";

const allowedTypes = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);
const maxBytes = 5 * 1024 * 1024;
const maxDimension = 4096;

async function hasValidSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (file.type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === "image/png") return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  if (file.type === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return false;
}

async function imageDimensions(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (file.type === "image/png" && bytes.length >= 24) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (file.type === "image/jpeg") {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) { offset += 1; continue; }
      const marker = bytes[offset + 1];
      const length = (bytes[offset + 2] << 8) + bytes[offset + 3];
      if (length < 2) break;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { height: (bytes[offset + 5] << 8) + bytes[offset + 6], width: (bytes[offset + 7] << 8) + bytes[offset + 8] };
      }
      offset += 2 + length;
    }
  }
  if (file.type === "image/webp" && bytes.length >= 30) {
    const chunk = String.fromCharCode(...bytes.slice(12, 16));
    if (chunk === "VP8X") return { width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16), height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16) };
    if (chunk === "VP8L" && bytes.length >= 25) {
      const bits = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24);
      return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
    }
    if (chunk === "VP8 " && bytes.length >= 30) return { width: (bytes[26] | (bytes[27] << 8)) & 0x3fff, height: (bytes[28] | (bytes[29] << 8)) & 0x3fff };
  }
  return null;
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
  if (!extension) return NextResponse.json({ message: "Use a JPEG, PNG, or WebP image." }, { status: 415 });
  if (!file.size || file.size > maxBytes) return NextResponse.json({ message: "Avatar images must be 5 MB or smaller." }, { status: 413 });
  if (!await hasValidSignature(file)) return NextResponse.json({ message: "The selected file does not contain a valid image." }, { status: 415 });
  const dimensions = await imageDimensions(file);
  if (!dimensions || !dimensions.width || !dimensions.height) return NextResponse.json({ message: "The image dimensions could not be verified." }, { status: 415 });
  if (dimensions.width > maxDimension || dimensions.height > maxDimension) return NextResponse.json({ message: `Avatar images must be ${maxDimension} × ${maxDimension} pixels or smaller.` }, { status: 413 });
  const path = `${auth.user.id}/avatar-${randomUUID()}.${extension}`;
  const storage = auth.supabase.storage.from("avatars");
  const { error: uploadError } = await storage.upload(path, file, { contentType: file.type, cacheControl: "3600", upsert: false });
  if (uploadError) {
    console.error("Avatar storage upload failed.", { statusCode: uploadError.statusCode ?? "unknown" });
    const setupMissing = /bucket.*not found|not found/i.test(uploadError.message);
    return NextResponse.json({ message: setupMissing ? "Avatar storage is not configured. An administrator must apply the latest Supabase migration." : "The avatar could not be uploaded. Check the file and try again." }, { status: setupMissing ? 503 : 400 });
  }
  const { data: publicData } = storage.getPublicUrl(path);
  const { error: profileError } = await (auth.supabase as any).from("profiles").update({ avatar_url: publicData.publicUrl, avatar_source: "custom" }).eq("id", auth.user.id);
  if (profileError) { await storage.remove([path]); console.error("Avatar profile update failed.", { code: profileError.code ?? "unknown" }); return NextResponse.json({ message: ["42703", "PGRST204"].includes(profileError.code) ? "Profile setup is incomplete. An administrator must apply the latest Supabase migration." : "The avatar was uploaded but could not be linked to your profile. No profile changes were made." }, { status: ["42703", "PGRST204"].includes(profileError.code) ? 503 : 400 }); }
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

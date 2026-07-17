export type StaffRole = "admin" | "owner";
export type ManagedRole = "learner" | "user" | "moderator" | "admin" | "owner" | string;

export function canManageAccount(input: { actorId: string; actorRole: string | null; targetId: string; targetRole: ManagedRole }) {
  if (input.actorId === input.targetId) return false;
  if (input.targetRole === "owner") return false;
  if (input.actorRole === "owner") return true;
  return input.actorRole === "admin" && input.targetRole !== "admin";
}

export function canSuspendAccount(input: { actorId: string; actorRole: string | null; targetId: string; targetRole: ManagedRole }) {
  return canManageAccount(input);
}

export function normalizeAdminSearch(value: string | null | undefined) {
  return (value ?? "").trim().slice(0, 120).replace(/[,%()]/g, "");
}

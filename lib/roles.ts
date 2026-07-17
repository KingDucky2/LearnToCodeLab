export function getRoleBadgeLabel(role: string | null | undefined) {
  const normalized = role?.trim().toLowerCase();
  if (!normalized || normalized === "learner" || normalized === "user") return null;
  const labels: Record<string, string> = { owner: "Owner", admin: "Admin", moderator: "Moderator", staff: "Staff", support: "Support Staff", support_staff: "Support Staff" };
  return labels[normalized] ?? normalized.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

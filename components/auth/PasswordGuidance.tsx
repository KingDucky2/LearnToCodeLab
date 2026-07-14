import { passwordGuidance } from "@/lib/auth-utils";

export function PasswordGuidance({ password }: { password: string }) {
  const checks = passwordGuidance(password);
  const items = [
    ["At least 8 characters", checks.length],
    ["Includes a letter", checks.letter],
    ["Includes a number", checks.number]
  ] as const;

  return (
    <ul className="grid gap-1 text-xs font-bold text-muted">
      {items.map(([label, passed]) => (
        <li key={label} className={passed ? "text-emerald-700" : "text-subtle"}>
          {passed ? "✓" : "•"} {label}
        </li>
      ))}
    </ul>
  );
}

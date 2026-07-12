import Link from "next/link";

const footerLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/settings/privacy", label: "Data controls" }
];

export function AppFooter() {
  return (
    <footer className="mx-auto mt-12 flex w-[min(1180px,calc(100%_-_24px))] flex-col gap-4 border-t border-slate-200 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="font-black text-lab-navy">LearnToCode Lab</p>
        <p className="mt-1">Adaptive coding lessons with clear privacy choices.</p>
      </div>
      <nav className="flex flex-wrap gap-3">
        {footerLinks.map((link) => (
          <Link key={link.href} href={link.href} className="font-extrabold hover:text-lab-blue">
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}

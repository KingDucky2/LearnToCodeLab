import { PageShell, SectionHeader } from "@/components/PageShell";

const sections = [
  {
    title: "Information we collect",
    copy: "LearnToCode Lab may collect account details, profile preferences, onboarding answers, lesson progress, quiz attempts, practice activity, and settings needed to run the learning platform."
  },
  {
    title: "How learning data is used",
    copy: "Progress, answers, mistakes, and preferences help personalize lessons, recommend practice, show mastery, and keep your dashboard accurate."
  },
  {
    title: "Personalization controls",
    copy: "Learners should be able to receive recommendations while separately choosing whether broader improvement data sharing is enabled."
  },
  {
    title: "Authentication and service providers",
    copy: "The app is designed to use Supabase for authentication and database services, and Vercel for hosting and deployment."
  },
  {
    title: "Data requests",
    copy: "Learners can request access, export, correction, or deletion of account data through privacy settings when account features are enabled."
  },
  {
    title: "Contact",
    copy: "For privacy requests, use the account settings area or the official support contact listed by LearnToCode Lab when the full service launches."
  }
];

export default function PrivacyPolicyPage() {
  return (
    <PageShell narrow>
      <SectionHeader eyebrow="Privacy Policy" title="Privacy at LearnToCode Lab." copy="This page explains the product's intended privacy approach for learner accounts, progress, personalization, and data controls." />
      <div className="space-y-4">
        {sections.map((section) => (
          <section key={section.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lab">
            <h2 className="text-2xl font-black text-lab-navy">{section.title}</h2>
            <p className="mt-3 leading-8 text-slate-600">{section.copy}</p>
          </section>
        ))}
      </div>
      <p className="mt-6 text-sm font-bold text-slate-500">Last updated: July 12, 2026</p>
    </PageShell>
  );
}

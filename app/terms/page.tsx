import { PageShell, SectionHeader } from "@/components/PageShell";

const terms = [
  {
    title: "Use of the service",
    copy: "LearnToCode Lab is an educational platform for coding lessons, practice, quizzes, progress tracking, and related learning tools."
  },
  {
    title: "Accounts",
    copy: "Learners are responsible for keeping account information accurate and protecting sign-in access. Some areas may require a verified account."
  },
  {
    title: "Learning content",
    copy: "Lessons, examples, quizzes, and recommendations are provided for education. Learners should review code carefully before using it in real projects."
  },
  {
    title: "Acceptable use",
    copy: "Do not misuse the platform, interfere with service operation, attempt unauthorized access, or upload harmful, illegal, or abusive content."
  },
  {
    title: "Privacy",
    copy: "Use of the service is also covered by the Privacy Policy, including account data, learning progress, personalization, and data request options."
  },
  {
    title: "Changes",
    copy: "Terms may be updated as LearnToCode Lab grows. Continued use after updates means the current terms apply."
  }
];

export default function TermsPage() {
  return (
    <PageShell narrow>
      <SectionHeader eyebrow="Terms of Service" title="Terms for using LearnToCode Lab." copy="These terms describe the expected use of the learning platform, accounts, educational content, and privacy relationship." />
      <div className="space-y-4">
        {terms.map((section) => (
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

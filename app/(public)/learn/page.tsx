import { PageShell, SectionHeader } from "@/components/PageShell";
import { CourseCard } from "@/components/course/CourseCard";
import { courses, playableCourse } from "@/lib/learning/catalog";
import { calculateCourseProgress, getLearningSummary } from "@/lib/progress/server";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const summary = await getLearningSummary();
  const progress = calculateCourseProgress(summary);
  return (
    <PageShell>
      <SectionHeader eyebrow="Course catalog" title="Choose what you want to build." copy="Start with a guided web foundation. Additional structured courses will open as their lessons and practice environments are ready." />
      <div className="grid min-w-0 gap-4 min-[900px]:grid-cols-2">
        {courses.map((course) => <CourseCard key={course.id} course={course} progress={course.id === playableCourse.id ? progress : 0} />)}
      </div>
    </PageShell>
  );
}

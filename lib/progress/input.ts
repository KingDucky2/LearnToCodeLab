import { findLesson } from "@/lib/learning/catalog";

const maximumFileLength = 150_000;

export type LearningProgressInput = {
  courseSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  files: Record<string, string>;
  completed: boolean;
};

export function validateLearningProgressInput(value: unknown): { ok: true; value: LearningProgressInput } | { ok: false; message: string } {
  if (!value || typeof value !== "object") return { ok: false, message: "The workspace save was not valid." };
  const input = value as Record<string, unknown>;
  const courseSlug = text(input.courseSlug);
  const moduleSlug = text(input.moduleSlug);
  const lessonSlug = text(input.lessonSlug);
  const location = findLesson(courseSlug, moduleSlug, lessonSlug);
  if (!location) return { ok: false, message: "This lesson could not be found." };
  if (!input.files || typeof input.files !== "object" || Array.isArray(input.files)) return { ok: false, message: "No lesson files were supplied." };
  const allowedFiles = new Set(location.lesson.starterFiles.filter((file) => file.editable).map((file) => file.name));
  const files = Object.fromEntries(Object.entries(input.files as Record<string, unknown>).filter(([name, content]) => allowedFiles.has(name) && typeof content === "string" && content.length <= maximumFileLength)) as Record<string, string>;
  const required = location.lesson.starterFiles.filter((file) => file.editable).map((file) => file.name);
  if (required.some((name) => typeof files[name] !== "string")) return { ok: false, message: "One or more lesson files were missing or too large." };
  return { ok: true, value: { courseSlug, moduleSlug, lessonSlug, files, completed: input.completed === true } };
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase().slice(0, 100) : "";
}

export type CourseStatus = "available" | "in_progress" | "coming_soon";
export type CourseDifficulty = "Beginner" | "Intermediate" | "Advanced";
export type LessonFileLanguage = string;

export type LessonFile = {
  name: string;
  language: LessonFileLanguage;
  content: string;
  editable: boolean;
};

export type LessonValidationRule =
  | { type: "html_element"; tag: string; minimum?: number; message: string }
  | { type: "required_text"; text: string; file?: string; message: string }
  | { type: "html_attribute"; tag: string; attribute: string; value?: string; message: string }
  | { type: "css_declaration"; property: string; value?: string; message: string }
  | { type: "javascript_output"; text: string; message: string };

export type LessonExample = {
  title: string;
  explanation: string;
  code: string;
  language: LessonFileLanguage;
};

export type LessonDefinition = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  difficulty: CourseDifficulty;
  estimatedMinutes: number;
  objectives: string[];
  explanation: string[];
  examples: LessonExample[];
  tasks: string[];
  hints: string[];
  starterFiles: LessonFile[];
  validationRules: LessonValidationRule[];
  quiz: { status: "coming_soon"; label: string };
  xpReward: number;
};

export type CourseModule = {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: "available" | "coming_soon";
  lessons: LessonDefinition[];
};

export type CourseDefinition = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  difficulty: CourseDifficulty;
  estimatedHours: number;
  status: "available" | "coming_soon";
  color: string;
  modules: CourseModule[];
};

export type LessonLocation = {
  course: CourseDefinition;
  module: CourseModule;
  lesson: LessonDefinition;
  previous: { moduleSlug: string; lessonSlug: string; title: string } | null;
  next: { moduleSlug: string; lessonSlug: string; title: string } | null;
};

export type LessonProgressSnapshot = {
  lessonId: string;
  status: "not_started" | "in_progress" | "completed";
  completionPercent: number;
  completedAt: string | null;
  lastOpenedAt: string;
};

export type LearningSummary = {
  progress: LessonProgressSnapshot[];
  currentLessonId: string | null;
  completedLessonIds: string[];
};

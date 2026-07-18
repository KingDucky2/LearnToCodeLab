import type { CourseDefinition, LessonDefinition, LessonLocation } from "@/lib/learning/types";

const htmlDocument = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My first page</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <main>
      <h1>Hello, web!</h1>
      <p>I am learning how HTML gives a page structure.</p>
    </main>
    <script src="script.js"></script>
  </body>
</html>`;

const sharedFiles = (html: string) => [
  { name: "index.html", language: "html" as const, content: html, editable: true },
  { name: "styles.css", language: "css" as const, content: `body {
  margin: 0;
  padding: 2rem;
  font-family: system-ui, sans-serif;
  color: #e8f0ff;
  background: #07172f;
}

main {
  max-width: 42rem;
  margin: 0 auto;
}`, editable: true },
  { name: "script.js", language: "javascript" as const, content: `console.log("Your page is ready.");`, editable: true }
];

const lessons: LessonDefinition[] = [
  {
    id: "33333333-3333-4333-8333-333333333301",
    slug: "what-is-html",
    title: "What is HTML?",
    subtitle: "Meet the language that gives every web page its structure.",
    description: "Learn how elements, tags, and document structure work together, then make your first meaningful edit in the browser.",
    difficulty: "Beginner",
    estimatedMinutes: 18,
    objectives: ["Explain what HTML does", "Recognize opening and closing tags", "Identify the head and body of a document", "Run a page in the live preview"],
    explanation: [
      "HTML stands for HyperText Markup Language. It describes the structure and meaning of content: headings, paragraphs, links, images, forms, and more.",
      "Most elements use an opening tag, content, and a closing tag. For example, <p>Hello</p> tells the browser that Hello is a paragraph.",
      "A complete document has metadata in <head> and visible page content in <body>. CSS controls presentation, while JavaScript can add behavior."
    ],
    examples: [{ title: "A meaningful heading", explanation: "The h1 element identifies the page's primary heading.", language: "html", code: `<h1>Welcome to my first page</h1>
<p>This sentence is a paragraph.</p>` }],
    tasks: ["Change the h1 text to Hello, web!", "Keep at least one paragraph inside the body", "Run the preview and check the console"],
    hints: ["Look inside the <main> element in index.html.", "HTML text goes between an opening tag and its matching closing tag."],
    starterFiles: sharedFiles(htmlDocument),
    validationRules: [
      { type: "html_element", tag: "h1", message: "Add one main heading with an <h1> element." },
      { type: "html_element", tag: "p", message: "Add a paragraph with a <p> element." },
      { type: "required_text", text: "Hello, web!", file: "index.html", message: "Make the heading say “Hello, web!”" }
    ],
    quiz: { status: "coming_soon", label: "HTML foundations knowledge check" },
    xpReward: 25
  },
  {
    id: "33333333-3333-4333-8333-333333333302",
    slug: "creating-your-first-web-page",
    title: "Creating Your First Web Page",
    subtitle: "Build a valid document from metadata to visible content.",
    description: "Practice the durable page skeleton used by real websites and learn why each structural element belongs where it does.",
    difficulty: "Beginner",
    estimatedMinutes: 24,
    objectives: ["Create a valid HTML document", "Set a useful browser-tab title", "Separate metadata from visible content", "Connect CSS and JavaScript files"],
    explanation: [
      "The doctype tells the browser to use modern HTML. The html element wraps the document and its lang attribute helps assistive technology pronounce content correctly.",
      "The head contains metadata such as character encoding, viewport behavior, the browser-tab title, and linked stylesheets. Visitors see the content inside body.",
      "Keeping HTML, CSS, and JavaScript in separate files makes a project easier to understand and extend. The preview combines all three without executing your code in the LearnToCodeLab page."
    ],
    examples: [{ title: "Document skeleton", explanation: "A small but complete HTML page includes language, metadata, a title, and visible content.", language: "html", code: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>About me</title>
  </head>
  <body>
    <h1>About me</h1>
  </body>
</html>` }],
    tasks: ["Set the page title to My learning journal", "Add an h1 that says My learning journal", "Add a paragraph introducing what you want to build"],
    hints: ["The title belongs inside <head>; the h1 belongs inside <body>.", "The preview title appears in the document even though the preview panel has no browser tab."],
    starterFiles: sharedFiles(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Change this title</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <main>
      <h1>Change this heading</h1>
      <p>Write a short introduction here.</p>
    </main>
    <script src="script.js"></script>
  </body>
</html>`),
    validationRules: [
      { type: "html_attribute", tag: "html", attribute: "lang", value: "en", message: "Keep lang=\"en\" on the html element." },
      { type: "html_element", tag: "title", message: "Add a title inside the document head." },
      { type: "required_text", text: "My learning journal", file: "index.html", message: "Use “My learning journal” for the title and main heading." },
      { type: "html_element", tag: "p", message: "Add a paragraph that introduces your learning journal." }
    ],
    quiz: { status: "coming_soon", label: "Document structure knowledge check" },
    xpReward: 35
  },
  {
    id: "33333333-3333-4333-8333-333333333303",
    slug: "headings-paragraphs-and-text",
    title: "Headings, Paragraphs, and Text",
    subtitle: "Turn a blank page into readable, meaningful content.",
    description: "Use heading levels, paragraphs, and inline emphasis to create a clear content hierarchy that works for every reader.",
    difficulty: "Beginner",
    estimatedMinutes: 26,
    objectives: ["Build a logical heading hierarchy", "Group ideas into paragraphs", "Use strong and emphasis semantically", "Check the result at multiple preview widths"],
    explanation: [
      "Headings create an outline. Use one clear h1 for the page topic, then h2 elements for major sections. Do not choose heading levels only for their default size.",
      "Paragraphs group related sentences. Short, focused paragraphs improve scanning on small screens and help learners follow an explanation.",
      "Use strong for content with strong importance and em for stress emphasis. These elements carry meaning that assistive technology can communicate; they are not merely visual styles."
    ],
    examples: [{ title: "A readable article outline", explanation: "The heading levels describe the relationship between sections.", language: "html", code: `<article>
  <h1>My coding journey</h1>
  <p>I started learning because I want to build useful tools.</p>
  <h2>What I am practicing</h2>
  <p>I practice <strong>consistently</strong> and reflect on <em>why</em> each solution works.</p>
</article>` }],
    tasks: ["Create one h1 and at least two h2 section headings", "Write at least two paragraphs", "Use strong and em once each", "Run the preview and inspect the responsive view"],
    hints: ["Start with one page topic, then divide it into two named sections.", "Place strong and em around only the words that need meaning or emphasis."],
    starterFiles: sharedFiles(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My coding journey</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <article>
      <!-- Build your article here. -->
    </article>
    <script src="script.js"></script>
  </body>
</html>`),
    validationRules: [
      { type: "html_element", tag: "h1", message: "Add one <h1> for the page topic." },
      { type: "html_element", tag: "h2", minimum: 2, message: "Add at least two <h2> section headings." },
      { type: "html_element", tag: "p", minimum: 2, message: "Write at least two paragraphs." },
      { type: "html_element", tag: "strong", message: "Use <strong> for one important phrase." },
      { type: "html_element", tag: "em", message: "Use <em> for one emphasized phrase." }
    ],
    quiz: { status: "coming_soon", label: "Text semantics knowledge check" },
    xpReward: 40
  }
];

export const courses: CourseDefinition[] = [
  {
    id: "11111111-1111-4111-8111-111111111101",
    slug: "web-development-foundations",
    title: "Web Development Foundations",
    description: "Build accessible web pages with HTML, style them with CSS, and add behavior with JavaScript.",
    icon: "Code2",
    difficulty: "Beginner",
    estimatedHours: 12,
    status: "available",
    color: "from-sky-400 to-blue-600",
    modules: [
      { id: "22222222-2222-4222-8222-222222222201", slug: "introduction", title: "Introduction", description: "Understand the web and create your first HTML structure.", status: "available", lessons: [lessons[0]] },
      { id: "22222222-2222-4222-8222-222222222202", slug: "html-basics", title: "HTML Basics", description: "Create complete pages with clear content hierarchy.", status: "available", lessons: [lessons[1], lessons[2]] },
      { id: "22222222-2222-4222-8222-222222222203", slug: "css-basics", title: "CSS Basics", description: "Style and lay out responsive pages.", status: "coming_soon", lessons: [] },
      { id: "22222222-2222-4222-8222-222222222204", slug: "javascript-basics", title: "JavaScript Basics", description: "Add interaction and browser behavior.", status: "coming_soon", lessons: [] }
    ]
  },
  ...["JavaScript", "Python", "C#", "Java", "React", "SQL", "Node.js"].map((title, index) => ({
    id: `11111111-1111-4111-8111-1111111111${String(index + 2).padStart(2, "0")}`,
    slug: title.toLowerCase().replace("#", "sharp").replace(".", "").replaceAll(" ", "-"),
    title,
    description: `A structured ${title} path is being prepared for a future release.`,
    icon: "BookOpen",
    difficulty: "Beginner" as const,
    estimatedHours: 0,
    status: "coming_soon" as const,
    color: "from-slate-500 to-slate-700",
    modules: []
  }))
];

export const playableCourse = courses[0];
export const availableLessons = playableCourse.modules.flatMap((module) => module.lessons);

export function findCourse(slug: string) {
  return courses.find((course) => course.slug === slug);
}

export function findModule(courseSlug: string, moduleSlug: string) {
  return findCourse(courseSlug)?.modules.find((courseModule) => courseModule.slug === moduleSlug);
}

export function findLesson(courseSlug: string, moduleSlug: string, lessonSlug: string): LessonLocation | null {
  const course = findCourse(courseSlug);
  const courseModule = course?.modules.find((item) => item.slug === moduleSlug);
  const lesson = courseModule?.lessons.find((item) => item.slug === lessonSlug);
  if (!course || !courseModule || !lesson) return null;
  const flattened = course.modules.flatMap((item) => item.lessons.map((entry) => ({ moduleSlug: item.slug, lesson: entry })));
  const index = flattened.findIndex((entry) => entry.lesson.id === lesson.id);
  const adjacent = (offset: number) => {
    const entry = flattened[index + offset];
    return entry ? { moduleSlug: entry.moduleSlug, lessonSlug: entry.lesson.slug, title: entry.lesson.title } : null;
  };
  return { course, module: courseModule, lesson, previous: adjacent(-1), next: adjacent(1) };
}

export function findLessonById(lessonId: string): LessonLocation | null {
  for (const course of courses) {
    for (const courseModule of course.modules) {
      const lesson = courseModule.lessons.find((item) => item.id === lessonId);
      if (lesson) return findLesson(course.slug, courseModule.slug, lesson.slug);
    }
  }
  return null;
}

export function getLessonHref(courseSlug: string, moduleSlug: string, lessonSlug: string) {
  return `/learn/${courseSlug}/${moduleSlug}/${lessonSlug}`;
}

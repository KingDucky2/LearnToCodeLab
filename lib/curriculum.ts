export type LanguageSlug = "html" | "css" | "javascript" | "python" | "cpp" | "swift" | "lua";

export type Lesson = {
  slug: string;
  title: string;
  objective: string;
  sections: string[];
  checkpoint: string;
  estimatedMinutes: number;
};

export type Module = {
  title: string;
  level: "Foundation" | "Building" | "Advanced";
  lessons: Lesson[];
};

export type LearningPath = {
  slug: LanguageSlug;
  title: string;
  description: string;
  buildGoal: string;
  color: string;
  modules: Module[];
};

export const learningPaths: LearningPath[] = [
  {
    slug: "html",
    title: "HTML",
    description: "Structure real pages with semantic markup, forms, media, accessibility, and metadata.",
    buildGoal: "Publish a clean multi-section profile page.",
    color: "from-sky-400 to-blue-600",
    modules: [
      { title: "Document Foundations", level: "Foundation", lessons: [
        lesson("html-structure", "Page structure", "Build a semantic HTML page skeleton."),
        lesson("forms-accessibility", "Forms and accessibility", "Create labeled inputs and accessible content.")
      ] },
      { title: "Production Markup", level: "Building", lessons: [
        lesson("metadata-media", "Metadata and media", "Use images, links, metadata, and loading hints.")
      ] }
    ]
  },
  {
    slug: "css",
    title: "CSS",
    description: "Turn structure into responsive interfaces with layout, spacing, cascade, and motion.",
    buildGoal: "Style a responsive product landing page.",
    color: "from-cyan-400 to-teal-500",
    modules: [
      { title: "Interface Foundations", level: "Foundation", lessons: [
        lesson("selectors-box-model", "Selectors and box model", "Control spacing, sizing, and selector behavior."),
        lesson("flex-grid", "Flexbox and grid", "Build stable one- and two-dimensional layouts.")
      ] },
      { title: "Responsive Systems", level: "Building", lessons: [
        lesson("responsive-cascade", "Responsive cascade", "Design layouts that adapt without breaking.")
      ] }
    ]
  },
  {
    slug: "javascript",
    title: "JavaScript",
    description: "Program browser behavior with variables, functions, arrays, DOM events, and async logic.",
    buildGoal: "Build an interactive quiz app.",
    color: "from-yellow-300 to-amber-500",
    modules: [
      { title: "Runtime Basics", level: "Foundation", lessons: [
        lesson("variables-functions", "Variables and functions", "Store data and package reusable behavior."),
        lesson("dom-events", "DOM and events", "Select elements and respond to user actions.")
      ] },
      { title: "App Logic", level: "Building", lessons: [
        lesson("arrays-async", "Arrays and async", "Transform data and handle promise-based work.")
      ] }
    ]
  },
  {
    slug: "python",
    title: "Python",
    description: "Learn programming fundamentals, automation, data structures, modules, and debugging.",
    buildGoal: "Create a command-line study tracker.",
    color: "from-blue-500 to-emerald-400",
    modules: [
      { title: "Programming Foundations", level: "Foundation", lessons: [
        lesson("python-variables", "Variables and types", "Represent values clearly in Python."),
        lesson("conditions-loops", "Conditions and loops", "Control decisions and repetition.")
      ] },
      { title: "Building Programs", level: "Building", lessons: [
        lesson("functions-data", "Functions and data", "Use functions, lists, and dictionaries together.")
      ] }
    ]
  },
  {
    slug: "cpp",
    title: "C++",
    description: "Practice syntax, types, functions, references, memory, STL containers, and systems thinking.",
    buildGoal: "Build a small score-processing program.",
    color: "from-indigo-500 to-blue-700",
    modules: [
      { title: "C++ Core", level: "Foundation", lessons: [
        lesson("cpp-syntax-output", "Syntax and output", "Write and run simple C++ programs."),
        lesson("vectors-const", "Vectors and const", "Manage collections and protect values.")
      ] }
    ]
  },
  {
    slug: "swift",
    title: "Swift",
    description: "Understand Swift values, optionals, functions, collections, protocols, and app-ready patterns.",
    buildGoal: "Model a simple habit tracker.",
    color: "from-orange-400 to-red-500",
    modules: [
      { title: "Swift Foundations", level: "Foundation", lessons: [
        lesson("swift-values", "Values and optionals", "Use let, var, types, and nil safely."),
        lesson("swift-functions", "Functions and collections", "Organize reusable Swift logic.")
      ] }
    ]
  },
  {
    slug: "lua",
    title: "Lua",
    description: "Learn lightweight scripting with tables, functions, scope, metatables, and coroutines.",
    buildGoal: "Script a simple game mechanic.",
    color: "from-violet-500 to-sky-500",
    modules: [
      { title: "Lua Foundations", level: "Foundation", lessons: [
        lesson("lua-values", "Values and scope", "Use local variables, nil, and basic flow."),
        lesson("lua-tables", "Tables and functions", "Build table-driven scripts.")
      ] }
    ]
  }
];

function lesson(slug: string, title: string, objective: string): Lesson {
  return {
    slug,
    title,
    objective,
    estimatedMinutes: 18,
    sections: ["Objective", "Why it matters", "Example", "Try it", "Common mistake", "Knowledge check", "Mini-project"],
    checkpoint: "Explain the concept, fix one broken example, and complete a short applied task."
  };
}

export const sampleQuestions = [
  { language: "html", topic: "Elements", type: "multiple_choice", prompt: "Which tag should be used for the main visible heading?", correct: "<h1>", choices: ["<head>", "<title>", "<section>"], mistake: "semantic markup" },
  { language: "css", topic: "Layout", type: "multiple_choice", prompt: "Which layout system is best for rows and columns?", correct: "CSS Grid", choices: ["float", "inline-block only", "text-align"], mistake: "layout selection" },
  { language: "javascript", topic: "DOM", type: "debug", prompt: "Why can addEventListener throw when attaching to a button?", correct: "The selected element was not found", choices: ["The event is always wrong", "Buttons cannot use events", "CSS is missing"], mistake: "null DOM selection" },
  { language: "python", topic: "Loops", type: "predict_output", prompt: "What does range(5) produce?", correct: "0 through 4", choices: ["1 through 5", "0 through 5", "5 only"], mistake: "off-by-one" },
  { language: "cpp", topic: "Syntax", type: "multiple_choice", prompt: "Which symbol ends most C++ statements?", correct: ";", choices: [":", ".", ","], mistake: "syntax error" },
  { language: "swift", topic: "Optionals", type: "multiple_choice", prompt: "What does an optional represent?", correct: "A value that may be present or nil", choices: ["A forced crash", "Only a string", "A CSS property"], mistake: "type concept" },
  { language: "lua", topic: "Tables", type: "multiple_choice", prompt: "Which structure stores key-value data in Lua?", correct: "table", choices: ["arraylist", "dictionary only", "object only"], mistake: "data structures" }
];

export function findPath(slug: string) {
  return learningPaths.find((path) => path.slug === slug);
}

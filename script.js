const $ = (id) => document.getElementById(id);

const menuBtn = $("menuBtn");
const navLinks = $("navLinks");
menuBtn.addEventListener("click", () => navLinks.classList.toggle("open"));

function openLesson(title, text) {
  $("lessonTitle").textContent = title;
  $("lessonText").textContent = text;
  $("lessonSteps").innerHTML = "";
  $("lessonBox").classList.remove("hidden");
}

function closeLesson() {
  $("lessonBox").classList.add("hidden");
}

window.openLesson = openLesson;
window.closeLesson = closeLesson;

const levelNames = {
  beginner: "Easy",
  intermediate: "Medium",
  advanced: "Hard",
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  mix: "Mix"
};

const levelMap = {
  easy: "beginner",
  medium: "intermediate",
  hard: "advanced"
};

const lessonLibrary = {
  "html-structure": {
    title: "HTML Structure",
    text: "HTML is the skeleton of a page. Strong structure makes your site easier to style, easier to read, and more accessible.",
    steps: ["Use one clear main heading.", "Use semantic tags like header, nav, main, section, and footer.", "Connect labels to form inputs.", "Add useful alt text for images.", "Use viewport metadata for mobile layouts."]
  },
  "css-layout": {
    title: "CSS Layout",
    text: "CSS turns structure into a usable interface. Most layout bugs come from box model, specificity, or sizing problems.",
    steps: ["Use padding for inside space and margin for outside space.", "Use flexbox for one-direction alignment.", "Use grid for rows and columns.", "Keep selectors low-specificity when possible.", "Use responsive constraints instead of guessing fixed sizes."]
  },
  "javascript-dom": {
    title: "JavaScript DOM",
    text: "JavaScript makes pages interactive. Good DOM code selects the right element, checks state, reacts to events, and updates the page carefully.",
    steps: ["Use const by default and let when values change.", "Check that querySelector found an element before using it.", "Use event listeners instead of inline behavior for larger apps.", "Remember that map returns a new array.", "Understand closures and async behavior for harder bugs."]
  },
  "python-foundations": {
    title: "Python Foundations",
    text: "Python rewards clear thinking. Most beginner bugs come from names, indentation, types, loops, and function scope.",
    steps: ["Define variables before using them.", "Use == for comparison and = for assignment.", "Indent blocks consistently.", "Use dictionaries for key-value data.", "Avoid mutable default arguments in functions."]
  },
  "cpp-core": {
    title: "C++ Core",
    text: "C++ gives you power, but it expects precision. Focus on syntax, types, references, memory lifetime, and standard library containers.",
    steps: ["End most statements with semicolons.", "Use std::cout for output.", "Prefer std::vector over raw dynamic arrays.", "Use const to protect values from accidental mutation.", "Understand when references, pointers, and moves are used."]
  },
  "swift-lua": {
    title: "Swift & Lua Concepts",
    text: "Swift and Lua are different, but both reward understanding values, scope, functions, and runtime behavior.",
    steps: ["Swift uses let for constants and var for variables.", "Optionals represent values that may be missing.", "Swift structs are value types; classes are reference types.", "Lua tables power arrays and key-value data.", "Lua metatables and coroutines unlock advanced behavior."]
  }
};

const topicLessonMap = {
  Elements: "html-structure", Links: "html-structure", Images: "html-structure", Semantics: "html-structure", Forms: "html-structure", Scripts: "html-structure", Accessibility: "html-structure", Metadata: "html-structure", Performance: "html-structure", SEO: "html-structure",
  Selectors: "css-layout", "Box Model": "css-layout", Colors: "css-layout", Layout: "css-layout", Specificity: "css-layout", Responsive: "css-layout", Cascade: "css-layout", Containment: "css-layout", Rendering: "css-layout", Grid: "css-layout",
  Variables: "javascript-dom", DOM: "javascript-dom", Comments: "javascript-dom", Events: "javascript-dom", Arrays: "javascript-dom", Async: "javascript-dom", Scope: "javascript-dom", Equality: "javascript-dom", "Event Loop": "javascript-dom", Objects: "javascript-dom",
  Errors: "python-foundations", Operators: "python-foundations", Functions: "python-foundations", Loops: "python-foundations", Data: "python-foundations", Exceptions: "python-foundations", Comprehensions: "python-foundations", Mutability: "python-foundations", Generators: "python-foundations", Decorators: "python-foundations",
  Syntax: "cpp-core", Output: "cpp-core", Entry: "cpp-core", Headers: "cpp-core", References: "cpp-core", Memory: "cpp-core", Pointers: "cpp-core", Templates: "cpp-core", "Move Semantics": "cpp-core", "Const Correctness": "cpp-core", STL: "cpp-core",
  Optionals: "swift-lua", Types: "swift-lua", Collections: "swift-lua", Protocols: "swift-lua", Concurrency: "swift-lua", Tables: "swift-lua", Indexing: "swift-lua", Metatables: "swift-lua", Closures: "swift-lua", Coroutines: "swift-lua", Environments: "swift-lua", Iteration: "swift-lua"
};

const lessonByLanguage = {
  html: "html-structure",
  css: "css-layout",
  javascript: "javascript-dom",
  python: "python-foundations",
  cpp: "cpp-core",
  swift: "swift-lua",
  lua: "swift-lua"
};

const googleClientId = "594358973918-ea5lrb9ihkg9gjbn5d07t5se991t34mf.apps.googleusercontent.com";

const quizBank = [
  { lang: "html", level: "beginner", topic: "Elements", q: "Which tag should be used for the main visible heading on a page?", correct: "<h1>", choices: ["<head>", "<title>", "<section>"], explain: "<h1> is the highest-level visible heading. <head> and <title> are document metadata." },
  { lang: "html", level: "beginner", topic: "Links", q: "What is wrong with this HTML? <a href='page.html'>Click", correct: "The closing </a> tag is missing", choices: ["href cannot link to HTML files", "The word Click is invalid", "Links must use src"], explain: "Anchor elements need opening and closing tags around the clickable content." },
  { lang: "html", level: "beginner", topic: "Images", q: "Which attribute provides alternative text for an image?", correct: "alt", choices: ["href", "class", "srcset"], explain: "alt describes image content for accessibility and failed image loads." },
  { lang: "html", level: "intermediate", topic: "Semantics", q: "Which element is most appropriate for site navigation links?", correct: "<nav>", choices: ["<main>", "<aside>", "<span>"], explain: "<nav> identifies a block of major navigation links." },
  { lang: "html", level: "intermediate", topic: "Forms", q: "Why should a form input have a matching label?", correct: "It improves accessibility and click targeting", choices: ["It makes the input required automatically", "It encrypts the value", "It prevents invalid CSS"], explain: "Labels help screen readers and let users click the label to focus the input." },
  { lang: "html", level: "intermediate", topic: "Scripts", q: "What does the defer attribute do on a script tag?", correct: "Downloads the script while parsing and runs it after HTML parsing", choices: ["Stops the script from loading", "Runs the script before any HTML loads", "Turns JavaScript into CSS"], explain: "defer avoids blocking parsing and runs the script after the document is parsed." },
  { lang: "html", level: "advanced", topic: "Accessibility", q: "When should aria-label be used?", correct: "When an element needs an accessible name that is not visible text", choices: ["On every paragraph", "To replace all semantic HTML", "Only on images"], explain: "aria-label is useful for icon-only controls, but semantic HTML and visible labels are preferred when possible." },
  { lang: "html", level: "advanced", topic: "Metadata", q: "Why does <meta name='viewport'> matter on mobile?", correct: "It controls how the page width maps to the device viewport", choices: ["It loads fonts faster", "It adds dark mode automatically", "It validates all forms"], explain: "Without viewport metadata, mobile browsers may render the page as a wide desktop layout." },
  { lang: "html", level: "advanced", topic: "Performance", q: "Which image attribute can improve page performance by delaying offscreen images?", correct: "loading='lazy'", choices: ["alt='lazy'", "fetch='later'", "display='delay'"], explain: "Native lazy loading lets the browser postpone loading images until they are near the viewport." },

  { lang: "css", level: "beginner", topic: "Selectors", q: "Which selector targets an element with id='hero'?", correct: "#hero", choices: [".hero", "hero", "*hero"], explain: "The # prefix selects an id. A dot selects a class." },
  { lang: "css", level: "beginner", topic: "Box Model", q: "Which property adds space inside an element's border?", correct: "padding", choices: ["margin", "gap", "outline"], explain: "padding is inside the border. margin is outside the border." },
  { lang: "css", level: "beginner", topic: "Colors", q: "Which property changes text color?", correct: "color", choices: ["background", "font-style", "text-fill-mode"], explain: "color controls text color. background controls the element background." },
  { lang: "css", level: "intermediate", topic: "Layout", q: "Which layout system is best for two-dimensional rows and columns?", correct: "CSS Grid", choices: ["float", "inline-block only", "text-align"], explain: "Grid is designed for two-dimensional layout. Flexbox is usually better for one-dimensional layout." },
  { lang: "css", level: "intermediate", topic: "Specificity", q: "Which selector usually has the highest specificity?", correct: "#menu", choices: [".menu", "button", "*"], explain: "ID selectors are more specific than class, element, and universal selectors." },
  { lang: "css", level: "intermediate", topic: "Responsive", q: "What does clamp(1rem, 2vw, 2rem) do?", correct: "Sets a value with minimum, flexible, and maximum limits", choices: ["Locks the value to 2vw only", "Removes responsive behavior", "Only works on colors"], explain: "clamp() lets a value scale while staying between a min and max." },
  { lang: "css", level: "advanced", topic: "Cascade", q: "What does @layer help manage?", correct: "Cascade priority between groups of CSS rules", choices: ["JavaScript imports", "Image compression", "HTML validation"], explain: "@layer lets you organize cascade order so utilities, components, and base rules behave predictably." },
  { lang: "css", level: "advanced", topic: "Containment", q: "What can container queries respond to?", correct: "The size of a parent container", choices: ["Only the full browser window", "Only the user's location", "Only JavaScript events"], explain: "Container queries let components adapt based on their own container, not just the viewport." },
  { lang: "css", level: "advanced", topic: "Rendering", q: "Why avoid animating width for frequent UI motion?", correct: "It can trigger layout work and feel less smooth", choices: ["CSS cannot animate width", "It deletes child elements", "It disables media queries"], explain: "Transforms and opacity are usually cheaper because they can avoid layout recalculation." },

  { lang: "javascript", level: "beginner", topic: "Variables", q: "Which keyword creates a variable that can be reassigned?", correct: "let", choices: ["const", "fixed", "define"], explain: "let creates a block-scoped variable that can be reassigned. const cannot be reassigned." },
  { lang: "javascript", level: "beginner", topic: "DOM", q: "What does document.querySelector('#box') select?", correct: "The first element with id='box'", choices: ["Every element named box", "A file called box", "The browser window"], explain: "#box is a CSS selector for an element with the id box." },
  { lang: "javascript", level: "beginner", topic: "Comments", q: "Which symbol starts a single-line JavaScript comment?", correct: "//", choices: ["#", "--", "<!--"], explain: "JavaScript uses // for single-line comments and /* */ for block comments." },
  { lang: "javascript", level: "intermediate", topic: "Events", q: "Why can addEventListener throw 'Cannot read properties of null'?", correct: "The selected element was not found", choices: ["The event name is always wrong", "Buttons cannot use events", "CSS is missing"], explain: "If querySelector returns null, there is no element to attach the listener to." },
  { lang: "javascript", level: "intermediate", topic: "Arrays", q: "What does array.map() return?", correct: "A new array", choices: ["The original array only", "A single string", "Nothing"], explain: "map transforms each item and returns a new array of the results." },
  { lang: "javascript", level: "intermediate", topic: "Async", q: "What does await pause?", correct: "The current async function until a promise settles", choices: ["The entire browser", "Only CSS animations", "All network requests forever"], explain: "await pauses the current async function, not the whole browser runtime." },
  { lang: "javascript", level: "advanced", topic: "Scope", q: "What is a closure?", correct: "A function keeping access to variables from its outer scope", choices: ["A finished HTML tag", "A CSS selector bug", "A deleted variable"], explain: "Closures let functions remember variables from the scope where they were created." },
  { lang: "javascript", level: "advanced", topic: "Equality", q: "Why is === usually preferred over ==?", correct: "It avoids type coercion during comparison", choices: ["It assigns a value", "It compares only object keys", "It only works with numbers"], explain: "=== checks strict equality without converting types first." },
  { lang: "javascript", level: "advanced", topic: "Rendering", q: "Why batch DOM updates when possible?", correct: "To reduce repeated layout and paint work", choices: ["To disable event listeners", "To make variables global", "To prevent arrays from changing"], explain: "Frequent DOM reads and writes can force expensive layout work." },

  { lang: "python", level: "beginner", topic: "Errors", q: "What error happens if you use print(name) before name exists?", correct: "NameError", choices: ["IndentationError", "SyntaxError", "ValueError"], explain: "Python raises NameError when a variable name is used before it has been defined." },
  { lang: "python", level: "beginner", topic: "Operators", q: "What is the comparison operator for equality in Python?", correct: "==", choices: ["=", "===", "=>"], explain: "== compares values. A single = assigns a value to a variable." },
  { lang: "python", level: "beginner", topic: "Functions", q: "Which keyword defines a function in Python?", correct: "def", choices: ["function", "func", "define"], explain: "Python uses def to define functions, like def greet():." },
  { lang: "python", level: "intermediate", topic: "Loops", q: "Which loop correctly goes through a list named items?", correct: "for item in items:", choices: ["foreach item in items", "loop item from items", "for(items)"], explain: "Python for-loops use the format: for item in items:" },
  { lang: "python", level: "intermediate", topic: "Data", q: "Which type stores key-value pairs in Python?", correct: "dict", choices: ["list", "tuple", "range"], explain: "Dictionaries store keys mapped to values." },
  { lang: "python", level: "intermediate", topic: "Exceptions", q: "What should try/except be used for?", correct: "Handling expected runtime errors", choices: ["Hiding every bug forever", "Replacing all if statements", "Making code run faster automatically"], explain: "try/except is for handling errors you can reasonably recover from." },
  { lang: "python", level: "advanced", topic: "Comprehensions", q: "What does [x*x for x in nums if x > 0] create?", correct: "A new list of squared positive numbers", choices: ["A function", "A dictionary of all numbers", "A loop that returns nothing"], explain: "List comprehensions build lists from an iterable, optionally filtering items." },
  { lang: "python", level: "advanced", topic: "Mutability", q: "Why can a mutable default argument cause bugs?", correct: "The same object can be reused across calls", choices: ["It always becomes None", "It disables the function", "It changes Python into JavaScript"], explain: "Default arguments are created once, so mutable defaults like [] can keep old values." },
  { lang: "python", level: "advanced", topic: "Generators", q: "What does yield do?", correct: "Produces a value while pausing generator state", choices: ["Stops Python permanently", "Imports a module", "Creates a CSS rule"], explain: "yield lets a generator produce values one at a time while remembering its state." },

  { lang: "cpp", level: "beginner", topic: "Syntax", q: "Which symbol ends most C++ statements?", correct: ";", choices: [":", ".", ","], explain: "Most C++ statements end with a semicolon." },
  { lang: "cpp", level: "beginner", topic: "Output", q: "Which command prints text in standard C++?", correct: "std::cout << \"Hi\";", choices: ["console.log('Hi');", "print('Hi')", "echo 'Hi';"], explain: "std::cout with << is used for standard output in C++." },
  { lang: "cpp", level: "beginner", topic: "Entry", q: "Which function is the usual starting point of a C++ program?", correct: "int main()", choices: ["start()", "run()", "program()"], explain: "C++ programs usually begin execution in main." },
  { lang: "cpp", level: "intermediate", topic: "Headers", q: "What does #include <iostream> provide?", correct: "Input and output streams like std::cout", choices: ["Image editing", "Website routing", "Database tables"], explain: "iostream provides standard input/output streams such as std::cout and std::cin." },
  { lang: "cpp", level: "intermediate", topic: "References", q: "What does passing by reference allow?", correct: "A function can work with the original object", choices: ["The value is always copied", "The compiler ignores types", "The function becomes private"], explain: "References can avoid copies and allow changes to the original object when non-const." },
  { lang: "cpp", level: "intermediate", topic: "Memory", q: "What does RAII help manage?", correct: "Resource lifetime through object construction and destruction", choices: ["HTML rendering", "CSS cascade", "Network DNS only"], explain: "RAII ties resources to object lifetime so cleanup happens automatically." },
  { lang: "cpp", level: "advanced", topic: "Pointers", q: "What does a dangling pointer point to?", correct: "Memory that is no longer valid to use", choices: ["A new safe object", "Only a string literal", "The compiler settings"], explain: "Dangling pointers reference memory after its lifetime ended." },
  { lang: "cpp", level: "advanced", topic: "Templates", q: "What are templates mainly used for?", correct: "Writing generic code that works with multiple types", choices: ["Styling webpages", "Encrypting source files", "Creating images"], explain: "Templates let C++ generate type-specific code from generic definitions." },
  { lang: "cpp", level: "advanced", topic: "Move Semantics", q: "What is the purpose of std::move?", correct: "It casts an object so resources may be moved from it", choices: ["It physically moves memory immediately", "It copies an object twice", "It deletes the object"], explain: "std::move enables move constructors or move assignment when available." },

  { lang: "swift", level: "beginner", topic: "Variables", q: "Which keyword creates a constant in Swift?", correct: "let", choices: ["var", "const", "fixed"], explain: "Swift uses let for constants and var for variables." },
  { lang: "swift", level: "beginner", topic: "Variables", q: "Which keyword creates a variable in Swift?", correct: "var", choices: ["let", "make", "new"], explain: "Swift variables are declared with var." },
  { lang: "swift", level: "beginner", topic: "Output", q: "Which function prints output in Swift?", correct: "print()", choices: ["console.log()", "std::cout", "echo()"], explain: "Swift uses print() to write output." },
  { lang: "swift", level: "intermediate", topic: "Optionals", q: "What does an optional represent in Swift?", correct: "A value that may be present or nil", choices: ["A value that is always a String", "A forced app crash", "A CSS property"], explain: "Optionals make absence explicit in the type system." },
  { lang: "swift", level: "intermediate", topic: "Types", q: "What does type safety mean in Swift?", correct: "Swift checks that values match expected types", choices: ["Swift removes all errors automatically", "Swift only works with text", "Swift does not use variables"], explain: "Swift helps prevent using values as the wrong type." },
  { lang: "swift", level: "intermediate", topic: "Collections", q: "Which Swift collection stores unique unordered values?", correct: "Set", choices: ["Array", "Dictionary", "Tuple"], explain: "A Set stores unique values without guaranteed order." },
  { lang: "swift", level: "advanced", topic: "Protocols", q: "What is a protocol in Swift?", correct: "A blueprint of requirements a type can conform to", choices: ["A database row", "A required image file", "A CSS reset"], explain: "Protocols define required properties and methods for conforming types." },
  { lang: "swift", level: "advanced", topic: "Memory", q: "Why use weak references in Swift?", correct: "To avoid strong reference cycles", choices: ["To make values global", "To disable optionals", "To force a copy"], explain: "weak references do not keep an object alive, helping prevent retain cycles." },
  { lang: "swift", level: "advanced", topic: "Concurrency", q: "What does async/await improve in Swift?", correct: "Writing asynchronous code in a clearer sequence", choices: ["Changing app icons", "Replacing all variables", "Disabling errors"], explain: "async/await makes asynchronous code read more like normal sequential code." },

  { lang: "lua", level: "beginner", topic: "Variables", q: "Which keyword creates a local variable in Lua?", correct: "local", choices: ["let", "var", "define"], explain: "Lua uses local to create a variable limited to the current scope." },
  { lang: "lua", level: "beginner", topic: "Comments", q: "Which symbol starts a single-line Lua comment?", correct: "--", choices: ["//", "#", "/*"], explain: "Lua uses two hyphens for single-line comments." },
  { lang: "lua", level: "beginner", topic: "Values", q: "What does nil mean in Lua?", correct: "No value", choices: ["True", "A loop", "A number"], explain: "nil represents absence of a useful value." },
  { lang: "lua", level: "intermediate", topic: "Tables", q: "Which structure stores key-value data in Lua?", correct: "table", choices: ["arraylist", "dictionary only", "object only"], explain: "Lua tables are flexible structures used for arrays, dictionaries, and object-like data." },
  { lang: "lua", level: "intermediate", topic: "Indexing", q: "What index does a typical Lua array-style table start at?", correct: "1", choices: ["0", "-1", "It cannot be indexed"], explain: "Lua conventionally uses 1-based indexing for array-style tables." },
  { lang: "lua", level: "intermediate", topic: "Functions", q: "What are Lua functions?", correct: "First-class values", choices: ["Only comments", "Only table keys", "Only numbers"], explain: "Functions can be stored in variables, passed around, and returned." },
  { lang: "lua", level: "advanced", topic: "Metatables", q: "What can metatables customize?", correct: "Behavior of tables and operations", choices: ["Browser viewport size", "HTML tags", "Image resolution only"], explain: "Metatables can define behavior such as operator handling and fallback lookups." },
  { lang: "lua", level: "advanced", topic: "Closures", q: "What is an upvalue in Lua?", correct: "An external local variable captured by a function", choices: ["A CSS variable", "A table that cannot change", "A syntax error"], explain: "Closures can capture local variables from surrounding scopes as upvalues." },
  { lang: "lua", level: "advanced", topic: "Coroutines", q: "What do coroutines support?", correct: "Cooperative pausing and resuming of execution", choices: ["Automatic CSS layout", "Compiling C++", "Deleting all tables"], explain: "Coroutines can yield and resume, enabling cooperative multitasking patterns." }
];

quizBank.push(
  { lang: "html", level: "advanced", topic: "SEO", q: "Why should a page usually have only one main <h1>?", correct: "It gives the document a clear primary topic", choices: ["Browsers refuse to load multiple h1 tags", "It makes all images smaller", "It automatically creates a sitemap"], explain: "A clear heading structure helps users, assistive tech, and search engines understand the page." },
  { lang: "html", level: "advanced", topic: "Forms", q: "What does the required attribute do?", correct: "Prevents form submission until the field has a value", choices: ["Encrypts the field", "Stores the value forever", "Changes the input into a button"], explain: "required is native browser validation for fields that must be completed before submit." },

  { lang: "css", level: "advanced", topic: "Specificity", q: "What does :where() do to selector specificity?", correct: "It gives the selector inside it zero specificity", choices: ["It makes every selector an ID", "It disables inheritance", "It only works in JavaScript"], explain: ":where() is useful for low-specificity defaults that are easy to override." },
  { lang: "css", level: "advanced", topic: "Grid", q: "What does minmax(0, 1fr) help prevent in grid layouts?", correct: "Grid items forcing tracks wider than expected", choices: ["All text becoming invisible", "Media queries being ignored", "Colors becoming invalid"], explain: "minmax(0, 1fr) lets a track shrink instead of being forced wider by overflowing content." },

  { lang: "javascript", level: "advanced", topic: "Event Loop", q: "What runs before the next macrotask in the JavaScript event loop?", correct: "Queued microtasks", choices: ["All CSS rules", "Only image downloads", "The browser cache"], explain: "Promise callbacks queue microtasks, which run before the event loop moves to the next macrotask." },
  { lang: "javascript", level: "advanced", topic: "Objects", q: "What does object destructuring do?", correct: "Pulls properties from an object into variables", choices: ["Deletes every property", "Converts an object to CSS", "Forces deep cloning"], explain: "Destructuring is syntax for extracting values, like const { name } = user." },

  { lang: "python", level: "advanced", topic: "Decorators", q: "What is a decorator in Python?", correct: "A callable that wraps or modifies another function", choices: ["A comment style", "A required class name", "A list sorting method only"], explain: "Decorators receive a function and return a function-like replacement or wrapper." },
  { lang: "python", level: "advanced", topic: "Scope", q: "What does nonlocal allow inside a nested function?", correct: "Assigning to a variable from the nearest enclosing scope", choices: ["Creating a global variable only", "Importing local files", "Changing indentation rules"], explain: "nonlocal lets nested functions rebind variables from an enclosing function scope." },

  { lang: "cpp", level: "advanced", topic: "Const Correctness", q: "What does const on a member function promise?", correct: "It will not modify the observable state of the object", choices: ["The function cannot be called", "The object becomes a template", "Memory is always freed"], explain: "const member functions can be called on const objects and should not mutate object state." },
  { lang: "cpp", level: "advanced", topic: "STL", q: "Why prefer std::vector over raw dynamic arrays in most cases?", correct: "It manages size and memory automatically", choices: ["It only stores strings", "It disables loops", "It makes code run in a browser"], explain: "std::vector handles allocation, cleanup, resizing, and bounds-aware helpers better than manual arrays." },

  { lang: "swift", level: "advanced", topic: "Value Types", q: "What is a major difference between struct and class in Swift?", correct: "Structs are value types and classes are reference types", choices: ["Structs can only store strings", "Classes cannot have methods", "They are exactly identical"], explain: "Value types are copied on assignment, while class instances are shared by reference." },
  { lang: "swift", level: "advanced", topic: "Error Handling", q: "What does try? do in Swift?", correct: "Converts a thrown error into an optional nil result", choices: ["Crashes immediately", "Retries forever", "Turns a value into a string"], explain: "try? returns an optional: the result on success or nil if an error is thrown." },

  { lang: "lua", level: "advanced", topic: "Environments", q: "What does _ENV control in Lua 5.2+?", correct: "The environment used for global variable lookups", choices: ["The screen size", "The CSS cascade", "Only math rounding"], explain: "_ENV is a table used to resolve globals within a chunk or function." },
  { lang: "lua", level: "advanced", topic: "Iteration", q: "What is the difference between pairs and ipairs?", correct: "pairs iterates table keys, while ipairs follows array-style integer keys", choices: ["They are always identical", "ipairs only prints strings", "pairs deletes nil values"], explain: "ipairs walks integer keys from 1 until the first nil; pairs iterates key-value pairs more generally." }
);

quizBank.push(
  { lang: "html", level: "beginner", topic: "Elements", q: "Which tag creates a paragraph?", correct: "<p>", choices: ["<para>", "<text>", "<line>"], explain: "<p> is the standard paragraph element." },
  { lang: "html", level: "beginner", topic: "Links", q: "Which attribute stores the destination of a link?", correct: "href", choices: ["src", "alt", "targetText"], explain: "href is the URL or path an anchor points to." },
  { lang: "html", level: "beginner", topic: "Forms", q: "Which input type is best for an email field?", correct: "email", choices: ["mailbox", "text-email", "address"], explain: "type='email' gives browsers email-specific validation and keyboard hints." },
  { lang: "html", level: "intermediate", topic: "Accessibility", q: "What should image alt text describe?", correct: "The useful meaning or content of the image", choices: ["Only the file name", "The image size in pixels", "Nothing if the image is important"], explain: "Alt text should communicate the image's purpose or content." },
  { lang: "html", level: "intermediate", topic: "Metadata", q: "Where should <meta charset='UTF-8'> usually go?", correct: "Inside the head element", choices: ["Inside every paragraph", "After the closing html tag", "Inside CSS"], explain: "Character encoding metadata belongs in the document head." },

  { lang: "css", level: "beginner", topic: "Selectors", q: "Which selector targets every <button> element?", correct: "button", choices: [".button", "#button", "*button"], explain: "An element selector uses the tag name without a dot or hash." },
  { lang: "css", level: "beginner", topic: "Box Model", q: "Which property adds space outside an element?", correct: "margin", choices: ["padding", "border-radius", "line-height"], explain: "margin creates space outside the border." },
  { lang: "css", level: "beginner", topic: "Layout", q: "Which property turns an element into a flex container?", correct: "display: flex", choices: ["position: flex", "align: flex", "layout: row"], explain: "display: flex enables flexbox layout for an element's children." },
  { lang: "css", level: "intermediate", topic: "Responsive", q: "What does a media query usually check?", correct: "Viewport or device conditions", choices: ["A user's password", "The number of HTML files", "Only JavaScript errors"], explain: "Media queries apply CSS based on conditions like viewport width." },
  { lang: "css", level: "intermediate", topic: "Grid", q: "Which property defines grid columns?", correct: "grid-template-columns", choices: ["grid-columns-only", "column-count-grid", "display-columns"], explain: "grid-template-columns sets the column tracks in a CSS grid." },

  { lang: "javascript", level: "beginner", topic: "Variables", q: "Which keyword should you use for a value that should not be reassigned?", correct: "const", choices: ["let", "change", "mutable"], explain: "const prevents reassignment of the variable binding." },
  { lang: "javascript", level: "beginner", topic: "DOM", q: "Which method changes the visible text inside an element?", correct: "textContent", choices: ["href", "src", "queryText"], explain: "textContent sets or reads the text content of a DOM node." },
  { lang: "javascript", level: "beginner", topic: "Events", q: "Which event fires when a button is clicked?", correct: "click", choices: ["hovered", "pressedDownForever", "buttoned"], explain: "click is the standard mouse/tap activation event." },
  { lang: "javascript", level: "intermediate", topic: "Arrays", q: "Which method keeps only items that pass a test?", correct: "filter()", choices: ["map()", "join()", "push()"], explain: "filter returns a new array containing items where the callback returns true." },
  { lang: "javascript", level: "intermediate", topic: "Objects", q: "How do you read the name property from user?", correct: "user.name", choices: ["user->name", "user/name", "name.user"], explain: "Dot notation reads properties from JavaScript objects." },

  { lang: "python", level: "beginner", topic: "Variables", q: "Which line creates a variable named score?", correct: "score = 10", choices: ["let score = 10", "int score: 10", "score :=: 10"], explain: "Python creates variables with assignment using =." },
  { lang: "python", level: "beginner", topic: "Loops", q: "Which function creates the numbers 0 through 4?", correct: "range(5)", choices: ["range(1,5)", "numbers(5)", "loop(5)"], explain: "range(5) produces 0, 1, 2, 3, 4." },
  { lang: "python", level: "beginner", topic: "Data", q: "Which literal creates a list?", correct: "[1, 2, 3]", choices: ["{1: 2}", "(1, 2, 3)", "<1, 2, 3>"], explain: "Square brackets create lists in Python." },
  { lang: "python", level: "intermediate", topic: "Functions", q: "What does return do in a function?", correct: "Sends a value back to the caller", choices: ["Prints automatically", "Starts a loop", "Imports a module"], explain: "return exits a function and gives a value back to where it was called." },
  { lang: "python", level: "intermediate", topic: "Scope", q: "Where is a variable created inside a function normally available?", correct: "Inside that function", choices: ["Every file forever", "Only inside CSS", "Nowhere"], explain: "Function variables are local unless explicitly returned or declared otherwise." },

  { lang: "cpp", level: "beginner", topic: "Variables", q: "Which line declares an integer named score?", correct: "int score;", choices: ["score int;", "integer score", "let score"], explain: "C++ declarations put the type before the variable name." },
  { lang: "cpp", level: "beginner", topic: "Headers", q: "Which directive includes a standard library header?", correct: "#include <iostream>", choices: ["import iostream", "using <iostream>", "load iostream"], explain: "#include pulls header declarations into a C++ source file." },
  { lang: "cpp", level: "intermediate", topic: "STL", q: "Which container is a resizable array?", correct: "std::vector", choices: ["std::map", "std::string", "std::cout"], explain: "std::vector stores items contiguously and can grow dynamically." },
  { lang: "cpp", level: "intermediate", topic: "Const Correctness", q: "What does const int x = 5 prevent?", correct: "Reassigning x later", choices: ["Using x in math", "Printing x", "Compiling the file"], explain: "const means the variable cannot be modified after initialization." },

  { lang: "swift", level: "beginner", topic: "Optionals", q: "Which value means no value in a Swift optional?", correct: "nil", choices: ["none()", "empty", "null only"], explain: "Swift optionals use nil to represent missing values." },
  { lang: "swift", level: "beginner", topic: "Types", q: "Which type stores true or false?", correct: "Bool", choices: ["BooleanValue", "Truth", "Bit"], explain: "Swift uses Bool for true/false values." },
  { lang: "swift", level: "intermediate", topic: "Functions", q: "Which keyword starts a Swift function declaration?", correct: "func", choices: ["def", "function", "fnc"], explain: "Swift declares functions with func." },
  { lang: "swift", level: "intermediate", topic: "Collections", q: "Which collection stores values in order?", correct: "Array", choices: ["Set only", "Dictionary only", "Protocol"], explain: "Arrays store ordered values." },

  { lang: "lua", level: "beginner", topic: "Output", q: "Which function prints text in Lua?", correct: "print()", choices: ["console.log()", "std::cout", "echo()"], explain: "Lua uses print() for simple output." },
  { lang: "lua", level: "beginner", topic: "Tables", q: "Which literal creates an empty table?", correct: "{}", choices: ["[]", "()", "<>"], explain: "Curly braces create tables in Lua." },
  { lang: "lua", level: "intermediate", topic: "Functions", q: "Which keyword ends a Lua function block?", correct: "end", choices: ["done", "stop", "}"], explain: "Lua closes function, if, and loop blocks with end." },
  { lang: "lua", level: "intermediate", topic: "Scope", q: "Why use local in Lua?", correct: "To avoid accidentally creating globals", choices: ["To print faster", "To make HTML tags", "To delete a table"], explain: "local keeps variables scoped and prevents accidental global state." }
);

const els = {
  language: $("languageSelect"),
  difficulty: $("difficultySelect"),
  length: $("lengthSelect"),
  start: $("startQuiz"),
  quizBox: $("quizBox"),
  resultsBox: $("resultsBox"),
  questionCount: $("questionCount"),
  scoreCount: $("scoreCount"),
  questionText: $("questionText"),
  answers: $("answers"),
  feedback: $("feedback"),
  next: $("nextBtn"),
  quit: $("quitBtn"),
  finalScore: $("finalScore"),
  finalMessage: $("finalMessage"),
  reviewList: $("reviewList"),
  practice: $("practiceBtn"),
  restart: $("restartBtn"),
  resetStats: $("resetStatsBtn"),
  attemptsStat: $("attemptsStat"),
  bestStat: $("bestStat"),
  averageStat: $("averageStat"),
  streakStat: $("streakStat"),
  weakTopicsText: $("weakTopicsText"),
  recommendedLessonTitle: $("recommendedLessonTitle"),
  recommendedLessonText: $("recommendedLessonText"),
  openRecommendedLesson: $("openRecommendedLesson"),
  profileMode: $("profileMode"),
  googleLogin: $("googleLoginBtn"),
  authMessage: $("authMessage"),
  lightMode: $("lightModeBtn"),
  darkMode: $("darkModeBtn"),
  settingsResetStats: $("settingsResetStatsBtn")
};

const emptyStats = { attempts: 0, totalPercent: 0, bestPercent: 0, streak: 0, questionsAnswered: 0, topicStats: {} };
const emptyProfile = { name: "Guest learner", provider: "local" };
let stats = loadStats();
let profile = loadProfile();
let theme = loadTheme();
let state = createEmptyState();

function createEmptyState() {
  return {
    questions: [],
    missed: [],
    answers: [],
    index: 0,
    score: 0,
    answered: false,
    practiceMode: false,
    finished: false
  };
}

function loadStats() {
  try {
    const saved = JSON.parse(localStorage.getItem("learnToCodeStats"));
    return { ...emptyStats, ...saved, topicStats: saved?.topicStats || {} };
  } catch {
    return { ...emptyStats };
  }
}

function loadProfile() {
  try {
    return { ...emptyProfile, ...JSON.parse(localStorage.getItem("learnToCodeProfile")) };
  } catch {
    return { ...emptyProfile };
  }
}

function loadTheme() {
  return localStorage.getItem("learnToCodeTheme") || "dark";
}

function saveStats() {
  localStorage.setItem("learnToCodeStats", JSON.stringify(stats));
  renderStats();
  renderPersonalization();
}

function saveProfile() {
  localStorage.setItem("learnToCodeProfile", JSON.stringify(profile));
  renderProfile();
}

function saveTheme(nextTheme) {
  theme = nextTheme;
  localStorage.setItem("learnToCodeTheme", theme);
  renderTheme();
}

function renderStats() {
  const average = stats.attempts ? Math.round(stats.totalPercent / stats.attempts) : 0;
  els.attemptsStat.textContent = stats.attempts;
  els.bestStat.textContent = `${stats.bestPercent}%`;
  els.averageStat.textContent = `${average}%`;
  els.streakStat.textContent = stats.streak;
}

function renderProfile() {
  if (profile.provider === "google") {
    els.profileMode.innerHTML = "";
    if (profile.picture) {
      const img = document.createElement("img");
      img.src = profile.picture;
      img.alt = "";
      img.className = "profile-avatar";
      els.profileMode.appendChild(img);
    }
    const span = document.createElement("span");
    span.textContent = `${profile.name || "Signed in"}${profile.email ? ` • ${profile.email}` : ""}`;
    els.profileMode.appendChild(span);
    els.authMessage.textContent = "Signed in and ready.";
    return;
  }
  els.profileMode.textContent = "Sign in to personalize this browser.";
}

function renderTheme() {
  document.body.dataset.theme = theme;
  els.lightMode.classList.toggle("active", theme === "light");
  els.darkMode.classList.toggle("active", theme === "dark");
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getPool() {
  const selectedLanguage = els.language.value;
  const selectedDifficulty = els.difficulty.value;
  const mappedLevel = levelMap[selectedDifficulty];
  return quizBank.filter((item) => {
    const languageMatch = selectedLanguage === "mixed" || item.lang === selectedLanguage;
    const levelMatch = selectedDifficulty === "mix" || item.level === mappedLevel;
    return languageMatch && levelMatch;
  });
}

function buildQuestions(pool) {
  const weightedPool = buildAdaptivePool(pool);
  const requestedLength = getRequestedLength(weightedPool.length);
  return weightedPool.slice(0, Math.min(requestedLength, weightedPool.length)).map((item) => {
    const options = shuffle([item.correct, ...item.choices]);
    return { ...item, options, correctIndex: options.indexOf(item.correct) };
  });
}

function buildAdaptivePool(pool) {
  const weighted = pool.map((item) => {
    const topic = stats.topicStats[getTopicKey(item)];
    const weakWeight = topic ? Math.max(0, topic.wrong - topic.correct) : 0;
    return { item, weight: 1 + weakWeight * 2 + (topic?.skipped || 0) };
  });

  const priority = [];
  const normal = [];
  weighted.forEach(({ item, weight }) => {
    for (let i = 0; i < weight; i++) priority.push(item);
    normal.push(item);
  });

  const picked = [];
  const used = new Set();
  shuffle(priority).forEach((item) => {
    if (!used.has(item.q)) {
      picked.push(item);
      used.add(item.q);
    }
  });
  shuffle(normal).forEach((item) => {
    if (!used.has(item.q)) {
      picked.push(item);
      used.add(item.q);
    }
  });
  return picked;
}

function getRequestedLength(poolLength) {
  if (els.length.value === "all") return poolLength;
  if (els.length.value !== "adaptive") return Number(els.length.value);
  const selectedDifficulty = els.difficulty.value;
  if (selectedDifficulty === "easy") return 8;
  if (selectedDifficulty === "medium") return 12;
  if (selectedDifficulty === "hard") return 15;
  return 18;
}

function startFullQuiz() {
  const pool = getPool();
  state = createEmptyState();
  state.questions = buildQuestions(pool);
  if (!state.questions.length) {
    els.feedback.textContent = "No questions match those settings yet.";
    return;
  }
  els.resultsBox.classList.add("hidden");
  els.quizBox.classList.remove("hidden");
  els.quit.classList.remove("hidden");
  loadQuestion();
}

function startPractice() {
  const missed = state.missed.length ? state.missed : state.answers.filter((item) => !item.wasCorrect).map((item) => item.original);
  if (!missed.length) return;
  state = createEmptyState();
  state.practiceMode = true;
  state.questions = missed.map((item) => {
    const options = shuffle([item.correct, ...item.choices]);
    return { ...item, options, correctIndex: options.indexOf(item.correct) };
  });
  els.resultsBox.classList.add("hidden");
  els.quizBox.classList.remove("hidden");
  els.quit.classList.remove("hidden");
  loadQuestion();
}

function loadQuestion() {
  const item = state.questions[state.index];
  state.answered = false;
  els.feedback.textContent = "";
  els.next.classList.add("hidden");
  els.questionCount.textContent = `Question ${state.index + 1} of ${state.questions.length} • ${formatLabel(item.lang)} • ${formatLabel(item.level)}${state.practiceMode ? " • Practice" : ""}`;
  els.scoreCount.textContent = `Score: ${state.score}`;
  els.questionText.textContent = item.q;
  els.answers.innerHTML = "";

  item.options.forEach((answer, answerIndex) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = answer;
    btn.addEventListener("click", () => chooseAnswer(btn, answerIndex));
    els.answers.appendChild(btn);
  });
}

function chooseAnswer(button, answerIndex) {
  if (state.answered) return;
  state.answered = true;
  const item = state.questions[state.index];
  const answerButtons = [...els.answers.querySelectorAll("button")];
  const wasCorrect = answerIndex === item.correctIndex;

  answerButtons.forEach((btn) => {
    btn.disabled = true;
    if (btn.textContent === item.correct) btn.classList.add("correct");
  });

  if (wasCorrect) {
    state.score++;
    els.feedback.textContent = "Correct. Nice debugging.";
  } else {
    button.classList.add("wrong");
    state.missed.push(item);
    els.feedback.textContent = item.explain;
  }

  state.answers.push({
    question: item.q,
    chosen: item.options[answerIndex],
    correct: item.correct,
    wasCorrect,
    explain: item.explain,
    language: item.lang,
    level: item.level,
    topic: item.topic,
    original: item
  });
  updateTopicStats(item, wasCorrect ? "correct" : "wrong");

  els.scoreCount.textContent = `Score: ${state.score}`;
  els.next.classList.remove("hidden");
}

function nextQuestion() {
  state.index++;
  if (state.index >= state.questions.length) {
    showResults();
    return;
  }
  loadQuestion();
}

function showResults() {
  if (state.finished) return;
  recordSkippedQuestions();
  state.finished = true;
  els.quizBox.classList.add("hidden");
  els.resultsBox.classList.remove("hidden");
  els.quit.classList.add("hidden");

  const percent = Math.round((state.score / state.questions.length) * 100);
  els.finalScore.textContent = `Score: ${state.score}/${state.questions.length} (${percent}%)`;
  els.finalMessage.textContent = buildResultMessage(percent, state.missed.length);

  if (!state.practiceMode) {
    stats.attempts++;
    stats.totalPercent += percent;
    stats.bestPercent = Math.max(stats.bestPercent, percent);
    stats.questionsAnswered += state.questions.length;
    stats.streak = percent >= 80 ? stats.streak + 1 : 0;
  }
  saveStats();

  renderReview();
}

function recordSkippedQuestions() {
  const startAt = state.answered ? state.index + 1 : state.index;
  const skipped = state.questions.slice(startAt);
  skipped.forEach((item) => {
    state.missed.push(item);
    state.answers.push({
      question: item.q,
      chosen: "Skipped",
      correct: item.correct,
      wasCorrect: false,
      explain: item.explain,
      language: item.lang,
      level: item.level,
      topic: item.topic,
      original: item
    });
    updateTopicStats(item, "skipped");
  });
}

function renderReview() {
  els.reviewList.innerHTML = "";
  const wrongAnswers = state.answers.filter((item) => !item.wasCorrect);

  if (!wrongAnswers.length) {
    const item = document.createElement("div");
    item.className = "review-item";
    item.append(createStrong("No mistakes"), createParagraph("You answered every question correctly.", "explain"));
    els.reviewList.appendChild(item);
    els.practice.classList.add("hidden");
    return;
  }

  els.practice.classList.remove("hidden");
  wrongAnswers.forEach((answer) => {
    const item = document.createElement("div");
    item.className = "review-item";
    item.append(
      createStrong(`${formatLabel(answer.language)} • ${formatLabel(answer.level)} • ${answer.topic}`),
      createParagraph(answer.question, "review-question"),
      createParagraph(`Your answer: ${answer.chosen}`, "wrong-text"),
      createParagraph(`Correct answer: ${answer.correct}`, "correct-text"),
      createParagraph(answer.explain, "explain")
    );
    els.reviewList.appendChild(item);
  });
}

function updateTopicStats(item, result) {
  const key = getTopicKey(item);
  const current = stats.topicStats[key] || {
    lang: item.lang,
    level: item.level,
    topic: item.topic,
    correct: 0,
    wrong: 0,
    skipped: 0
  };
  current[result]++;
  stats.topicStats[key] = current;
}

function getTopicKey(item) {
  return `${item.lang}:${item.level}:${item.topic}`;
}

function getWeakTopics() {
  return Object.values(stats.topicStats || {})
    .map((topic) => ({
      ...topic,
      weakness: topic.wrong * 2 + topic.skipped * 2 - topic.correct
    }))
    .filter((topic) => topic.weakness > 0)
    .sort((a, b) => b.weakness - a.weakness);
}

function renderPersonalization() {
  const weakTopics = getWeakTopics();
  if (!weakTopics.length) {
    els.weakTopicsText.textContent = "Take a quiz and this will show your weakest topics.";
    els.recommendedLessonTitle.textContent = "Take a quiz to unlock your recommendation.";
    els.recommendedLessonText.textContent = "Your missed topics will appear here so practice gets more personal over time.";
    els.openRecommendedLesson.dataset.lesson = "";
    return;
  }

  const top = weakTopics[0];
  const topThree = weakTopics.slice(0, 3).map((topic) => `${formatLabel(topic.lang)} ${topic.topic}`).join(", ");
  const lessonId = lessonByLanguage[top.lang] || topicLessonMap[top.topic] || "javascript-dom";
  const lesson = lessonLibrary[lessonId] || lessonLibrary["javascript-dom"];

  els.weakTopicsText.textContent = `Focus next: ${topThree}. Future quizzes will show more of these until your score improves.`;
  els.recommendedLessonTitle.textContent = lesson.title;
  els.recommendedLessonText.textContent = `Recommended because you missed ${formatLabel(top.lang)} ${top.topic} questions.`;
  els.openRecommendedLesson.dataset.lesson = lessonId;
}

function openLessonById(lessonId) {
  const lesson = lessonLibrary[lessonId];
  if (!lesson) return;
  $("lessonTitle").textContent = lesson.title;
  $("lessonText").textContent = lesson.text;
  $("lessonSteps").innerHTML = "";
  lesson.steps.forEach((step) => {
    const li = document.createElement("li");
    li.textContent = step;
    $("lessonSteps").appendChild(li);
  });
  $("lessonBox").classList.remove("hidden");
}

function createStrong(text) {
  const strong = document.createElement("strong");
  strong.textContent = text;
  return strong;
}

function createParagraph(text, className) {
  const p = document.createElement("p");
  p.className = className;
  p.textContent = text;
  return p;
}

function buildResultMessage(percent, missedCount) {
  if (percent === 100) return "Perfect run. Try Advanced or Mixed mode next.";
  if (percent >= 80) return `Strong work. Review ${missedCount} missed question${missedCount === 1 ? "" : "s"} to lock it in.`;
  if (percent >= 60) return `Good start. Practice the missed questions, then rerun the same settings.`;
  return "This is exactly what practice mode is for. Review the explanations and try the missed set.";
}

function formatLabel(value) {
  if (value === "cpp") return "C++";
  if (value === "html") return "HTML";
  if (value === "css") return "CSS";
  if (levelNames[value]) return levelNames[value];
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function resetStats() {
  stats = { ...emptyStats };
  saveStats();
}

function showGoogleSetupMessage() {
  if (!window.google?.accounts?.id) {
    els.authMessage.textContent = "Google sign-in is still loading.";
    return;
  }
  els.authMessage.textContent = "Choose your Google account.";
  window.google.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
      els.authMessage.textContent = "Google did not show the prompt here. Try refreshing, or open this site in Chrome/Safari.";
    }
  });
}

function initializeGoogleAuth() {
  if (!window.google?.accounts?.id) {
    window.setTimeout(initializeGoogleAuth, 300);
    return;
  }

  window.google.accounts.id.initialize({
    client_id: googleClientId,
    callback: handleGoogleCredential,
    auto_select: false,
    cancel_on_tap_outside: true
  });

  els.authMessage.textContent = profile.provider === "google" ? "Signed in and ready." : "Ready to sign in.";
}

function handleGoogleCredential(response) {
  try {
    const user = decodeJwt(response.credential);
    profile = {
      name: user.name || user.given_name || "Google learner",
      email: user.email || "",
      picture: user.picture || "",
      provider: "google"
    };
    saveProfile();
    els.authMessage.textContent = "Signed in and ready.";
  } catch {
    els.authMessage.textContent = "Sign-in worked, but the profile could not be read.";
  }
}

function decodeJwt(token) {
  const payload = token.split(".")[1];
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(atob(normalized).split("").map((char) => {
    return `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`;
  }).join(""));
  return JSON.parse(json);
}

els.start.addEventListener("click", startFullQuiz);
els.restart.addEventListener("click", startFullQuiz);
els.practice.addEventListener("click", startPractice);
els.next.addEventListener("click", nextQuestion);
els.quit.addEventListener("click", showResults);
els.resetStats.addEventListener("click", resetStats);
els.settingsResetStats.addEventListener("click", resetStats);
els.googleLogin.addEventListener("click", showGoogleSetupMessage);
els.lightMode.addEventListener("click", () => saveTheme("light"));
els.darkMode.addEventListener("click", () => saveTheme("dark"));
els.openRecommendedLesson.addEventListener("click", () => openLessonById(els.openRecommendedLesson.dataset.lesson));
document.querySelectorAll("[data-lesson]").forEach((button) => {
  button.addEventListener("click", () => openLessonById(button.dataset.lesson));
});

renderStats();
renderProfile();
renderTheme();
renderPersonalization();
initializeGoogleAuth();

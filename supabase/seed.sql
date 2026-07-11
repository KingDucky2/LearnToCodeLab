insert into public.learning_paths (slug, title, description, color, sort_order) values
('html', 'HTML', 'Structure real pages with semantic markup, forms, media, accessibility, and metadata.', 'from-sky-400 to-blue-600', 1),
('css', 'CSS', 'Turn structure into responsive interfaces with layout, spacing, cascade, and motion.', 'from-cyan-400 to-teal-500', 2),
('javascript', 'JavaScript', 'Program browser behavior with variables, functions, arrays, DOM events, and async logic.', 'from-yellow-300 to-amber-500', 3),
('python', 'Python', 'Learn programming fundamentals, automation, data structures, modules, and debugging.', 'from-blue-500 to-emerald-400', 4),
('cpp', 'C++', 'Practice syntax, types, functions, references, memory, STL containers, and systems thinking.', 'from-indigo-500 to-blue-700', 5),
('swift', 'Swift', 'Understand Swift values, optionals, functions, collections, protocols, and app-ready patterns.', 'from-orange-400 to-red-500', 6),
('lua', 'Lua', 'Learn lightweight scripting with tables, functions, scope, metatables, and coroutines.', 'from-violet-500 to-sky-500', 7)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  color = excluded.color,
  sort_order = excluded.sort_order;

insert into public.questions (language_slug, topic, question_type, prompt, choices, correct_answer, explanation, mistake_category, difficulty) values
('html', 'Elements', 'multiple_choice', 'Which tag should be used for the main visible heading?', '["<head>", "<title>", "<section>"]', '<h1>', '<h1> is the highest-level visible page heading.', 'semantic markup', 'foundation'),
('css', 'Layout', 'multiple_choice', 'Which layout system is best for rows and columns?', '["float", "inline-block only", "text-align"]', 'CSS Grid', 'Grid is designed for two-dimensional rows and columns.', 'layout selection', 'foundation'),
('javascript', 'DOM', 'debug', 'Why can addEventListener throw when attaching to a button?', '["The event is always wrong", "Buttons cannot use events", "CSS is missing"]', 'The selected element was not found', 'If querySelector returns null, there is no element to attach the listener to.', 'null DOM selection', 'foundation'),
('python', 'Loops', 'predict_output', 'What does range(5) produce?', '["1 through 5", "0 through 5", "5 only"]', '0 through 4', 'range(5) starts at 0 and stops before 5.', 'off-by-one', 'foundation'),
('cpp', 'Syntax', 'multiple_choice', 'Which symbol ends most C++ statements?', '[":", ".", ","]', ';', 'Most C++ statements end with a semicolon.', 'syntax error', 'foundation'),
('swift', 'Optionals', 'multiple_choice', 'What does an optional represent?', '["A forced crash", "Only a string", "A CSS property"]', 'A value that may be present or nil', 'Optionals make missing values explicit in Swift.', 'type concept', 'foundation'),
('lua', 'Tables', 'multiple_choice', 'Which structure stores key-value data in Lua?', '["arraylist", "dictionary only", "object only"]', 'table', 'Lua tables are flexible structures used for arrays and key-value data.', 'data structures', 'foundation');

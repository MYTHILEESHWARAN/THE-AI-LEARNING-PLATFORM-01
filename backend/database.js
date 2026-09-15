/* ═══════════════════════════════════════════════════════════════
   database.js — NeDB Database Setup & Seed Data
   Uses nedb-promises (pure JS, no native compilation needed)
═══════════════════════════════════════════════════════════════ */
const Datastore = require('nedb-promises');
const bcrypt    = require('bcryptjs');
const path      = require('path');
const fs        = require('fs');

const DB_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

// ─── Collections ──────────────────────────────────────────────
const db = {
  users:          Datastore.create({ filename: path.join(DB_DIR, 'users.db'),            autoload: true }),
  courses:        Datastore.create({ filename: path.join(DB_DIR, 'courses.db'),          autoload: true }),
  modules:        Datastore.create({ filename: path.join(DB_DIR, 'modules.db'),          autoload: true }),
  lessons:        Datastore.create({ filename: path.join(DB_DIR, 'lessons.db'),          autoload: true }),
  enrollments:    Datastore.create({ filename: path.join(DB_DIR, 'enrollments.db'),      autoload: true }),
  lessonProgress: Datastore.create({ filename: path.join(DB_DIR, 'progress.db'),         autoload: true }),
  quizzes:        Datastore.create({ filename: path.join(DB_DIR, 'quizzes.db'),          autoload: true }),
  questions:      Datastore.create({ filename: path.join(DB_DIR, 'questions.db'),        autoload: true }),
  quizAttempts:   Datastore.create({ filename: path.join(DB_DIR, 'attempts.db'),         autoload: true }),
  studyTasks:     Datastore.create({ filename: path.join(DB_DIR, 'tasks.db'),            autoload: true }),
  achievements:   Datastore.create({ filename: path.join(DB_DIR, 'achievements.db'),     autoload: true }),
  notifications:  Datastore.create({ filename: path.join(DB_DIR, 'notifications.db'),    autoload: true }),
  codingProblems: Datastore.create({ filename: path.join(DB_DIR, 'coding_problems.db'), autoload: true }),
  codeSubmissions:Datastore.create({ filename: path.join(DB_DIR, 'code_submissions.db'),autoload: true }),
};

// Ensure unique indexes
async function ensureIndexes() {
  await db.users.ensureIndex({ fieldName: 'email', unique: true });
  await db.enrollments.ensureIndex({ fieldName: 'user_course', unique: true });
  await db.lessonProgress.ensureIndex({ fieldName: 'user_lesson', unique: true });
  await db.achievements.ensureIndex({ fieldName: 'user_ach', unique: true });
}

// ─── Seed Data ────────────────────────────────────────────────
async function seedData() {
  const existingUsers = await db.users.count({});
  const existingProblems = await db.codingProblems.count({});
  if (existingUsers > 0 && existingProblems > 0) return; // Already seeded

  console.log('[DB] Seeding database...');

  if (existingUsers === 0) {

  // ── Users ──
  const studentHash = await bcrypt.hash('student123', 12);
  const adminHash   = await bcrypt.hash('admin123', 12);
  const now = new Date().toISOString();

  const student = await db.users.insert({ _id: 'user_student', name: 'Alex Johnson', email: 'student@demo.com', password: studentHash, role: 'student', bio: 'Passionate about technology and lifelong learning.', avatar: null, created_at: now, last_login: null });
  const admin   = await db.users.insert({ _id: 'user_admin',   name: 'Admin User',   email: 'admin@demo.com',   password: adminHash,   role: 'admin',   bio: 'Platform administrator.', avatar: null, created_at: now, last_login: null });

  // ── Courses ──
  const courses = [
    { _id: 'course_python', title: 'Python Programming',           description: 'Master Python from basics to advanced OOP, file handling, and automation. Build real-world projects step by step.',          category: 'Programming',      level: 'Beginner',     duration: '24 hours', instructor: 'Dr. Sarah Chen',   rating: 4.8, students: 3241, color: '#3b82f6', icon: '🐍' },
    { _id: 'course_java',   title: 'Java Programming',             description: 'Learn Java fundamentals, OOP principles, collections, streams, and Spring Boot basics for enterprise development.',          category: 'Programming',      level: 'Intermediate', duration: '32 hours', instructor: 'Prof. James Miller',rating: 4.7, students: 2876, color: '#f59e0b', icon: '☕' },
    { _id: 'course_dsa',    title: 'Data Structures & Algorithms', description: 'Deep dive into arrays, linked lists, trees, graphs, sorting, searching, and dynamic programming for coding interviews.',   category: 'Computer Science', level: 'Intermediate', duration: '40 hours', instructor: 'Dr. Emma Wilson',  rating: 4.9, students: 4102, color: '#a855f7', icon: '🔗' },
    { _id: 'course_web',    title: 'Web Development',              description: 'Full-stack web development with HTML, CSS, JavaScript, React, Node.js, and databases — from zero to deployment.',            category: 'Web',              level: 'Beginner',     duration: '60 hours', instructor: 'Alex Turner',      rating: 4.6, students: 5830, color: '#10b981', icon: '🌐' },
    { _id: 'course_db',     title: 'Database Management',          description: 'SQL, database design, normalization, transactions, indexing performance, and NoSQL with MongoDB.',                          category: 'Database',         level: 'Intermediate', duration: '20 hours', instructor: 'Prof. Linda Park', rating: 4.5, students: 1987, color: '#ef4444', icon: '🗄️' },
    { _id: 'course_ai',     title: 'Artificial Intelligence',      description: 'Introduction to AI: search algorithms, knowledge representation, planning, natural language processing, and AI ethics.',    category: 'AI/ML',            level: 'Advanced',     duration: '36 hours', instructor: 'Dr. Robert Zhang', rating: 4.8, students: 2654, color: '#00d4ff', icon: '🤖' },
    { _id: 'course_ml',     title: 'Machine Learning',             description: 'Supervised, unsupervised learning, neural networks, model evaluation, and hands-on projects with scikit-learn/TensorFlow.', category: 'AI/ML',            level: 'Advanced',     duration: '44 hours', instructor: 'Dr. Priya Sharma', rating: 4.9, students: 3387, color: '#f472b6', icon: '🧠' },
    { _id: 'course_cyber',  title: 'Cybersecurity',                description: 'Network security, cryptography, ethical hacking, OWASP Top 10, penetration testing, and security best practices.',         category: 'Security',         level: 'Intermediate', duration: '28 hours', instructor: 'Marcus Reed',      rating: 4.7, students: 2198, color: '#10ffb0', icon: '🔐' },
  ];
  for (const c of courses) await db.courses.insert(c);

  // ── Modules & Lessons ──
  const moduleData = {
    course_python: [
      { title: 'Getting Started with Python', lessons: ['Introduction & Installation', 'Variables & Data Types', 'Control Flow: if/else/loops', 'Functions & Scope'] },
      { title: 'Data Structures',             lessons: ['Lists & Tuples', 'Dictionaries & Sets', 'List Comprehensions', 'String Manipulation'] },
      { title: 'Object-Oriented Python',      lessons: ['Classes & Objects', 'Inheritance & Polymorphism', 'Special Methods', 'Decorators'] },
      { title: 'Advanced Topics',             lessons: ['File I/O', 'Error Handling', 'Modules & Packages', 'Final Project: Automation Script'] },
    ],
    course_web: [
      { title: 'HTML & CSS Fundamentals', lessons: ['HTML Structure & Semantics', 'CSS Selectors & Box Model', 'Flexbox & Grid', 'Responsive Design'] },
      { title: 'JavaScript Essentials',   lessons: ['Variables & Functions', 'DOM Manipulation', 'Events & Async JS', 'Fetch API & JSON'] },
      { title: 'React Basics',            lessons: ['Components & JSX', 'State & Props', 'Hooks (useState, useEffect)', 'React Router'] },
      { title: 'Backend with Node.js',    lessons: ['Express Setup', 'REST API Design', 'Authentication', 'Database Integration'] },
    ],
    course_dsa: [
      { title: 'Arrays & Strings',       lessons: ['Array Operations', 'Two Pointer Technique', 'Sliding Window', 'String Algorithms'] },
      { title: 'Linked Lists & Stacks',  lessons: ['Singly Linked List', 'Doubly Linked List', 'Stack & Queue', 'Applications'] },
      { title: 'Trees & Graphs',         lessons: ['Binary Trees', 'BST Operations', 'Graph Representation', 'BFS & DFS'] },
      { title: 'Sorting & Dynamic Prog', lessons: ['Merge Sort & Quick Sort', 'Heap Sort', 'DP Fundamentals', 'Classic DP Problems'] },
    ],
  };

  const genericCourses = ['course_java', 'course_db', 'course_ai', 'course_ml', 'course_cyber'];
  const genericMods = [
    { title: 'Introduction & Fundamentals', lessons: ['Course Overview', 'Setting Up Environment', 'Core Concepts', 'First Project'] },
    { title: 'Core Concepts',               lessons: ['Deep Dive Part 1', 'Deep Dive Part 2', 'Practical Examples', 'Mini Exercise'] },
    { title: 'Advanced Topics',             lessons: ['Advanced Feature 1', 'Advanced Feature 2', 'Best Practices', 'Common Mistakes'] },
    { title: 'Projects & Practice',         lessons: ['Project Planning', 'Building the Project', 'Testing & Debugging', 'Final Submission'] },
  ];
  for (const cid of genericCourses) moduleData[cid] = genericMods;

  for (const [courseId, mods] of Object.entries(moduleData)) {
    for (let mi = 0; mi < mods.length; mi++) {
      const mod = mods[mi];
      const modId = `mod_${courseId}_${mi}`;
      await db.modules.insert({ _id: modId, course_id: courseId, title: mod.title, order_index: mi });
      for (let li = 0; li < mod.lessons.length; li++) {
        const lessonTitle = mod.lessons[li];
        const lessonId = `lesson_${modId}_${li}`;
        const content = `# ${lessonTitle}\n\nThis lesson covers **${lessonTitle}**. You will learn key concepts, see practical examples, and complete hands-on exercises.\n\n## Learning Objectives\n- Understand core concepts of ${lessonTitle}\n- Apply knowledge through practical exercises\n- Build on previous lessons in ${mod.title}\n\n## Key Concepts\n\n### Concept 1\nThe foundational idea behind this topic involves understanding how it fits into the broader curriculum.\n\n### Concept 2\nPractical application requires both theoretical knowledge and hands-on practice. Work through each example carefully.\n\n### Concept 3\nReal-world scenarios help solidify understanding. Think about how you would apply this in a project.\n\n## Practice Exercise\nComplete the practice questions at the end of this lesson to test your understanding before moving on.`;
        await db.lessons.insert({ _id: lessonId, module_id: modId, course_id: courseId, title: lessonTitle, content, duration: `${8 + li * 3} min`, order_index: li });
      }
    }
  }

  // ── Enrollments & Progress ──
  await db.enrollments.insert({ _id: 'enroll_1', user_id: 'user_student', course_id: 'course_python', enrolled_at: now, user_course: 'user_student_course_python' });
  await db.enrollments.insert({ _id: 'enroll_2', user_id: 'user_student', course_id: 'course_web',    enrolled_at: now, user_course: 'user_student_course_web' });
  await db.enrollments.insert({ _id: 'enroll_3', user_id: 'user_student', course_id: 'course_dsa',    enrolled_at: now, user_course: 'user_student_course_dsa' });

  const completedLessons = ['lesson_mod_course_python_0_0','lesson_mod_course_python_0_1','lesson_mod_course_python_0_2','lesson_mod_course_python_1_0','lesson_mod_course_web_0_0','lesson_mod_course_web_0_1'];
  for (let i = 0; i < completedLessons.length; i++) {
    const lid = completedLessons[i];
    const cid = lid.includes('python') ? 'course_python' : lid.includes('web') ? 'course_web' : 'course_dsa';
    await db.lessonProgress.insert({ _id: `prog_${i}`, user_id: 'user_student', lesson_id: lid, course_id: cid, completed_at: now, user_lesson: `user_student_${lid}` });
  }

  // ── Quizzes ──
  const quizDefs = [
    { _id: 'quiz_python',   title: 'Python Basics Quiz',     description: 'Test your Python fundamentals',     category: 'Programming',      difficulty: 'Easy',   time_limit: 10, course_id: 'course_python' },
    { _id: 'quiz_dsa',      title: 'Data Structures Quiz',   description: 'Arrays, lists, trees, and graphs',  category: 'Computer Science', difficulty: 'Medium', time_limit: 15, course_id: 'course_dsa' },
    { _id: 'quiz_web',      title: 'Web Development Quiz',   description: 'HTML, CSS, JavaScript essentials',  category: 'Web',              difficulty: 'Easy',   time_limit: 10, course_id: 'course_web' },
    { _id: 'quiz_ai',       title: 'AI Fundamentals Quiz',   description: 'Artificial intelligence concepts',  category: 'AI/ML',            difficulty: 'Hard',   time_limit: 20, course_id: 'course_ai' },
    { _id: 'quiz_security', title: 'Cybersecurity Quiz',     description: 'Security concepts and practices',   category: 'Security',         difficulty: 'Medium', time_limit: 15, course_id: 'course_cyber' },
  ];
  for (const q of quizDefs) await db.quizzes.insert(q);

  const questionData = {
    quiz_python: [
      { q: 'What is the correct way to define a function in Python?', opts: ['function myFunc():', 'def myFunc():', 'func myFunc():', 'define myFunc():'], ci: 1, exp: 'In Python, functions are defined using the "def" keyword.' },
      { q: 'Which data type is MUTABLE in Python?', opts: ['String', 'Tuple', 'List', 'Integer'], ci: 2, exp: 'Lists are mutable — you can change elements after creation.' },
      { q: 'What does len([1, 2, 3, 4]) return?', opts: ['3', '4', '5', 'Error'], ci: 1, exp: 'len() returns the number of items. [1,2,3,4] has 4 elements.' },
      { q: 'How do you start a comment in Python?', opts: ['//', '#', '/*', '--'], ci: 1, exp: 'Python uses the # symbol to start single-line comments.' },
      { q: 'What is the output of print(type(3.14))?', opts: ["<class 'int'>", "<class 'float'>", "<class 'double'>", "<class 'number'>"], ci: 1, exp: '3.14 is a float, so type() returns <class float>.' },
    ],
    quiz_dsa: [
      { q: 'What is the time complexity of binary search?', opts: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], ci: 1, exp: 'Binary search halves the search space each step: O(log n).' },
      { q: 'Which data structure follows LIFO?', opts: ['Queue', 'Stack', 'Array', 'Linked List'], ci: 1, exp: 'Stack follows LIFO — Last In, First Out.' },
      { q: 'Worst-case time complexity of QuickSort?', opts: ['O(n log n)', 'O(n)', 'O(n²)', 'O(log n)'], ci: 2, exp: 'QuickSort is O(n²) worst-case when pivot is always smallest/largest.' },
      { q: 'In a BST, where is the smallest element?', opts: ['Root', 'Rightmost node', 'Leftmost node', 'Last level'], ci: 2, exp: 'In a BST, smaller values go left, so the leftmost node is smallest.' },
      { q: 'Which traversal visits Left → Root → Right?', opts: ['Preorder', 'Inorder', 'Postorder', 'Level-order'], ci: 1, exp: 'Inorder traversal: Left, Root, Right. Gives sorted output for BST.' },
    ],
    quiz_web: [
      { q: 'Which HTML tag is used for the largest heading?', opts: ['<h6>', '<head>', '<h1>', '<title>'], ci: 2, exp: '<h1> is the largest heading. Headings go from <h1> to <h6>.' },
      { q: 'Which CSS property changes text color?', opts: ['font-color', 'text-color', 'color', 'foreground'], ci: 2, exp: 'The "color" property sets the color of text in CSS.' },
      { q: 'What does DOM stand for?', opts: ['Document Object Model', 'Data Object Manager', 'Desktop Output Module', 'Design Object Method'], ci: 0, exp: 'DOM = Document Object Model — HTML as a tree structure.' },
      { q: 'Which JS method selects an element by ID?', opts: ['querySelector()', 'getElement()', 'getElementById()', 'selectById()'], ci: 2, exp: 'getElementById() returns the element with the specified ID.' },
      { q: 'What does CSS "flex: 1" mean?', opts: ['Fixed width 1px', 'Element grows to fill space', 'Single column', 'Font size 1rem'], ci: 1, exp: 'flex: 1 is shorthand for flex-grow: 1 — element fills available space.' },
    ],
    quiz_ai: [
      { q: 'What type of AI learns from labeled training data?', opts: ['Unsupervised Learning', 'Reinforcement Learning', 'Supervised Learning', 'Transfer Learning'], ci: 2, exp: 'Supervised learning uses labeled input-output pairs to train models.' },
      { q: 'Which algorithm mimics the human brain?', opts: ['Decision Tree', 'Neural Network', 'K-Means', 'Linear Regression'], ci: 1, exp: 'Neural networks are inspired by the structure of the human brain.' },
      { q: 'What does "overfitting" mean in ML?', opts: ['Model too simple', 'Model performs perfectly', 'Model memorizes training data, poor generalization', 'Model trains too fast'], ci: 2, exp: 'Overfitting = model learns training noise, fails on new data.' },
      { q: 'What is the Turing Test?', opts: ['CPU benchmark', 'Test if machine exhibits human-like intelligence', 'Database query test', 'Graphics test'], ci: 1, exp: 'Turing Test (1950): machine passes if it can converse like a human.' },
      { q: 'What is "gradient descent" used for?', opts: ['Data visualization', 'Minimizing loss during training', 'Sorting datasets', 'Loading models'], ci: 1, exp: 'Gradient descent minimizes the loss function by adjusting model weights.' },
    ],
    quiz_security: [
      { q: 'What does SQL injection exploit?', opts: ['Weak passwords', 'Unvalidated user input in SQL queries', 'Slow servers', 'Outdated browsers'], ci: 1, exp: 'SQL injection inserts malicious SQL via unvalidated inputs.' },
      { q: 'What does HTTPS provide over HTTP?', opts: ['Faster speeds', 'Encrypted communication', 'More features', 'Better SEO only'], ci: 1, exp: 'HTTPS uses TLS/SSL encryption for secure data transfer.' },
      { q: 'What is a "zero-day" vulnerability?', opts: ['Bug fixed on release', 'Unknown flaw with no patch', '24-hour security window', 'Midnight code issue'], ci: 1, exp: 'Zero-day = previously unknown flaw exploited before a patch exists.' },
      { q: 'Which hashing algorithm is NOT recommended for passwords?', opts: ['bcrypt', 'Argon2', 'MD5', 'scrypt'], ci: 2, exp: 'MD5 is cryptographically broken. Use bcrypt, Argon2, or scrypt.' },
      { q: 'What is phishing?', opts: ['Network sniffing', 'Social engineering to steal credentials', 'DoS attack', 'Port scanning'], ci: 1, exp: 'Phishing tricks users into revealing credentials via fake sites/emails.' },
    ],
  };

  for (const [qid, qs] of Object.entries(questionData)) {
    for (let i = 0; i < qs.length; i++) {
      const q = qs[i];
      await db.questions.insert({ _id: `q_${qid}_${i}`, quiz_id: qid, question: q.q, options: q.opts, correct_index: q.ci, explanation: q.exp, order_index: i });
    }
  }

  // ── Sample Attempts ──
  const d1 = new Date(Date.now() - 2*86400000).toISOString();
  const d2 = new Date(Date.now() - 86400000).toISOString();
  await db.quizAttempts.insert({ _id: 'attempt_1', user_id: 'user_student', quiz_id: 'quiz_python', score: 4, total: 5, percentage: 80,  answers: {}, attempted_at: d1 });
  await db.quizAttempts.insert({ _id: 'attempt_2', user_id: 'user_student', quiz_id: 'quiz_web',    score: 5, total: 5, percentage: 100, answers: {}, attempted_at: d2 });

  // ── Achievements ──
  await db.achievements.insert({ _id: 'ach_1', user_id: 'user_student', achievement_id: 'first_login',   title: 'Welcome Aboard',  description: 'Created your account',         icon: '🎉', earned_at: now, user_ach: 'user_student_first_login' });
  await db.achievements.insert({ _id: 'ach_2', user_id: 'user_student', achievement_id: 'first_enroll',  title: 'Eager Learner',   description: 'Enrolled in your first course', icon: '📚', earned_at: now, user_ach: 'user_student_first_enroll' });
  await db.achievements.insert({ _id: 'ach_3', user_id: 'user_student', achievement_id: 'quiz_perfect',  title: 'Quiz Champion',   description: 'Scored 100% on a quiz',        icon: '🏆', earned_at: d2,  user_ach: 'user_student_quiz_perfect' });

  // ── Notifications ──
  await db.notifications.insert({ _id: 'notif_1', user_id: 'user_student', title: 'Welcome to Learning Platform! 🎉', message: 'Start your journey by exploring our courses.', type: 'info',    read: false, created_at: now });
  await db.notifications.insert({ _id: 'notif_2', user_id: 'user_student', title: '🏆 Achievement Unlocked!',         message: 'You earned "Quiz Champion" for scoring 100% on Web Dev Quiz!', type: 'success', read: false, created_at: d2 });
  await db.notifications.insert({ _id: 'notif_3', user_id: 'user_student', title: 'New Course: Machine Learning',     message: 'Machine Learning is now available. Enroll today!', type: 'info',    read: false, created_at: d1 });
  await db.notifications.insert({ _id: 'notif_4', user_id: 'user_student', title: '📅 Study Reminder',               message: 'You have a study task due tomorrow. Don\'t forget!', type: 'warning', read: true,  created_at: d1 });

  // ── Study Tasks ──
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayafter = new Date(Date.now() + 172800000).toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  await db.studyTasks.insert({ _id: 'task_1', user_id: 'user_student', title: 'Complete Python Chapter 2', subject: 'Python Programming', duration: 60, due_date: tomorrow,  completed: false, completed_at: null, created_at: now });
  await db.studyTasks.insert({ _id: 'task_2', user_id: 'user_student', title: 'Practice DSA Problems',    subject: 'Data Structures',    duration: 45, due_date: dayafter,  completed: false, completed_at: null, created_at: now });
  await db.studyTasks.insert({ _id: 'task_3', user_id: 'user_student', title: 'Review HTML Basics',       subject: 'Web Development',    duration: 30, due_date: yesterday, completed: true,  completed_at: d1,   created_at: d2 });
  }

  // ── Coding Practice Problems ──
  const codingProblems = [
    {
      _id: 'prob_hello_world',
      title: 'Hello World',
      description: 'Write a program that prints the text "Hello, World!" to the output. This is traditionally the first program every developer writes.',
      difficulty: 'Easy',
      topic: 'Basics',
      concept: 'Output / Print statements',
      input_format: 'No input is required.',
      output_format: 'Print exactly: Hello, World!',
      examples: [{ input: '', output: 'Hello, World!', explanation: 'Use the print function to output the exact string.' }],
      test_cases: [{ input: '', expected_output: 'Hello, World!' }],
      supported_languages: ['python', 'javascript'],
      starter_code: { python: '# Write your solution here\nprint()', javascript: '// Write your solution here\nconsole.log();' },
      hints: ['Use the print() function in Python to output text', 'The output must match exactly including the comma and exclamation mark', 'In Python: print("Hello, World!")'],
      order_index: 1
    },
    {
      _id: 'prob_sum_two',
      title: 'Sum of Two Numbers',
      description: 'Write a program that calculates and prints the sum of two given numbers: 5 and 3. The result should be printed as a plain integer.',
      difficulty: 'Easy',
      topic: 'Arithmetic',
      concept: 'Variables and arithmetic operators',
      input_format: 'No input required. Use the values a = 5 and b = 3.',
      output_format: 'Print the integer sum: 8',
      examples: [{ input: '', output: '8', explanation: 'Add 5 + 3 = 8 and print the result.' }],
      test_cases: [{ input: '', expected_output: '8' }],
      supported_languages: ['python', 'javascript'],
      starter_code: { python: 'a = 5\nb = 3\n# Calculate the sum and print it\n', javascript: 'let a = 5;\nlet b = 3;\n// Calculate the sum and print it\n' },
      hints: ['Store 5 in variable a and 3 in variable b', 'Use the + operator to add them together', 'Print or log the result of a + b'],
      order_index: 2
    },
    {
      _id: 'prob_even_odd',
      title: 'Even or Odd',
      description: 'Write a program that checks whether the number 7 is even or odd, and prints "Even" or "Odd" accordingly.',
      difficulty: 'Easy',
      topic: 'Conditionals',
      concept: 'if/else statements and the modulo operator',
      input_format: 'No input required. Use the value n = 7.',
      output_format: 'Print either: Even  OR  Odd',
      examples: [{ input: '', output: 'Odd', explanation: '7 % 2 equals 1 (not 0), so 7 is odd.' }, { input: '', output: 'Even', explanation: 'If n were 4, then 4 % 2 == 0, so it is even.' }],
      test_cases: [{ input: '', expected_output: 'Odd' }],
      supported_languages: ['python', 'javascript'],
      starter_code: { python: 'n = 7\n# Check if n is even or odd and print the result\n', javascript: 'let n = 7;\n// Check if n is even or odd and print the result\n' },
      hints: ['The modulo operator (%) gives the remainder of division', 'If n % 2 equals 0, the number is even; otherwise it is odd', 'Use an if/else statement to decide what to print'],
      order_index: 3
    },
    {
      _id: 'prob_count_to_five',
      title: 'Count to Five',
      description: 'Write a program that prints numbers from 1 to 5, each on a separate line.',
      difficulty: 'Easy',
      topic: 'Loops',
      concept: 'for loops and range iteration',
      input_format: 'No input required.',
      output_format: 'Print numbers 1 through 5, each on its own line:\n1\n2\n3\n4\n5',
      examples: [{ input: '', output: '1\n2\n3\n4\n5', explanation: 'Use a loop that iterates from 1 to 5 (inclusive) and prints each number.' }],
      test_cases: [{ input: '', expected_output: '1\n2\n3\n4\n5' }],
      supported_languages: ['python', 'javascript'],
      starter_code: { python: '# Use a loop to print numbers 1 to 5\n', javascript: '// Use a loop to print numbers 1 to 5\n' },
      hints: ['In Python, use for i in range(1, 6) to get 1, 2, 3, 4, 5', 'In JavaScript, use a for loop: for (let i = 1; i <= 5; i++)', 'Print each number inside the loop body'],
      order_index: 4
    },
    {
      _id: 'prob_string_length',
      title: 'String Length',
      description: 'Write a program that prints the number of characters in the string "AetherLearn".',
      difficulty: 'Easy',
      topic: 'Strings',
      concept: 'String properties and built-in functions',
      input_format: 'No input required. Use the string: "AetherLearn"',
      output_format: 'Print the integer: 11',
      examples: [{ input: '', output: '11', explanation: 'Count the characters: A-e-t-h-e-r-L-e-a-r-n = 11 characters.' }],
      test_cases: [{ input: '', expected_output: '11' }],
      supported_languages: ['python', 'javascript'],
      starter_code: { python: 'word = "AetherLearn"\n# Print the length of the string\n', javascript: 'let word = "AetherLearn";\n// Print the length of the string\n' },
      hints: ['In Python, use the len() function: len(word)', 'In JavaScript, use the .length property: word.length', 'Print or log the result of the length operation'],
      order_index: 5
    },
    {
      _id: 'prob_list_sum',
      title: 'Sum of a List',
      description: 'Write a program that calculates and prints the sum of all numbers in the list: [10, 20, 30, 40, 50].',
      difficulty: 'Medium',
      topic: 'Lists / Arrays',
      concept: 'Arrays, loops, and accumulator pattern',
      input_format: 'No input required. Use: numbers = [10, 20, 30, 40, 50]',
      output_format: 'Print the integer: 150',
      examples: [{ input: '', output: '150', explanation: '10 + 20 + 30 + 40 + 50 = 150' }],
      test_cases: [{ input: '', expected_output: '150' }],
      supported_languages: ['python', 'javascript'],
      starter_code: { python: 'numbers = [10, 20, 30, 40, 50]\n# Calculate and print the sum of the list\n', javascript: 'let numbers = [10, 20, 30, 40, 50];\n// Calculate and print the sum of the array\n' },
      hints: ['Create a variable to accumulate the total, starting at 0', 'Use a loop to go through each number in the list and add it to your total', 'In Python, you can also use the built-in sum() function'],
      order_index: 6
    },
    {
      _id: 'prob_reverse_string',
      title: 'Reverse a String',
      description: 'Write a program that prints the string "Python" reversed.',
      difficulty: 'Medium',
      topic: 'Strings',
      concept: 'String manipulation and slicing',
      input_format: 'No input required. Use the string: "Python"',
      output_format: 'Print: nohtyP',
      examples: [{ input: '', output: 'nohtyP', explanation: 'Reverse the characters: P-y-t-h-o-n becomes n-o-h-t-y-P.' }],
      test_cases: [{ input: '', expected_output: 'nohtyP' }],
      supported_languages: ['python', 'javascript'],
      starter_code: { python: 'word = "Python"\n# Print the reversed string\n', javascript: 'let word = "Python";\n// Print the reversed string\n' },
      hints: ['In Python, you can use slicing: word[::-1] reverses a string', 'In JavaScript, split the string into an array, reverse it, then join it back', 'Think about iterating through the string backwards'],
      order_index: 7
    },
    {
      _id: 'prob_factorial',
      title: 'Factorial',
      description: 'Write a program that calculates and prints the factorial of 5. The factorial of n (written as n!) is the product of all positive integers from 1 to n.',
      difficulty: 'Medium',
      topic: 'Loops / Recursion',
      concept: 'Loops, multiplication, and the factorial concept',
      input_format: 'No input required. Calculate 5! (factorial of 5).',
      output_format: 'Print the integer: 120',
      examples: [{ input: '', output: '120', explanation: '5! = 5 × 4 × 3 × 2 × 1 = 120' }],
      test_cases: [{ input: '', expected_output: '120' }],
      supported_languages: ['python', 'javascript'],
      starter_code: { python: 'n = 5\n# Calculate and print the factorial of n\n', javascript: 'let n = 5;\n// Calculate and print the factorial of n\n' },
      hints: ['Start with a result variable set to 1', 'Loop from 1 to n (inclusive) and multiply the result by each number', 'For n=5: result = 1 × 2 × 3 × 4 × 5'],
      order_index: 8
    }
  ];

  if (existingProblems === 0) {
    for (const p of codingProblems) await db.codingProblems.insert(p);
    console.log('[DB] ✅ Coding problems seeded.');
  }

  console.log('[DB] ✅ Seed complete. Credentials:');
  console.log('[DB]    👤 student@demo.com / student123');
  console.log('[DB]    👑 admin@demo.com   / admin123');
}

module.exports = { db, seedData };

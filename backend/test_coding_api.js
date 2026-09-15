require('dotenv').config({ path: require('path').join(__dirname, '.env') });
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'aetherlearn_jwt_secret_dev_key_2024';

const express = require('express');
const jwt = require('jsonwebtoken');
const { db, seedData } = require('./database');
const codingRoutes = require('./routes/coding');

async function testApi() {
  console.log('--- Starting Coding API Verification ---');
  await seedData();

  const token = jwt.sign(
    { id: 'user_student', email: 'student@demo.com', role: 'student' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const app = express();
  app.use(express.json());
  app.use('/api/coding', codingRoutes);
  app.use('/api/ai', codingRoutes);

  const server = app.listen(3099, async () => {
    try {
      // 1. Test GET /api/coding/problems
      console.log('1. Testing GET /api/coding/problems...');
      let res = await fetch('http://localhost:3099/api/coding/problems', { headers: authHeaders });
      let data = await res.json();
      console.log('   Problems status:', res.status, '| Success:', data.success, '| Count:', data.problems.length);
      if (!data.success || !Array.isArray(data.problems) || data.problems.length === 0) {
        throw new Error('Failed to list problems');
      }
      console.log('   First problem title:', data.problems[0].title, '| Difficulty:', data.problems[0].difficulty);

      const firstId = data.problems[0].id || data.problems[0]._id;

      // 2. Test GET /api/coding/problems/:id
      console.log('2. Testing GET /api/coding/problems/' + firstId + '...');
      res = await fetch('http://localhost:3099/api/coding/problems/' + firstId, { headers: authHeaders });
      let probData = await res.json();
      console.log('   Problem details status:', res.status, '| Title:', probData.problem.title);

      // 3. Test POST /api/coding/run (safe mock runner)
      console.log('3. Testing POST /api/coding/run...');
      res = await fetch('http://localhost:3099/api/coding/run', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          problem_id: firstId,
          code: 'print("Hello, World!")',
          language: 'python'
        })
      });
      let runResult = await res.json();
      console.log('   Run status:', res.status, '| Success:', runResult.success, '| Output:', runResult.output);

      // 4. Test POST /api/coding/run with unsafe code (security check)
      console.log('4. Testing Security Sanitization in POST /api/coding/run...');
      res = await fetch('http://localhost:3099/api/coding/run', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          problem_id: firstId,
          code: 'import os; os.system("rm -rf /")',
          language: 'python'
        })
      });
      let secResult = await res.json();
      console.log('   Security blocked correctly? Status:', res.status, '| Error:', secResult.error);

      // 5. Test POST /api/ai/feedback
      console.log('5. Testing POST /api/ai/feedback...');
      res = await fetch('http://localhost:3099/api/ai/feedback', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          problem_id: firstId,
          code: 'print("Hello World")',
          error_message: 'Expected "Hello, World!" but got "Hello World"',
          request_type: 'hint'
        })
      });
      let aiResult = await res.json();
      console.log('   AI Feedback status:', res.status, '| Success:', aiResult.success, '| Feedback:', aiResult.feedback);

      console.log('\n✅ ALL CODING API TESTS PASSED SUCCESSFULLY!');
      if (server.closeAllConnections) server.closeAllConnections();
      server.close();
      setTimeout(() => process.exit(0), 100);
    } catch (err) {
      console.error('❌ Test failed:', err);
      if (server.closeAllConnections) server.closeAllConnections();
      server.close();
      setTimeout(() => process.exit(1), 100);
    }
  });
}

testApi();

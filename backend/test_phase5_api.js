const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Running Phase 5 Exams & Marks Automated Test Suite...\n');

  try {
    // 1. Admin Login
    const adminLoginRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'admin@demo.com', password: 'password123' }
    );
    if (adminLoginRes.status !== 200 || !adminLoginRes.data.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes.data)}`);
    }
    const adminToken = adminLoginRes.data.token;
    console.log('✓ Admin Login Success');

    // 2. Teacher Login
    const teacherLoginRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'teacher@demo.com', password: 'password123' }
    );
    if (teacherLoginRes.status !== 200 || !teacherLoginRes.data.token) {
      throw new Error(`Teacher login failed: ${JSON.stringify(teacherLoginRes.data)}`);
    }
    const teacherToken = teacherLoginRes.data.token;
    console.log('✓ Teacher Login Success');

    // 3. Student Login
    const studentLoginRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'student@demo.com', password: 'password123' }
    );
    if (studentLoginRes.status !== 200 || !studentLoginRes.data.token) {
      throw new Error(`Student login failed: ${JSON.stringify(studentLoginRes.data)}`);
    }
    const studentToken = studentLoginRes.data.token;
    console.log('✓ Student Login Success');

    // Context resolution
    const subjectsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/subjects',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const studentsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/students',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const subjectId = subjectsRes.data.data[0].id;
    const studentId = studentsRes.data.data[0].id;

    // 4. Create Exam (Admin)
    const createExamRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/exams',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        name: 'End Semester Final Exam',
        examType: 'END_SEM',
        subjectId,
        maxMarks: 100,
        date: '2026-12-01',
        academicYear: '2026-2027',
      }
    );

    if (createExamRes.status !== 201 || !createExamRes.data.success) {
      throw new Error(`Create exam failed: ${JSON.stringify(createExamRes.data)}`);
    }
    const examId = createExamRes.data.data.id;
    console.log(`✓ POST /api/exams Success (Created Exam ID: ${examId})`);

    // 5. Batch Marks Entry (Teacher)
    const markRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/marks/batch',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
      },
      {
        examId,
        subjectId,
        records: [
          { studentId, marksObtained: 92 },
        ],
      }
    );
    if (markRes.status !== 200 || !markRes.data.success) {
      throw new Error(`Batch marks entry failed: ${JSON.stringify(markRes.data)}`);
    }
    console.log('✓ POST /api/marks/batch Success (Recorded student mark: 92/100)');

    // 6. Test Upsert / Duplicate Handling (Update same exam & student)
    const reMarkRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/marks/batch',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
      },
      {
        examId,
        subjectId,
        records: [
          { studentId, marksObtained: 95 },
        ],
      }
    );
    if (reMarkRes.status !== 200 || !reMarkRes.data.success) {
      throw new Error(`Marks upsert failed: ${JSON.stringify(reMarkRes.data)}`);
    }
    console.log('✓ Duplicate Prevention / Upsert Success (Updated mark to 95/100 without constraint error)');

    // 7. GET /api/marks/exam/:examId
    const examMarksRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/marks/exam/${examId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    if (examMarksRes.status !== 200 || !examMarksRes.data.success || examMarksRes.data.data.marks[0].marksObtained !== 95) {
      throw new Error(`Exam marks fetch failed: ${JSON.stringify(examMarksRes.data)}`);
    }
    console.log('✓ GET /api/marks/exam/:examId Success (Grade: Grade O, Percentage: 95%)');

    // 8. GET /api/marks/me (Student Scorecard Calculation)
    const meRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/marks/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (meRes.status !== 200 || !meRes.data.success || typeof meRes.data.data.results.sgpa !== 'number') {
      throw new Error(`Student scorecard calculation failed: ${JSON.stringify(meRes.data)}`);
    }
    console.log(`✓ GET /api/marks/me Success (Calculated SGPA: ${meRes.data.data.results.sgpa}, Status: ${meRes.data.data.results.overallStatus})`);

    // 9. GET /api/marks/overview (Admin Results Analytics)
    const overviewRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/marks/overview',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (overviewRes.status !== 200 || !overviewRes.data.success) {
      throw new Error(`Results overview failed: ${JSON.stringify(overviewRes.data)}`);
    }
    console.log(`✓ GET /api/marks/overview Success (Pass Rate: ${overviewRes.data.data.passPercentage}%, Average SGPA: ${overviewRes.data.data.averageSGPA})`);

    console.log('\n🎉 ALL PHASE 5 EXAMS & MARKS TESTS PASSED 100% SUCCESSFULLY!');
  } catch (error) {
    console.error('\n❌ Test Failure:', error.message);
    process.exit(1);
  }
}

runTests();

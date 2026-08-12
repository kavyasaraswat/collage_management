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
  console.log('🚀 Running Phase 4 Attendance Automated Test Suite...\n');

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

    // Fetch subjects and sections to get valid IDs
    const subjectsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/subjects',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const sectionsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/sections',
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
    const sectionId = sectionsRes.data.data[0].id;
    const studentId = studentsRes.data.data[0].id;

    console.log(`✓ Context Fetched: Subject (${subjectId}), Section (${sectionId}), Student (${studentId})`);

    // 4. Test Marking Attendance (Teacher)
    const markRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/attendance/mark',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
      },
      {
        subjectId,
        sectionId,
        date: '2026-08-11',
        records: [
          { studentId, status: 'PRESENT' },
        ],
      }
    );
    if (markRes.status !== 200 || !markRes.data.success) {
      throw new Error(`Mark attendance failed: ${JSON.stringify(markRes.data)}`);
    }
    console.log('✓ POST /api/attendance/mark Success (Recorded 1 student as PRESENT)');

    // 5. Test Duplicate Prevention / Update (Teacher upsert)
    const reMarkRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/attendance/mark',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
      },
      {
        subjectId,
        sectionId,
        date: '2026-08-11',
        records: [
          { studentId, status: 'LATE' },
        ],
      }
    );
    if (reMarkRes.status !== 200 || !reMarkRes.data.success) {
      throw new Error(`Upsert attendance failed: ${JSON.stringify(reMarkRes.data)}`);
    }
    console.log('✓ Duplicate Handling / Upsert Success (Updated same date to LATE without duplicate constraint error)');

    // 6. Test GET /api/attendance/session
    const sessionRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/attendance/session?subjectId=${subjectId}&sectionId=${sectionId}&date=2026-08-11`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    if (sessionRes.status !== 200 || !sessionRes.data.success || sessionRes.data.data[0].status !== 'LATE') {
      throw new Error(`Session attendance verification failed: ${JSON.stringify(sessionRes.data)}`);
    }
    console.log('✓ GET /api/attendance/session Success (Verified updated status is LATE)');

    // 7. Test GET /api/attendance/me (Student calculation)
    const meRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/attendance/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (meRes.status !== 200 || !meRes.data.success || typeof meRes.data.data.overall.percentage !== 'number') {
      throw new Error(`Student attendance calculation failed: ${JSON.stringify(meRes.data)}`);
    }
    console.log(`✓ GET /api/attendance/me Success (Calculated percentage: ${meRes.data.data.overall.percentage}%, Health: ${meRes.data.data.overall.healthCategory})`);

    // 8. Test GET /api/attendance/overview (Admin overview analytics)
    const overviewRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/attendance/overview',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (overviewRes.status !== 200 || !overviewRes.data.success) {
      throw new Error(`Admin overview failed: ${JSON.stringify(overviewRes.data)}`);
    }
    console.log(`✓ GET /api/attendance/overview Success (Total Students: ${overviewRes.data.data.totalStudents}, Average Turnout: ${overviewRes.data.data.averagePercentage}%)`);

    console.log('\n🎉 ALL PHASE 4 ATTENDANCE TESTS PASSED 100% SUCCESSFULLY!');
  } catch (error) {
    console.error('\n❌ Test Failure:', error.message);
    process.exit(1);
  }
}

runTests();

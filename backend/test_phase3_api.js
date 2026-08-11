const http = require('http');

async function main() {
  console.log('🚀 Running Phase 3 Backend Verification Tests...');
  const baseUrl = 'http://localhost:5000/api';

  // 1. Admin Login
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@demo.com', password: 'password123' }),
  });
  const loginData = await loginRes.json();
  if (!loginData.success || !loginData.token) {
    throw new Error('Admin login failed: ' + JSON.stringify(loginData));
  }
  const token = loginData.token;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
  console.log('✓ Admin login successful');

  // 2. Fetch Departments
  const deptRes = await fetch(`${baseUrl}/departments`, { headers });
  const deptData = await deptRes.json();
  if (!deptData.success || !Array.isArray(deptData.data)) {
    throw new Error('Fetch departments failed: ' + JSON.stringify(deptData));
  }
  console.log(`✓ Departments fetched (${deptData.data.length} found)`);

  const deptId = deptData.data[0]?.id;
  if (!deptId) throw new Error('No department found from seed data');

  // 3. Test Unique Department Code Constraint
  const dupDeptRes = await fetch(`${baseUrl}/departments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ code: 'CSE', name: 'Duplicate CSE' }),
  });
  if (dupDeptRes.status !== 400) {
    throw new Error('Duplicate department code check failed! Expected status 400, got: ' + dupDeptRes.status);
  }
  console.log('✓ Unique Department Code validation passed (400 returned)');

  // 4. Create New Department
  const newDeptRes = await fetch(`${baseUrl}/departments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ code: 'ECE', name: 'Electronics & Communication', description: 'ECE Dept' }),
  });
  const newDeptData = await newDeptRes.json();
  if (!newDeptData.success) throw new Error('Create ECE department failed: ' + JSON.stringify(newDeptData));
  console.log('✓ Department ECE created:', newDeptData.data.name);

  // 5. Create New Course
  const newCourseRes = await fetch(`${baseUrl}/courses`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ code: 'BTECH-ECE', name: 'B.Tech ECE', departmentId: newDeptData.data.id, totalSemesters: 8, durationYears: 4 }),
  });
  const newCourseData = await newCourseRes.json();
  if (!newCourseData.success) throw new Error('Create BTECH-ECE course failed: ' + JSON.stringify(newCourseData));
  console.log('✓ Course BTECH-ECE created:', newCourseData.data.name);

  // 6. Test Unique Course Code Constraint
  const dupCourseRes = await fetch(`${baseUrl}/courses`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ code: 'BTECH-ECE', name: 'Duplicate Course', departmentId: newDeptData.data.id }),
  });
  if (dupCourseRes.status !== 400) {
    throw new Error('Duplicate course code check failed!');
  }
  console.log('✓ Unique Course Code validation passed (400 returned)');

  // 7. Create Semester & Section
  const semRes = await fetch(`${baseUrl}/semesters`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ number: 1, academicYear: '2026-2027', isCurrent: true, courseId: newCourseData.data.id }),
  });
  const semData = await semRes.json();
  if (!semData.success) throw new Error('Create semester failed: ' + JSON.stringify(semData));
  console.log('✓ Semester created for ECE:', semData.data.number);

  const secRes = await fetch(`${baseUrl}/sections`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'Section A', courseId: newCourseData.data.id, semesterId: semData.data.id, capacity: 60 }),
  });
  const secData = await secRes.json();
  if (!secData.success) throw new Error('Create section failed: ' + JSON.stringify(secData));
  console.log('✓ Section created for ECE:', secData.data.name);

  // 8. Create Subject
  const subjRes = await fetch(`${baseUrl}/subjects`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ code: 'ECE101', name: 'Basic Electronics', courseId: newCourseData.data.id, semesterNumber: 1, credits: 4 }),
  });
  const subjData = await subjRes.json();
  if (!subjData.success) throw new Error('Create subject failed: ' + JSON.stringify(subjData));
  console.log('✓ Subject ECE101 created:', subjData.data.name);

  // 9. Test Unique Subject Code Constraint
  const dupSubjRes = await fetch(`${baseUrl}/subjects`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ code: 'ECE101', name: 'Duplicate Subj', courseId: newCourseData.data.id, semesterNumber: 1 }),
  });
  if (dupSubjRes.status !== 400) throw new Error('Duplicate subject code check failed!');
  console.log('✓ Unique Subject Code validation passed (400 returned)');

  // 10. Create Teacher
  const teacherRes = await fetch(`${baseUrl}/teachers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: 'ece.prof@demo.com',
      password: 'password123',
      name: 'Prof. Grace Hopper',
      teacherId: 'TCH-ECE-01',
      departmentId: newDeptData.data.id,
      designation: 'Associate Professor',
    }),
  });
  const teacherData = await teacherRes.json();
  if (!teacherData.success) throw new Error('Create teacher failed: ' + JSON.stringify(teacherData));
  console.log('✓ Teacher created:', teacherData.data.name, '(', teacherData.data.teacherId, ')');

  // 11. Test Duplicate Teacher ID Constraint
  const dupTeacherRes = await fetch(`${baseUrl}/teachers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: 'another.prof@demo.com',
      password: 'password123',
      name: 'Prof. Duplicate',
      teacherId: 'TCH-ECE-01',
      departmentId: newDeptData.data.id,
    }),
  });
  if (dupTeacherRes.status !== 400) throw new Error('Duplicate Teacher ID check failed!');
  console.log('✓ Unique Teacher ID validation passed (400 returned)');

  // 12. Assign Subject to Teacher
  const assignRes = await fetch(`${baseUrl}/teachers/${teacherData.data.id}/assign-subject`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      subjectId: subjData.data.id,
      sectionId: secData.data.id,
      academicYear: '2026-2027',
    }),
  });
  const assignData = await assignRes.json();
  if (!assignData.success) throw new Error('Assign subject failed: ' + JSON.stringify(assignData));
  console.log('✓ Subject ECE101 assigned to teacher Prof. Grace Hopper');

  // 13. Create Student
  const studentRes = await fetch(`${baseUrl}/students`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: 'ece.student@demo.com',
      password: 'password123',
      name: 'Charlie Brown',
      studentId: 'STU-ECE-2026-001',
      departmentId: newDeptData.data.id,
      courseId: newCourseData.data.id,
      semesterId: semData.data.id,
      sectionId: secData.data.id,
      batch: '2026',
    }),
  });
  const studentData = await studentRes.json();
  if (!studentData.success) throw new Error('Create student failed: ' + JSON.stringify(studentData));
  console.log('✓ Student created:', studentData.data.name, '(', studentData.data.studentId, ')');

  // 14. Test Duplicate Student ID Constraint
  const dupStudentRes = await fetch(`${baseUrl}/students`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: 'another.student@demo.com',
      password: 'password123',
      name: 'Duplicate Student',
      studentId: 'STU-ECE-2026-001',
      departmentId: newDeptData.data.id,
      courseId: newCourseData.data.id,
      semesterId: semData.data.id,
      sectionId: secData.data.id,
    }),
  });
  if (dupStudentRes.status !== 400) throw new Error('Duplicate Student ID check failed!');
  console.log('✓ Unique Student ID validation passed (400 returned)');

  // 15. Search & Filter Students API
  const searchRes = await fetch(`${baseUrl}/students?search=Charlie&departmentId=${newDeptData.data.id}`, { headers });
  const searchData = await searchRes.json();
  if (!searchData.success || searchData.data.length !== 1) {
    throw new Error('Search students failed: ' + JSON.stringify(searchData));
  }
  console.log('✓ Student search and filtering verified (Found:', searchData.data[0].name, ')');

  // 16. Toggle Student Deactivation Status
  const deactRes = await fetch(`${baseUrl}/students/${studentData.data.id}/status`, { method: 'PATCH', headers });
  const deactData = await deactRes.json();
  if (!deactData.success || deactData.data.isDeactivated !== true) {
    throw new Error('Student deactivation toggle failed: ' + JSON.stringify(deactData));
  }
  console.log('✓ Student account successfully deactivated');

  // Reactivate student
  const reactRes = await fetch(`${baseUrl}/students/${studentData.data.id}/status`, { method: 'PATCH', headers });
  const reactData = await reactRes.json();
  if (!reactData.success || reactData.data.isDeactivated !== false) {
    throw new Error('Student account reactivation failed!');
  }
  console.log('✓ Student account successfully reactivated');

  console.log('\n🎉 ALL PHASE 3 BACKEND API & DATA VALIDATION TESTS PASSED PERFECTLY!\n');
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

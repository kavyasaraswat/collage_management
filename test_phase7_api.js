const API_BASE = 'http://localhost:5000/api';

let adminToken = '';
let studentToken = '';

async function request(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function runPhase7Tests() {
  console.log('=== Starting AcademiaPro ERP - Phase 7 Timetable, Notices & Notifications API Verification ===\n');

  try {
    // 1. Admin Login
    console.log('1. Logging in as ADMIN (admin@demo.com)...');
    const adminLoginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@demo.com', password: 'password123' }),
    });
    if (!adminLoginRes.ok) throw new Error('Admin login failed');
    adminToken = adminLoginRes.data.token;
    console.log('   ✓ Admin Login Successful');

    // 2. Fetch Master Entities (Course, Semester, Section, Subject, Teacher)
    const coursesRes = await request('/courses', { headers: { Authorization: `Bearer ${adminToken}` } });
    const course = coursesRes.data.data[0];
    const semsRes = await request(`/semesters?courseId=${course.id}`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const semester = semsRes.data.data[0];
    const secsRes = await request(`/sections?courseId=${course.id}&semesterId=${semester.id}`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const section = secsRes.data.data[0];
    const subjsRes = await request(`/subjects?courseId=${course.id}`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const subject = subjsRes.data.data[0];
    const tchsRes = await request('/teachers', { headers: { Authorization: `Bearer ${adminToken}` } });
    const teacher = tchsRes.data.data[0];

    if (!course || !semester || !section || !subject || !teacher) {
      throw new Error('Master seed entities missing for timetable testing');
    }

    // 3. Create Valid Timetable Slot
    console.log('2. Creating Timetable Slot (MONDAY 09:00 - 10:00)...');
    const createSlotRes = await request('/timetable', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '10:00',
        subjectId: subject.id,
        teacherId: teacher.id,
        roomId: 'Lab 101',
        courseId: course.id,
        semesterId: semester.id,
        sectionId: section.id,
      }),
    });
    if (!createSlotRes.ok) throw new Error(`Create slot failed: ${createSlotRes.data.message}`);
    console.log(`   ✓ Slot Created: ${createSlotRes.data.data.dayOfWeek} ${createSlotRes.data.data.startTime}-${createSlotRes.data.data.endTime} in ${createSlotRes.data.data.roomId}`);

    // 4. Test Conflict Prevention Engine (Teacher Overlap)
    console.log('3. Testing Conflict Engine (Teacher Overlap)...');
    const teacherConflictRes = await request('/timetable', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        dayOfWeek: 'MONDAY',
        startTime: '09:30', // Overlaps 09:00-10:00
        endTime: '10:30',
        subjectId: subject.id,
        teacherId: teacher.id, // Same teacher!
        roomId: 'Lab 202', // Different room
        courseId: course.id,
        semesterId: semester.id,
        sectionId: section.id,
      }),
    });
    if (teacherConflictRes.status === 409) {
      console.log(`   ✓ Teacher Conflict Caught Successfully (HTTP 409): "${teacherConflictRes.data.message}"`);
    } else {
      throw new Error(`Expected HTTP 409 conflict, got ${teacherConflictRes.status}`);
    }

    // 5. Test Conflict Prevention Engine (Room Overlap)
    console.log('4. Testing Conflict Engine (Room Overlap)...');
    const roomConflictRes = await request('/timetable', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        dayOfWeek: 'MONDAY',
        startTime: '09:15', // Overlaps 09:00-10:00
        endTime: '10:15',
        subjectId: subject.id,
        teacherId: teacher.id,
        roomId: 'Lab 101', // Same room!
        courseId: course.id,
        semesterId: semester.id,
        sectionId: section.id,
      }),
    });
    if (roomConflictRes.status === 409) {
      console.log(`   ✓ Room Conflict Caught Successfully (HTTP 409): "${roomConflictRes.data.message}"`);
    } else {
      throw new Error(`Expected HTTP 409 conflict, got ${roomConflictRes.status}`);
    }

    // 6. Create Campus Notice
    console.log('5. Publishing Campus Notice...');
    const noticeRes = await request('/notices', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: 'Mid-Sem Examination Timetable Released',
        content: 'The mid-semester exam schedule for 2026-2027 is now active on the portal.',
        targetAudience: 'EVERYONE',
        publishDate: '2026-08-22',
      }),
    });
    if (!noticeRes.ok) throw new Error(`Publish notice failed: ${noticeRes.data.message}`);
    console.log(`   ✓ Notice Published: "${noticeRes.data.data.title}"`);

    // 7. Dispatch System Notification Broadcast
    console.log('6. Dispatching System Notification Broadcast to Students...');
    const notifyRes = await request('/notifications', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        targetRole: 'STUDENT',
        title: 'New Campus Notice Published',
        message: 'Mid-Sem Examination schedule has been posted on the Notice Board.',
        type: 'INFO',
      }),
    });
    if (!notifyRes.ok) throw new Error(`Send notification failed: ${notifyRes.data.message}`);
    console.log(`   ✓ Broadcast Sent to ${notifyRes.data.count} student(s)`);

    // 8. Student Login & Scope Verification
    console.log('7. Logging in as STUDENT (student@demo.com)...');
    const studentLoginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'student@demo.com', password: 'password123' }),
    });
    if (!studentLoginRes.ok) throw new Error('Student login failed');
    studentToken = studentLoginRes.data.token;
    console.log('   ✓ Student Login Successful');

    // 9. Fetch Student Personalized Timetable
    console.log('8. Fetching Student Personal Timetable Schedule...');
    const studentTTRes = await request('/timetable/me', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log(`   ✓ Student timetable slots retrieved: ${studentTTRes.data.data.length}`);

    // 10. Fetch Student Notifications & Mark Read
    console.log('9. Fetching Student Notifications & Marking as Read...');
    const studentNotifRes = await request('/notifications', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log(`   ✓ Student unread notifications: ${studentNotifRes.data.data.unreadCount}`);

    const markReadRes = await request('/notifications/read-all', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log(`   ✓ ${markReadRes.data.message}`);

    console.log('\n======================================================');
    console.log('🎉 ALL PHASE 7 TIMETABLE & NOTICES API TESTS PASSED 100%!');
    console.log('======================================================\n');
  } catch (error) {
    console.error('❌ Phase 7 API Test Failed:', error.message);
    process.exit(1);
  }
}

runPhase7Tests();

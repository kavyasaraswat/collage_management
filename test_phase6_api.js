const API_BASE = 'http://localhost:5000/api';

let adminToken = '';
let studentToken = '';
let createdFeeStructureId = '';
let assignedStudentFeeId = '';
let paymentId = '';

async function request(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return data;
}

async function runPhase6Tests() {
  console.log('=== Starting AcademiaPro ERP - Phase 6 Fee System API Verification ===\n');

  try {
    // 1. Admin Login
    console.log('1. Logging in as ADMIN (admin@demo.com)...');
    const adminLoginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@demo.com',
        password: 'password123',
      }),
    });
    adminToken = adminLoginRes.token;
    console.log('   ✓ Admin Login Successful');

    // 2. Fetch Courses and Semesters to link Fee Structure
    const coursesRes = await request('/courses', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const course = coursesRes.data[0];
    if (!course) throw new Error('No courses found for testing');

    const semsRes = await request(`/semesters?courseId=${course.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const semester = semsRes.data[0];
    if (!semester) throw new Error('No semesters found for testing');

    // 3. Create Fee Structure
    console.log('2. Creating Fee Structure...');
    const createStructRes = await request('/fees/structures', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: 'B.Tech CS Annual Tuition & Hostel Fee 2026',
        courseId: course.id,
        semesterId: semester.id,
        academicYear: '2026-2027',
        dueDate: '2026-10-31',
        tuitionFee: 60000,
        hostelFee: 15000,
        examFee: 3000,
        libraryFee: 2000,
        otherFees: 1000,
      }),
    });
    createdFeeStructureId = createStructRes.data.id;
    console.log(`   ✓ Fee Structure Created: "${createStructRes.data.title}" (Total: ₹${createStructRes.data.totalAmount})`);

    // 4. Fetch Fee Structures
    console.log('3. Fetching Fee Structures...');
    const getStructsRes = await request('/fees/structures', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`   ✓ Total Fee Structures retrieved: ${getStructsRes.data.length}`);

    // 5. Bulk Assign Fee Structure to Students
    console.log('4. Assigning Fee Structure to Active Students...');
    const assignRes = await request('/fees/assign', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        feeStructureId: createdFeeStructureId,
        courseId: course.id,
        semesterId: semester.id,
      }),
    });
    console.log(`   ✓ Fee Assigned: ${assignRes.message}`);

    // 6. Fetch Admin Overview & Defaulters List
    console.log('5. Fetching Admin Fee Overview & Defaulters List...');
    const overviewRes = await request('/fees/overview', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`   ✓ Total Expected: ₹${overviewRes.data.summary.totalExpected}, Defaulters Count: ${overviewRes.data.defaulters.length}`);

    // 7. Student Login
    console.log('6. Logging in as STUDENT (student@demo.com)...');
    const studentLoginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'student@demo.com',
        password: 'password123',
      }),
    });
    studentToken = studentLoginRes.token;
    console.log('   ✓ Student Login Successful');

    // 8. Fetch Logged-In Student Fees
    console.log('7. Fetching Logged-in Student Fee Ledger...');
    const studentFeeRes = await request('/fees/me', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentFees = studentFeeRes.data.studentFees;
    if (studentFees.length === 0) throw new Error('No assigned student fees found for student');
    assignedStudentFeeId = studentFees[0].id;
    console.log(`   ✓ Student assigned fee total: ₹${studentFees[0].totalAmount}, remaining: ₹${studentFees[0].remainingAmount}`);

    // 9. Execute Mock Payment Gateway Transaction
    console.log('8. Executing Partial Fee Payment (₹25,000 via UPI)...');
    const paymentRes = await request('/fees/pay', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        studentFeeId: assignedStudentFeeId,
        amount: 25000,
        paymentMethod: 'UPI',
        isMock: true,
      }),
    });
    paymentId = paymentRes.data.payment.id;
    const updatedFee = paymentRes.data.studentFee;
    console.log(`   ✓ Payment Successful! Transaction ID: ${paymentRes.data.payment.transactionId}`);
    console.log(`   ✓ Updated Status: ${updatedFee.status}, Paid: ₹${updatedFee.paidAmount}, Remaining: ₹${updatedFee.remainingAmount}`);

    // 10. Fetch Printable Payment Receipt
    console.log('9. Fetching Payment Transaction Receipt...');
    const receiptRes = await request(`/fees/receipt/${paymentId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log(`   ✓ Receipt Retrieved for Ref: ${receiptRes.data.transactionId}, Amount: ₹${receiptRes.data.amount}`);

    console.log('\n======================================================');
    console.log('🎉 ALL PHASE 6 FEE SYSTEM API TESTS PASSED SUCCESSFULLY 100%!');
    console.log('======================================================\n');
  } catch (error) {
    console.error('❌ Phase 6 API Test Failed:', error.message);
    process.exit(1);
  }
}

runPhase6Tests();

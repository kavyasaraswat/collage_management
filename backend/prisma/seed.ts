import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for AcademiaPro ERP...');

  // 1. Create Default Department
  const department = await prisma.department.upsert({
    where: { code: 'CSE' },
    update: {},
    create: {
      code: 'CSE',
      name: 'Computer Science & Engineering',
      description: 'Department of Computer Science and Engineering',
    },
  });
  console.log('✓ Department created:', department.name);

  // 2. Create Default Course
  const course = await prisma.course.upsert({
    where: { code: 'BTECH-CSE' },
    update: {},
    create: {
      code: 'BTECH-CSE',
      name: 'B.Tech Computer Science & Engineering',
      departmentId: department.id,
      totalSemesters: 8,
      durationYears: 4,
    },
  });
  console.log('✓ Course created:', course.name);

  // 3. Create Default Semester
  const semester = await prisma.semester.upsert({
    where: {
      courseId_number_academicYear: {
        courseId: course.id,
        number: 1,
        academicYear: '2026-2027',
      },
    },
    update: {},
    create: {
      number: 1,
      academicYear: '2026-2027',
      isCurrent: true,
      courseId: course.id,
    },
  });
  console.log('✓ Semester created: Semester', semester.number);

  // 4. Create Default Section
  const section = await prisma.section.upsert({
    where: {
      courseId_semesterId_name: {
        courseId: course.id,
        semesterId: semester.id,
        name: 'Section A',
      },
    },
    update: {},
    create: {
      name: 'Section A',
      courseId: course.id,
      semesterId: semester.id,
      capacity: 60,
    },
  });
  console.log('✓ Section created:', section.name);

  // 5. Create Default Subject
  const subject = await prisma.subject.upsert({
    where: { code: 'CS101' },
    update: {},
    create: {
      code: 'CS101',
      name: 'Data Structures & Algorithms',
      courseId: course.id,
      semesterNumber: 1,
      credits: 4,
    },
  });
  console.log('✓ Subject created:', subject.name);

  // Common Hashed Password for Demo Accounts
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 6. Demo Admin Account
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@demo.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('✓ Demo Admin created: admin@demo.com');

  // 7. Demo Teacher Account
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@demo.com' },
    update: { password: hashedPassword },
    create: {
      email: 'teacher@demo.com',
      password: hashedPassword,
      role: 'TEACHER',
      teacher: {
        create: {
          teacherId: 'TCH-101',
          name: 'Dr. Alan Turing',
          email: 'teacher@demo.com',
          phone: '+1 555-0192',
          departmentId: department.id,
          designation: 'Senior Professor',
          joiningDate: '2022-08-15',
        },
      },
    },
  });
  console.log('✓ Demo Teacher created: teacher@demo.com');

  // 8. Demo Student Account
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@demo.com' },
    update: { password: hashedPassword },
    create: {
      email: 'student@demo.com',
      password: hashedPassword,
      role: 'STUDENT',
      student: {
        create: {
          studentId: 'STU-2026-001',
          name: 'Alex Johnson',
          email: 'student@demo.com',
          phone: '+1 555-0148',
          dob: '2004-05-14',
          gender: 'Male',
          address: '123 University Campus, Tech City',
          departmentId: department.id,
          courseId: course.id,
          semesterId: semester.id,
          sectionId: section.id,
          batch: '2026',
          admissionDate: '2026-08-01',
        },
      },
    },
  });
  // 9. Assign Demo Teacher to Subject & Section
  const student = await prisma.student.findUnique({ where: { email: 'student@demo.com' } });
  const teacher = await prisma.teacher.findUnique({ where: { email: 'teacher@demo.com' } });

  if (student && teacher) {
    await prisma.teacherSubject.upsert({
      where: {
        teacherId_subjectId_sectionId_academicYear: {
          teacherId: teacher.id,
          subjectId: subject.id,
          sectionId: section.id,
          academicYear: '2026-2027',
        },
      },
      update: {},
      create: {
        teacherId: teacher.id,
        subjectId: subject.id,
        sectionId: section.id,
        academicYear: '2026-2027',
      },
    });
    console.log('✓ Teacher allocated to subject CS101 in Section A');

    // 10. Seed Demo Attendance Records for Student
    const sampleDates = [
      { date: '2026-08-01', status: 'PRESENT' },
      { date: '2026-08-02', status: 'PRESENT' },
      { date: '2026-08-03', status: 'PRESENT' },
      { date: '2026-08-04', status: 'LATE' },
      { date: '2026-08-05', status: 'PRESENT' },
      { date: '2026-08-06', status: 'ABSENT' },
      { date: '2026-08-07', status: 'PRESENT' },
      { date: '2026-08-08', status: 'PRESENT' },
      { date: '2026-08-09', status: 'EXCUSED' },
      { date: '2026-08-10', status: 'PRESENT' },
    ];

    for (const item of sampleDates) {
      await prisma.attendance.upsert({
        where: {
          studentId_subjectId_date: {
            studentId: student.id,
            subjectId: subject.id,
            date: item.date,
          },
        },
        update: { status: item.status },
        create: {
          studentId: student.id,
          subjectId: subject.id,
          sectionId: section.id,
          date: item.date,
          status: item.status,
          markedById: adminUser.id,
        },
      });
    }
    console.log('✓ Seeded 10 demo attendance sessions');
  }

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

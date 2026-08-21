import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = Router();

// Validation Schemas
const feeStructureSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  semesterId: z.string().min(1, 'Semester ID is required'),
  academicYear: z.string().min(1, 'Academic Year is required'),
  dueDate: z.string().min(1, 'Due Date is required'),
  tuitionFee: z.number().min(0).default(0),
  hostelFee: z.number().min(0).default(0),
  examFee: z.number().min(0).default(0),
  libraryFee: z.number().min(0).default(0),
  otherFees: z.number().min(0).default(0),
});

const assignFeeSchema = z.object({
  feeStructureId: z.string().min(1, 'Fee Structure ID is required'),
  studentId: z.string().optional(),
  courseId: z.string().optional(),
  semesterId: z.string().optional(),
});

const makePaymentSchema = z.object({
  studentFeeId: z.string().min(1, 'Student Fee ID is required'),
  amount: z.number().positive('Payment amount must be greater than 0'),
  paymentMethod: z.enum(['ONLINE', 'UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'CASH']).default('ONLINE'),
  isMock: z.boolean().default(true),
});

// POST /api/fees/structures - Create a new fee structure (ADMIN)
router.post(
  '/structures',
  authenticateToken,
  authorizeRoles('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const validated = feeStructureSchema.parse(req.body);
      const {
        title,
        courseId,
        semesterId,
        academicYear,
        dueDate,
        tuitionFee,
        hostelFee,
        examFee,
        libraryFee,
        otherFees,
      } = validated;

      const totalAmount = tuitionFee + hostelFee + examFee + libraryFee + otherFees;

      const structure = await prisma.feeStructure.create({
        data: {
          title,
          courseId,
          semesterId,
          academicYear,
          dueDate,
          tuitionFee,
          hostelFee,
          examFee,
          libraryFee,
          otherFees,
          totalAmount,
        },
        include: {
          course: true,
          semester: true,
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Fee Structure created successfully',
        data: structure,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: error.errors[0].message });
      }
      console.error('Error creating fee structure:', error);
      return res.status(500).json({ success: false, message: 'Failed to create fee structure' });
    }
  }
);

// GET /api/fees/structures - List fee structures with optional filtering
router.get('/structures', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, semesterId, academicYear } = req.query;

    const where: any = {};
    if (courseId) where.courseId = String(courseId);
    if (semesterId) where.semesterId = String(semesterId);
    if (academicYear) where.academicYear = String(academicYear);

    const structures = await prisma.feeStructure.findMany({
      where,
      include: {
        course: true,
        semester: true,
        _count: {
          select: { studentFees: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: structures,
    });
  } catch (error) {
    console.error('Error fetching fee structures:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch fee structures' });
  }
});

// PUT /api/fees/structures/:id - Update fee structure (ADMIN)
router.put(
  '/structures/:id',
  authenticateToken,
  authorizeRoles('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id);
      const validated = feeStructureSchema.partial().parse(req.body);

      const existing = await prisma.feeStructure.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Fee Structure not found' });
      }

      const tuitionFee = validated.tuitionFee ?? existing.tuitionFee;
      const hostelFee = validated.hostelFee ?? existing.hostelFee;
      const examFee = validated.examFee ?? existing.examFee;
      const libraryFee = validated.libraryFee ?? existing.libraryFee;
      const otherFees = validated.otherFees ?? existing.otherFees;
      const totalAmount = tuitionFee + hostelFee + examFee + libraryFee + otherFees;

      const updated = await prisma.feeStructure.update({
        where: { id },
        data: {
          ...validated,
          totalAmount,
        },
        include: {
          course: true,
          semester: true,
        },
      });

      return res.json({
        success: true,
        message: 'Fee Structure updated successfully',
        data: updated,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: error.errors[0].message });
      }
      console.error('Error updating fee structure:', error);
      return res.status(500).json({ success: false, message: 'Failed to update fee structure' });
    }
  }
);

// DELETE /api/fees/structures/:id - Delete fee structure (ADMIN)
router.delete(
  '/structures/:id',
  authenticateToken,
  authorizeRoles('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id);

      const existing = await prisma.feeStructure.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Fee Structure not found' });
      }

      await prisma.feeStructure.delete({ where: { id } });

      return res.json({
        success: true,
        message: 'Fee Structure deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting fee structure:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete fee structure' });
    }
  }
);

// POST /api/fees/assign - Bulk or individual fee structure assignment (ADMIN)
router.post(
  '/assign',
  authenticateToken,
  authorizeRoles('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const validated = assignFeeSchema.parse(req.body);
      const { feeStructureId, studentId, courseId, semesterId } = validated;

      const feeStructure = await prisma.feeStructure.findUnique({
        where: { id: feeStructureId },
      });

      if (!feeStructure) {
        return res.status(404).json({ success: false, message: 'Fee Structure not found' });
      }

      let studentsToAssign: { id: string }[] = [];

      if (studentId) {
        const student = await prisma.student.findUnique({ where: { id: studentId } });
        if (!student) {
          return res.status(404).json({ success: false, message: 'Student not found' });
        }
        studentsToAssign = [{ id: student.id }];
      } else {
        const targetCourseId = courseId || feeStructure.courseId;
        const targetSemesterId = semesterId || feeStructure.semesterId;

        studentsToAssign = await prisma.student.findMany({
          where: {
            courseId: targetCourseId,
            semesterId: targetSemesterId,
            user: { isDeactivated: false },
          },
          select: { id: true },
        });
      }

      if (studentsToAssign.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No active students found matching the assignment criteria',
        });
      }

      // Upsert StudentFee for each target student
      const operations = studentsToAssign.map((st) =>
        prisma.studentFee.upsert({
          where: {
            studentId_feeStructureId: {
              studentId: st.id,
              feeStructureId,
            },
          },
          update: {
            totalAmount: feeStructure.totalAmount,
            dueDate: feeStructure.dueDate,
          },
          create: {
            studentId: st.id,
            feeStructureId,
            totalAmount: feeStructure.totalAmount,
            paidAmount: 0,
            remainingAmount: feeStructure.totalAmount,
            status: 'PENDING',
            dueDate: feeStructure.dueDate,
          },
        })
      );

      const assigned = await prisma.$transaction(operations);

      return res.json({
        success: true,
        message: `Fee Structure successfully assigned to ${assigned.length} student(s)`,
        count: assigned.length,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: error.errors[0].message });
      }
      console.error('Error assigning fees:', error);
      return res.status(500).json({ success: false, message: 'Failed to assign fees to students' });
    }
  }
);

// GET /api/fees/me - Logged-in student's fee ledger & payments (STUDENT)
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Access denied: Student role required' });
    }

    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const studentFees = await prisma.studentFee.findMany({
      where: { studentId: student.id },
      include: {
        feeStructure: {
          include: {
            course: true,
            semester: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate totals
    let totalAssigned = 0;
    let totalPaid = 0;
    let totalRemaining = 0;

    studentFees.forEach((sf) => {
      totalAssigned += sf.totalAmount;
      totalPaid += sf.paidAmount;
      totalRemaining += sf.remainingAmount;
    });

    return res.json({
      success: true,
      data: {
        summary: {
          totalAssigned,
          totalPaid,
          totalRemaining,
          feeCount: studentFees.length,
        },
        studentFees,
      },
    });
  } catch (error) {
    console.error('Error fetching student fee ledger:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch fee ledger' });
  }
});

// GET /api/fees/student/:studentId - Specific student fee details (ADMIN / TEACHER)
router.get(
  '/student/:studentId',
  authenticateToken,
  authorizeRoles('ADMIN', 'TEACHER'),
  async (req: AuthRequest, res: Response) => {
    try {
      const studentId = String(req.params.studentId);

      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { course: true, semester: true, department: true, section: true },
      });

      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      const studentFees = await prisma.studentFee.findMany({
        where: { studentId },
        include: {
          feeStructure: {
            include: { course: true, semester: true },
          },
          payments: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      let totalAssigned = 0;
      let totalPaid = 0;
      let totalRemaining = 0;

      studentFees.forEach((sf) => {
        totalAssigned += sf.totalAmount;
        totalPaid += sf.paidAmount;
        totalRemaining += sf.remainingAmount;
      });

      return res.json({
        success: true,
        data: {
          student,
          summary: {
            totalAssigned,
            totalPaid,
            totalRemaining,
          },
          studentFees,
        },
      });
    } catch (error) {
      console.error('Error fetching student fees:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch student fees' });
    }
  }
);

// POST /api/fees/pay - Process Fee Payment (STUDENT / ADMIN)
router.post('/pay', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const validated = makePaymentSchema.parse(req.body);
    const { studentFeeId, amount, paymentMethod, isMock } = validated;

    const studentFee = await prisma.studentFee.findUnique({
      where: { id: studentFeeId },
      include: { student: true, feeStructure: true },
    });

    if (!studentFee) {
      return res.status(404).json({ success: false, message: 'Student Fee record not found' });
    }

    // Security check for student role
    if (req.user?.role === 'STUDENT') {
      const currentStudent = await prisma.student.findUnique({
        where: { userId: req.user.id },
      });
      if (!currentStudent || currentStudent.id !== studentFee.studentId) {
        return res.status(403).json({ success: false, message: 'Unauthorized to pay for this fee' });
      }
    }

    if (amount > studentFee.remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (₹${amount}) exceeds remaining balance (₹${studentFee.remainingAmount})`,
      });
    }

    // Generate unique transaction reference
    const transactionId = `TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const newPaidAmount = studentFee.paidAmount + amount;
    const newRemainingAmount = Math.max(0, studentFee.totalAmount - newPaidAmount);

    let newStatus = 'PARTIALLY_PAID';
    if (newRemainingAmount <= 0) {
      newStatus = 'PAID';
    } else if (newPaidAmount === 0) {
      newStatus = 'PENDING';
    }

    // Process transaction cleanly
    const [payment, updatedStudentFee] = await prisma.$transaction([
      prisma.feePayment.create({
        data: {
          studentFeeId,
          studentId: studentFee.studentId,
          transactionId,
          amount,
          paymentMethod,
          paymentStatus: 'SUCCESS',
          isMock,
          gatewayResponse: JSON.stringify({
            gateway: isMock ? 'MOCK_DEVELOPMENT_GATEWAY' : 'RAZORPAY_SANDBOX',
            timestamp: new Date().toISOString(),
            status: 'CAPTURED',
          }),
        },
      }),
      prisma.studentFee.update({
        where: { id: studentFeeId },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status: newStatus,
        },
        include: {
          feeStructure: true,
        },
      }),
    ]);

    return res.json({
      success: true,
      message: `Payment of ₹${amount} completed successfully. Transaction ID: ${transactionId}`,
      data: {
        payment,
        studentFee: updatedStudentFee,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    console.error('Error processing payment:', error);
    return res.status(500).json({ success: false, message: 'Failed to process fee payment' });
  }
});

// GET /api/fees/receipt/:paymentId - Fetch transaction receipt details
router.get('/receipt/:paymentId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const paymentId = String(req.params.paymentId);

    const payment = await prisma.feePayment.findUnique({
      where: { id: paymentId },
      include: {
        student: {
          include: {
            department: true,
            course: true,
            semester: true,
            section: true,
          },
        },
        studentFee: {
          include: {
            feeStructure: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    return res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Error fetching receipt details:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch receipt details' });
  }
});

// GET /api/fees/overview - Fee Analytics & Defaulters roster (ADMIN)
router.get(
  '/overview',
  authenticateToken,
  authorizeRoles('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { courseId, semesterId } = req.query;

      const where: any = {};
      if (courseId) where.student = { courseId: String(courseId) };
      if (semesterId) where.student = { semesterId: String(semesterId) };

      const allStudentFees = await prisma.studentFee.findMany({
        where,
        include: {
          student: {
            include: {
              department: true,
              course: true,
              semester: true,
              section: true,
            },
          },
          feeStructure: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      let totalExpected = 0;
      let totalCollected = 0;
      let totalPending = 0;

      let paidCount = 0;
      let partiallyPaidCount = 0;
      let pendingCount = 0;

      const defaulters: any[] = [];

      allStudentFees.forEach((sf) => {
        totalExpected += sf.totalAmount;
        totalCollected += sf.paidAmount;
        totalPending += sf.remainingAmount;

        if (sf.status === 'PAID') {
          paidCount++;
        } else if (sf.status === 'PARTIALLY_PAID') {
          partiallyPaidCount++;
        } else {
          pendingCount++;
        }

        if (sf.remainingAmount > 0) {
          defaulters.push({
            id: sf.id,
            studentDbId: sf.student.id,
            studentId: sf.student.studentId,
            name: sf.student.name,
            email: sf.student.email,
            course: sf.student.course.name,
            semester: sf.student.semester.number,
            section: sf.student.section.name,
            feeTitle: sf.feeStructure.title,
            totalAmount: sf.totalAmount,
            paidAmount: sf.paidAmount,
            remainingAmount: sf.remainingAmount,
            dueDate: sf.dueDate,
            status: sf.status,
          });
        }
      });

      const collectionRate =
        totalExpected > 0 ? Number(((totalCollected / totalExpected) * 100).toFixed(2)) : 0;

      return res.json({
        success: true,
        data: {
          summary: {
            totalExpected,
            totalCollected,
            totalPending,
            collectionRate,
            paidCount,
            partiallyPaidCount,
            pendingCount,
            totalRecords: allStudentFees.length,
          },
          defaulters,
        },
      });
    } catch (error) {
      console.error('Error fetching fee overview:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch fee overview' });
    }
  }
);

export default router;

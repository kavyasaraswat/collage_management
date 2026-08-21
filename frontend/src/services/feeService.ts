import api from './api';

export interface FeeStructure {
  id: string;
  title: string;
  courseId: string;
  semesterId: string;
  academicYear: string;
  dueDate: string;
  tuitionFee: number;
  hostelFee: number;
  examFee: number;
  libraryFee: number;
  otherFees: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  course?: { id: string; name: string; code: string };
  semester?: { id: string; number: number; academicYear: string };
  _count?: { studentFees: number };
}

export interface FeePayment {
  id: string;
  studentFeeId: string;
  studentId: string;
  transactionId: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  isMock: boolean;
  gatewayResponse?: string;
  createdAt: string;
}

export interface StudentFee {
  id: string;
  studentId: string;
  feeStructureId: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'PAID' | 'PARTIALLY_PAID' | 'PENDING' | 'OVERDUE';
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  feeStructure: FeeStructure;
  payments?: FeePayment[];
}

export interface StudentFeeSummary {
  totalAssigned: number;
  totalPaid: number;
  totalRemaining: number;
  feeCount?: number;
}

export interface StudentFeeLedgerResponse {
  summary: StudentFeeSummary;
  studentFees: StudentFee[];
}

export interface FeeDefaulter {
  id: string;
  studentDbId: string;
  studentId: string;
  name: string;
  email: string;
  course: string;
  semester: number;
  section: string;
  feeTitle: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: string;
}

export interface FeeOverviewData {
  summary: {
    totalExpected: number;
    totalCollected: number;
    totalPending: number;
    collectionRate: number;
    paidCount: number;
    partiallyPaidCount: number;
    pendingCount: number;
    totalRecords: number;
  };
  defaulters: FeeDefaulter[];
}

export interface ReceiptData {
  id: string;
  transactionId: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  isMock: boolean;
  createdAt: string;
  student: {
    id: string;
    studentId: string;
    name: string;
    email: string;
    phone?: string;
    department?: { name: string };
    course?: { name: string; code: string };
    semester?: { number: number };
    section?: { name: string };
  };
  studentFee: {
    id: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    status: string;
    dueDate: string;
    feeStructure: {
      title: string;
      academicYear: string;
      tuitionFee: number;
      hostelFee: number;
      examFee: number;
      libraryFee: number;
      otherFees: number;
    };
  };
}

export const feeService = {
  // Fee Structures
  getStructures: async (params?: { courseId?: string; semesterId?: string; academicYear?: string }) => {
    const res = await api.get('/fees/structures', { params });
    return res.data;
  },

  createStructure: async (data: {
    title: string;
    courseId: string;
    semesterId: string;
    academicYear: string;
    dueDate: string;
    tuitionFee?: number;
    hostelFee?: number;
    examFee?: number;
    libraryFee?: number;
    otherFees?: number;
  }) => {
    const res = await api.post('/fees/structures', data);
    return res.data;
  },

  updateStructure: async (id: string, data: Partial<FeeStructure>) => {
    const res = await api.put(`/fees/structures/${id}`, data);
    return res.data;
  },

  deleteStructure: async (id: string) => {
    const res = await api.delete(`/fees/structures/${id}`);
    return res.data;
  },

  // Fee Assignment
  assignFees: async (data: {
    feeStructureId: string;
    studentId?: string;
    courseId?: string;
    semesterId?: string;
  }) => {
    const res = await api.post('/fees/assign', data);
    return res.data;
  },

  // Student Fee Lookup
  getMyFees: async () => {
    const res = await api.get('/fees/me');
    return res.data;
  },

  getStudentFees: async (studentId: string) => {
    const res = await api.get(`/fees/student/${studentId}`);
    return res.data;
  },

  // Payment Execution
  makePayment: async (data: {
    studentFeeId: string;
    amount: number;
    paymentMethod: 'ONLINE' | 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'NET_BANKING' | 'CASH';
    isMock?: boolean;
  }) => {
    const res = await api.post('/fees/pay', data);
    return res.data;
  },

  // Receipt Lookup
  getReceipt: async (paymentId: string) => {
    const res = await api.get(`/fees/receipt/${paymentId}`);
    return res.data;
  },

  // Admin Overview
  getOverview: async (params?: { courseId?: string; semesterId?: string }) => {
    const res = await api.get('/fees/overview', { params });
    return res.data;
  },
};

export default feeService;

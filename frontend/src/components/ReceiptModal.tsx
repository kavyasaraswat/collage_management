import React, { useEffect, useState } from 'react';
import { X, Printer, CheckCircle2, ShieldCheck, FileText, Download } from 'lucide-react';
import feeService, { ReceiptData } from '../services/feeService';

interface ReceiptModalProps {
  paymentId: string;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ paymentId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReceiptData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReceipt = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await feeService.getReceipt(paymentId);
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.message || 'Failed to load receipt');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error fetching receipt details');
      } finally {
        setLoading(false);
      }
    };
    if (paymentId) {
      fetchReceipt();
    }
  }, [paymentId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-8 font-sans">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/60 border-b border-slate-800 print:hidden">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-brand-400" />
            <h3 className="text-sm font-bold text-white">Official Fee Payment Receipt</h3>
          </div>
          <div className="flex items-center space-x-3">
            {data && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-brand-600/20"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 border border-slate-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-8 space-y-6 text-slate-100 bg-slate-900 print:bg-white print:text-black" id="printable-receipt">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Generating official transaction receipt...
            </div>
          ) : error ? (
            <div className="py-12 text-center text-rose-400 font-medium">{error}</div>
          ) : data ? (
            <>
              {/* Receipt Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-6 print:border-slate-300">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center font-black text-white text-lg">
                      A
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold tracking-tight text-white print:text-black">
                        AcademiaPro ERP
                      </h2>
                      <p className="text-xs text-slate-400 print:text-slate-600">
                        Official Fee Receipt &amp; Transaction Verification
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 sm:mt-0 text-left sm:text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold print:border-emerald-600 print:text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> PAYMENT VERIFIED
                  </span>
                  <p className="text-[10px] font-mono text-slate-400 mt-1 print:text-slate-600">
                    Ref: {data.transactionId}
                  </p>
                </div>
              </div>

              {/* Student & Payment Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs p-4 rounded-2xl bg-slate-950/60 border border-slate-800 print:bg-slate-50 print:border-slate-200">
                <div>
                  <p className="text-slate-400 print:text-slate-500 text-[10px] uppercase font-bold">Student Name</p>
                  <p className="font-bold text-white print:text-black mt-0.5">{data.student.name}</p>
                  <p className="text-[10px] font-mono text-brand-400 print:text-slate-600">{data.student.studentId}</p>
                </div>

                <div>
                  <p className="text-slate-400 print:text-slate-500 text-[10px] uppercase font-bold">Academic Scope</p>
                  <p className="font-bold text-slate-200 print:text-black mt-0.5">
                    {data.student.course?.code || 'Course'} &bull; Sem {data.student.semester?.number || 1}
                  </p>
                  <p className="text-[10px] text-slate-400 print:text-slate-600">{data.student.department?.name}</p>
                </div>

                <div>
                  <p className="text-slate-400 print:text-slate-500 text-[10px] uppercase font-bold">Payment Details</p>
                  <p className="font-bold text-emerald-400 print:text-emerald-700 mt-0.5">
                    Method: {data.paymentMethod}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 print:text-slate-600">
                    Date: {new Date(data.createdAt).toLocaleDateString()} {new Date(data.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Fee Breakdown Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 print:text-slate-700">
                  Fee Title: {data.studentFee.feeStructure.title} ({data.studentFee.feeStructure.academicYear})
                </h4>

                <div className="overflow-hidden rounded-xl border border-slate-800 print:border-slate-300">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold print:bg-slate-100 print:text-slate-700">
                        <th className="py-2.5 px-4">Fee Head</th>
                        <th className="py-2.5 px-4 text-right">Amount Allocated (&#x20B9;)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                      <tr>
                        <td className="py-2 px-4 text-slate-300 print:text-black">Tuition Fee</td>
                        <td className="py-2 px-4 text-right font-mono text-slate-200 print:text-black">
                          &#x20B9;{data.studentFee.feeStructure.tuitionFee.toLocaleString()}
                        </td>
                      </tr>
                      {data.studentFee.feeStructure.hostelFee > 0 && (
                        <tr>
                          <td className="py-2 px-4 text-slate-300 print:text-black">Hostel Fee</td>
                          <td className="py-2 px-4 text-right font-mono text-slate-200 print:text-black">
                            &#x20B9;{data.studentFee.feeStructure.hostelFee.toLocaleString()}
                          </td>
                        </tr>
                      )}
                      {data.studentFee.feeStructure.examFee > 0 && (
                        <tr>
                          <td className="py-2 px-4 text-slate-300 print:text-black">Exam Fee</td>
                          <td className="py-2 px-4 text-right font-mono text-slate-200 print:text-black">
                            &#x20B9;{data.studentFee.feeStructure.examFee.toLocaleString()}
                          </td>
                        </tr>
                      )}
                      {data.studentFee.feeStructure.libraryFee > 0 && (
                        <tr>
                          <td className="py-2 px-4 text-slate-300 print:text-black">Library Fee</td>
                          <td className="py-2 px-4 text-right font-mono text-slate-200 print:text-black">
                            &#x20B9;{data.studentFee.feeStructure.libraryFee.toLocaleString()}
                          </td>
                        </tr>
                      )}
                      {data.studentFee.feeStructure.otherFees > 0 && (
                        <tr>
                          <td className="py-2 px-4 text-slate-300 print:text-black">Other Ancillary Fees</td>
                          <td className="py-2 px-4 text-right font-mono text-slate-200 print:text-black">
                            &#x20B9;{data.studentFee.feeStructure.otherFees.toLocaleString()}
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-950/40 font-bold border-t border-slate-800 print:bg-slate-50 print:border-slate-300">
                        <td className="py-2.5 px-4 text-slate-200 print:text-black">Total Fee Amount</td>
                        <td className="py-2.5 px-4 text-right font-mono text-white print:text-black">
                          &#x20B9;{data.studentFee.totalAmount.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Payment Summary Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-emerald-500/30 flex justify-between items-center print:border-emerald-600 print:bg-emerald-50">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600">Amount Paid in this Transaction</p>
                  <p className="text-2xl font-black text-emerald-400 print:text-emerald-700 font-mono mt-0.5">
                    &#x20B9;{data.amount.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600">Remaining Balance</p>
                  <p className="text-sm font-bold font-mono text-slate-300 print:text-black mt-0.5">
                    &#x20B9;{data.studentFee.remainingAmount.toLocaleString()}
                  </p>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 mt-1 print:bg-slate-200 print:text-black">
                    Status: {data.studentFee.status}
                  </span>
                </div>
              </div>

              {/* Stamp & Verification Disclaimer */}
              <div className="flex justify-between items-end pt-4 border-t border-slate-800 print:border-slate-300 text-[10px] text-slate-400 print:text-slate-600">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-brand-400 print:text-brand-600" />
                  <span>Digitally generated receipt. Verified by AcademiaPro Gateway.</span>
                </div>
                <div className="text-right font-mono">
                  <p className="font-bold text-white print:text-black">Accounts Office</p>
                  <p>AcademiaPro ERP</p>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;

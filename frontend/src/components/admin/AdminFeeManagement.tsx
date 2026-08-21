import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  Edit,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Users,
  Layers,
  BookOpen,
  Send,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
} from 'lucide-react';
import feeService, { FeeStructure, FeeOverviewData } from '../../services/feeService';
import { courseService, Course } from '../../services/courseService';
import { semesterService, Semester } from '../../services/semesterService';

export const AdminFeeManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'structures' | 'assign'>('overview');

  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [overview, setOverview] = useState<FeeOverviewData | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State for Fee Structure Creation
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCourseId, setNewCourseId] = useState('');
  const [newSemesterId, setNewSemesterId] = useState('');
  const [newAcademicYear, setNewAcademicYear] = useState('2026-2027');
  const [newDueDate, setNewDueDate] = useState('2026-09-30');
  const [newTuitionFee, setNewTuitionFee] = useState<number>(50000);
  const [newHostelFee, setNewHostelFee] = useState<number>(15000);
  const [newExamFee, setNewExamFee] = useState<number>(3000);
  const [newLibraryFee, setNewLibraryFee] = useState<number>(2000);
  const [newOtherFees, setNewOtherFees] = useState<number>(1000);

  // Assignment Form State
  const [assignFeeStructureId, setAssignFeeStructureId] = useState('');
  const [assignCourseId, setAssignCourseId] = useState('');
  const [assignSemesterId, setAssignSemesterId] = useState('');

  // Defaulters Search Filter
  const [defaulterSearch, setDefaulterSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [structRes, ovRes, courseRes] = await Promise.all([
        feeService.getStructures(),
        feeService.getOverview(),
        courseService.getAll(),
      ]);

      if (structRes.success) setStructures(structRes.data);
      if (ovRes.success) setOverview(ovRes.data);
      if (courseRes.success) setCourses(courseRes.data);
    } catch (err) {
      console.error('Failed to load fee management data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When course selected in structure creation, load course semesters
  useEffect(() => {
    if (newCourseId) {
      semesterService.getAll(newCourseId).then((res: { success: boolean; data: Semester[] }) => {
        if (res.success) setSemesters(res.data);
      });
    }
  }, [newCourseId]);

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newCourseId || !newSemesterId || !newDueDate) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await feeService.createStructure({
        title: newTitle,
        courseId: newCourseId,
        semesterId: newSemesterId,
        academicYear: newAcademicYear,
        dueDate: newDueDate,
        tuitionFee: Number(newTuitionFee),
        hostelFee: Number(newHostelFee),
        examFee: Number(newExamFee),
        libraryFee: Number(newLibraryFee),
        otherFees: Number(newOtherFees),
      });

      if (res.success) {
        setMessage({ type: 'success', text: 'Fee Structure created successfully!' });
        setShowCreateModal(false);
        setNewTitle('');
        loadData();
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to create fee structure' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error creating fee structure' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStructure = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this fee structure?')) return;
    try {
      const res = await feeService.deleteStructure(id);
      if (res.success) {
        setMessage({ type: 'success', text: 'Fee Structure deleted' });
        loadData();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete structure' });
    }
  };

  const handleAssignFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignFeeStructureId) {
      setMessage({ type: 'error', text: 'Please select a fee structure to assign' });
      return;
    }

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await feeService.assignFees({
        feeStructureId: assignFeeStructureId,
        courseId: assignCourseId || undefined,
        semesterId: assignSemesterId || undefined,
      });

      if (res.success) {
        setMessage({ type: 'success', text: res.message });
        loadData();
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to assign fee' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error assigning fee' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredDefaulters = (overview?.defaulters || []).filter((d) =>
    d.name.toLowerCase().includes(defaulterSearch.toLowerCase()) ||
    d.studentId.toLowerCase().includes(defaulterSearch.toLowerCase()) ||
    d.course.toLowerCase().includes(defaulterSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Fees &amp; Payment Architecture</h2>
              <p className="text-xs text-slate-400">Billing structures, student allocations &amp; collection ledger</p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-emerald-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Collection Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('structures')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'structures'
                ? 'bg-gradient-to-r from-emerald-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Fee Structures ({structures.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('assign')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'assign'
                ? 'bg-gradient-to-r from-emerald-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Bulk Fee Allocation</span>
          </button>
        </div>
      </div>

      {/* Notification Message */}
      {message && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center space-x-4">
          <div className="p-3 bg-brand-500/10 rounded-2xl text-brand-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Billed</p>
            <p className="text-2xl font-black text-white mt-0.5 font-mono">
              &#x20B9;{(overview?.summary.totalExpected || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Collected</p>
            <p className="text-2xl font-black text-emerald-400 mt-0.5 font-mono">
              &#x20B9;{(overview?.summary.totalCollected || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center space-x-4">
          <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Outstanding Due</p>
            <p className="text-2xl font-black text-rose-400 mt-0.5 font-mono">
              &#x20B9;{(overview?.summary.totalPending || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center space-x-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Collection Rate</p>
            <p className="text-2xl font-black text-indigo-400 mt-0.5 font-mono">
              {overview?.summary.collectionRate || 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Tab 1: Collection Overview & Defaulters Roster */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950/40">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Fee Defaulters &amp; Outstanding Balances Roster</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Students with remaining pending fee balances</p>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={defaulterSearch}
                    onChange={(e) => setDefaulterSearch(e.target.value)}
                    placeholder="Search student or roll ID..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <button
                  onClick={loadData}
                  className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/60">
                    <th className="py-3.5 px-6">Student Details</th>
                    <th className="py-3.5 px-6">Course &amp; Section</th>
                    <th className="py-3.5 px-6">Fee Structure Title</th>
                    <th className="py-3.5 px-6 text-right">Total Fee</th>
                    <th className="py-3.5 px-6 text-right">Paid Amount</th>
                    <th className="py-3.5 px-6 text-right">Remaining Balance</th>
                    <th className="py-3.5 px-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                        Loading collection analytics...
                      </td>
                    </tr>
                  ) : filteredDefaulters.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No fee defaulters found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredDefaulters.map((def) => (
                      <tr key={def.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3.5 px-6">
                          <p className="font-bold text-white">{def.name}</p>
                          <p className="text-[10px] font-mono text-brand-400">{def.studentId}</p>
                        </td>
                        <td className="py-3.5 px-6">
                          <p className="font-semibold text-slate-200">{def.course}</p>
                          <p className="text-[10px] text-slate-400">Sem {def.semester} &bull; {def.section}</p>
                        </td>
                        <td className="py-3.5 px-6 text-slate-300 font-medium">{def.feeTitle}</td>
                        <td className="py-3.5 px-6 text-right font-mono font-bold text-slate-200">
                          &#x20B9;{def.totalAmount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono text-emerald-400 font-bold">
                          &#x20B9;{def.paidAmount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono text-rose-400 font-black">
                          &#x20B9;{def.remainingAmount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-6 text-center">
                          <span
                            className={`px-2.5 py-1 rounded text-[10px] font-extrabold ${
                              def.status === 'PARTIALLY_PAID'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {def.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Fee Structures Management */}
      {activeTab === 'structures' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Configured Fee Structures</h3>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-emerald-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Fee Structure</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {structures.map((st) => (
              <div
                key={st.id}
                className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      {st.course?.code || 'Course'} &bull; Semester {st.semester?.number || 1}
                    </span>
                    <h4 className="text-lg font-extrabold text-white mt-1">{st.title}</h4>
                    <p className="text-xs text-slate-400">Academic Year: {st.academicYear} &bull; Due Date: {st.dueDate}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteStructure(st.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 rounded-xl bg-slate-900 border border-slate-800 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Itemized breakdown grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-2 border-t border-slate-800">
                  <div className="p-2 bg-slate-950/60 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Tuition</p>
                    <p className="font-mono font-bold text-slate-200 mt-0.5">&#x20B9;{st.tuitionFee.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-slate-950/60 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Hostel</p>
                    <p className="font-mono font-bold text-slate-200 mt-0.5">&#x20B9;{st.hostelFee.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-slate-950/60 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Exam</p>
                    <p className="font-mono font-bold text-slate-200 mt-0.5">&#x20B9;{st.examFee.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-slate-950/60 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Library</p>
                    <p className="font-mono font-bold text-slate-200 mt-0.5">&#x20B9;{st.libraryFee.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-slate-950/60 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Other</p>
                    <p className="font-mono font-bold text-slate-200 mt-0.5">&#x20B9;{st.otherFees.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <p className="text-[10px] text-emerald-400 uppercase font-extrabold">Total Fee</p>
                    <p className="font-mono font-black text-emerald-400 mt-0.5">&#x20B9;{st.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Bulk Fee Assignment */}
      {activeTab === 'assign' && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 max-w-2xl mx-auto space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
            <Send className="w-6 h-6 text-brand-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Bulk Student Fee Assignment</h3>
              <p className="text-xs text-slate-400">Assign configured fee structures to all active students in a course &amp; semester</p>
            </div>
          </div>

          <form onSubmit={handleAssignFee} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Select Fee Structure</label>
              <select
                value={assignFeeStructureId}
                onChange={(e) => setAssignFeeStructureId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                required
              >
                <option value="">-- Choose Fee Structure --</option>
                {structures.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.title} ({st.course?.code} - Sem {st.semester?.number}) - &#x20B9;{st.totalAmount.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Filter Course (Optional)</label>
                <select
                  value={assignCourseId}
                  onChange={(e) => setAssignCourseId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                >
                  <option value="">Default (From Structure)</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Filter Semester (Optional)</label>
                <select
                  value={assignSemesterId}
                  onChange={(e) => setAssignSemesterId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                >
                  <option value="">Default (From Structure)</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <option key={num} value={String(num)}>
                      Semester {num}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 hover:opacity-95 transition flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Execute Bulk Fee Allocation</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Modal: Create Fee Structure */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <span>Create New Fee Structure</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateStructure} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Structure Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. B.Tech Sem 1 Academic Fee 2026"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Target Course</label>
                  <select
                    value={newCourseId}
                    onChange={(e) => setNewCourseId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                    required
                  >
                    <option value="">-- Select Course --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Target Semester</label>
                  <select
                    value={newSemesterId}
                    onChange={(e) => setNewSemesterId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                    required
                  >
                    <option value="">-- Select Semester --</option>
                    {semesters.map((s) => (
                      <option key={s.id} value={s.id}>
                        Semester {s.number} ({s.academicYear})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={newAcademicYear}
                    onChange={(e) => setNewAcademicYear(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              {/* Itemized Fee Amounts */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tuition (&#x20B9;)</label>
                  <input
                    type="number"
                    value={newTuitionFee}
                    onChange={(e) => setNewTuitionFee(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Hostel (&#x20B9;)</label>
                  <input
                    type="number"
                    value={newHostelFee}
                    onChange={(e) => setNewHostelFee(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Exam (&#x20B9;)</label>
                  <input
                    type="number"
                    value={newExamFee}
                    onChange={(e) => setNewExamFee(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Library (&#x20B9;)</label>
                  <input
                    type="number"
                    value={newLibraryFee}
                    onChange={(e) => setNewLibraryFee(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Other (&#x20B9;)</label>
                  <input
                    type="number"
                    value={newOtherFees}
                    onChange={(e) => setNewOtherFees(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex flex-col justify-center">
                  <span className="text-[9px] uppercase font-bold text-emerald-400">Total Calculated</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    &#x20B9;{(Number(newTuitionFee) + Number(newHostelFee) + Number(newExamFee) + Number(newLibraryFee) + Number(newOtherFees)).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500"
                >
                  {actionLoading ? 'Saving...' : 'Create Structure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeeManagement;

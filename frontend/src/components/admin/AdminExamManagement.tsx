import React, { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  Calendar,
  BookOpen,
  Trash2,
  RefreshCw,
  Search,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Trophy,
  BarChart3,
  Percent,
  Check,
} from 'lucide-react';
import { examService, Exam, CreateExamInput } from '../../services/examService';
import { marksService, ResultsOverviewData } from '../../services/marksService';
import { Subject } from '../../services/subjectService';
import { Course } from '../../services/courseService';

interface AdminExamManagementProps {
  subjects: Subject[];
  courses: Course[];
  onRefresh?: () => void;
}

export const AdminExamManagement: React.FC<AdminExamManagementProps> = ({
  subjects,
  courses,
}) => {
  const [activeTab, setActiveTab] = useState<'schedules' | 'analytics'>('schedules');
  const [exams, setExams] = useState<Exam[]>([]);
  const [analytics, setAnalytics] = useState<ResultsOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State for New Exam Creation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateExamInput>({
    name: '',
    examType: 'INTERNAL_1',
    subjectId: subjects[0]?.id || '',
    maxMarks: 100,
    date: new Date().toISOString().split('T')[0],
    academicYear: '2026-2027',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [examsRes, overviewRes] = await Promise.all([
        examService.getAll(),
        marksService.getOverview(),
      ]);

      if (examsRes.success) setExams(examsRes.data);
      if (overviewRes.success) setAnalytics(overviewRes.data);
    } catch (err) {
      console.error('Failed to load exam data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (subjects.length > 0 && !formData.subjectId) {
      setFormData((prev) => ({ ...prev, subjectId: subjects[0].id }));
    }
  }, [subjects]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.subjectId || !formData.date) {
      setMessage({ type: 'error', text: 'Please fill out all required fields.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await examService.create(formData);
      if (res.success) {
        setMessage({ type: 'success', text: 'Exam scheduled successfully!' });
        setIsModalOpen(false);
        setFormData({
          name: '',
          examType: 'INTERNAL_1',
          subjectId: subjects[0]?.id || '',
          maxMarks: 100,
          date: new Date().toISOString().split('T')[0],
          academicYear: '2026-2027',
        });
        loadData();
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to create exam.' });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Error creating exam schedule.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this exam schedule?')) return;
    try {
      const res = await examService.delete(id);
      if (res.success) {
        loadData();
      }
    } catch (err) {
      console.error('Failed to delete exam', err);
    }
  };

  const filteredExams = exams.filter(
    (ex) =>
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.subject?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.subject?.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-brand-400 font-semibold text-xs mb-1">
            <Award className="w-4 h-4" />
            <span>EXAMINATIONS &amp; RESULTS HUB</span>
          </div>
          <h2 className="text-2xl font-black text-white">Central Exam Management</h2>
          <p className="text-xs text-slate-400 mt-1">
            Schedule exams, manage paper structures, and analyze college academic results.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('schedules')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'schedules'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Exam Schedules
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'analytics'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Results &amp; Analytics
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-brand-500/20 flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Exam</span>
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {message && (
        <div
          className={`p-4 rounded-2xl border flex items-center space-x-2 text-xs font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tab 1: Exam Schedules */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search exam name or subject code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
            <button
              onClick={loadData}
              className="p-2 bg-slate-900 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-2 glass-panel p-12 text-center text-slate-400 rounded-3xl border border-slate-800">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-400 mb-2" />
                Loading exam schedules...
              </div>
            ) : filteredExams.length === 0 ? (
              <div className="col-span-2 glass-panel p-12 text-center text-slate-400 rounded-3xl border border-slate-800">
                No exam schedules found. Click &quot;Schedule Exam&quot; to create one.
              </div>
            ) : (
              filteredExams.map((ex) => (
                <div
                  key={ex.id}
                  className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 hover:border-slate-700 transition relative group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20">
                        {ex.examType} &bull; {ex.academicYear}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-1.5">{ex.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {ex.subject?.code} - {ex.subject?.name}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteExam(ex.id)}
                      className="p-2 bg-slate-900 hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 rounded-xl border border-slate-800 transition"
                      title="Delete Exam"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-900/60">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Max Marks</p>
                      <p className="font-mono font-bold text-white mt-0.5">{ex.maxMarks}</p>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900/60">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Exam Date</p>
                      <p className="font-mono font-bold text-brand-300 mt-0.5">{ex.date}</p>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900/60">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Marks Entered</p>
                      <p className="font-mono font-bold text-emerald-400 mt-0.5">{ex._count?.marks || 0}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Results & Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* KPI Analytics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 flex items-center space-x-4">
              <div className="p-3 bg-brand-500/10 rounded-2xl text-brand-400">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Average SGPA</p>
                <p className="text-2xl font-black text-white mt-1">{analytics?.averageSGPA || '0.00'}</p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/20 flex items-center space-x-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
                <Percent className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-semibold">College Pass Rate</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">{analytics?.passPercentage || '0.0'}%</p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/90 border border-indigo-500/20 flex items-center space-x-4">
              <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Passed Students</p>
                <p className="text-2xl font-black text-indigo-400 mt-1">{analytics?.passCount || 0}</p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/90 border border-rose-500/20 flex items-center space-x-4">
              <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-400">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Failed Students</p>
                <p className="text-2xl font-black text-rose-400 mt-1">{analytics?.failCount || 0}</p>
              </div>
            </div>
          </div>

          {/* Rankers Leaderboard Table */}
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Academic Performance Leaderboard</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Ranked by SGPA</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/60">
                    <th className="py-3.5 px-6">Rank</th>
                    <th className="py-3.5 px-6">Student</th>
                    <th className="py-3.5 px-6">Course &amp; Section</th>
                    <th className="py-3.5 px-6 text-center">SGPA / CGPA</th>
                    <th className="py-3.5 px-6 text-center">Overall Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Calculating leaderboard ranks...
                      </td>
                    </tr>
                  ) : !analytics?.leaderboard || analytics.leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No student result records computed yet.
                      </td>
                    </tr>
                  ) : (
                    analytics.leaderboard.map((lb, index) => (
                      <tr key={lb.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3.5 px-6 font-mono font-bold text-slate-400">
                          {index === 0 ? (
                            <span className="inline-flex items-center gap-1 text-amber-400">
                              <Trophy className="w-4 h-4" /> #1
                            </span>
                          ) : (
                            `#${index + 1}`
                          )}
                        </td>
                        <td className="py-3.5 px-6">
                          <p className="font-semibold text-white">{lb.name}</p>
                          <p className="text-[10px] font-mono text-brand-300">{lb.studentId}</p>
                        </td>
                        <td className="py-3.5 px-6 text-slate-300">
                          {lb.course} &bull; {lb.section}
                        </td>
                        <td className="py-3.5 px-6 text-center font-mono font-extrabold text-white text-sm">
                          {lb.sgpa}
                        </td>
                        <td className="py-3.5 px-6 text-center">
                          {lb.overallStatus === 'PASS' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                              PASS
                            </span>
                          ) : lb.overallStatus === 'FAIL' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                              FAIL
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold">
                              PENDING
                            </span>
                          )}
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

      {/* Modal: Schedule New Exam */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-slate-800 p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-400" />
                <span>Schedule New Exam</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Exam Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid Semester Examination"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Exam Type</label>
                  <select
                    value={formData.examType}
                    onChange={(e) => setFormData({ ...formData, examType: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="INTERNAL_1">Internal 1</option>
                    <option value="INTERNAL_2">Internal 2</option>
                    <option value="MID_SEM">Mid Sem</option>
                    <option value="END_SEM">End Sem</option>
                    <option value="PRACTICAL">Practical</option>
                    <option value="ASSIGNMENT">Assignment</option>
                    <option value="QUIZ">Quiz</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Subject</label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.code} - {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Max Marks</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.maxMarks}
                    onChange={(e) => setFormData({ ...formData, maxMarks: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Academic Year</label>
                  <input
                    type="text"
                    required
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/20"
                >
                  {submitting ? 'Creating...' : 'Schedule Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExamManagement;

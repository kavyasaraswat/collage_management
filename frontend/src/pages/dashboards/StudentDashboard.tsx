import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  UserCheck,
  LogOut,
  BookOpen,
  Layers,
  Award,
  CheckCircle2,
  CheckSquare,
  AlertTriangle,
  Clock,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { attendanceService, StudentAttendanceSummary } from '../../services/attendanceService';
import { marksService, StudentScorecardData } from '../../services/marksService';

export const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const student = user?.student;

  const [activeTab, setActiveTab] = useState<'attendance' | 'results'>('attendance');

  const [summary, setSummary] = useState<StudentAttendanceSummary | null>(null);
  const [scorecard, setScorecard] = useState<StudentScorecardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [attRes, marksRes] = await Promise.all([
        attendanceService.getMyAttendance(),
        marksService.getMyScorecard(),
      ]);

      if (attRes.success) setSummary(attRes.data);
      if (marksRes.success) setScorecard(marksRes.data);
    } catch (err) {
      console.error('Failed to load student dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getHealthCategoryBadge = (category: string) => {
    switch (category) {
      case 'EXCELLENT':
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Excellent (&ge;85%)
          </span>
        );
      case 'GOOD':
        return (
          <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Good (75-84.9%)
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Warning (65-74.9%)
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Critical (&lt;65%)
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold text-[10px]">PRESENT</span>;
      case 'ABSENT':
        return <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-semibold text-[10px]">ABSENT</span>;
      case 'LATE':
        return <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold text-[10px]">LATE</span>;
      case 'EXCUSED':
        return <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-semibold text-[10px]">EXCUSED</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold text-[10px]">{status}</span>;
    }
  };

  const overall = summary?.overall;
  const subjects = summary?.subjects || [];
  const recentLogs = summary?.recentLogs || [];

  const resultsInfo = scorecard?.results;
  const subjectScorecards = scorecard?.subjects || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-8 relative overflow-hidden font-sans">
      {/* Background Lighting */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 z-10 glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <UserCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Student Portal</h1>
            <p className="text-xs text-slate-400">AcademiaPro Enterprise ERP</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'attendance'
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Attendance Monitor</span>
          </button>

          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'results'
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Exam Results Scorecard</span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-white">{student?.name || user?.email}</p>
            <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
              ID: {student?.studentId || 'STU-2026-001'}
            </span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-sm font-medium transition"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto w-full my-6 z-10 space-y-6">
        {/* Welcome Banner */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-xs font-semibold text-brand-400 mb-3">
                <Sparkles className="w-4 h-4" /> Phase 5 Exam Results Engine Active
              </span>
              <h2 className="text-3xl font-extrabold text-white mb-2">Welcome back, {student?.name || 'Student'}!</h2>
              <p className="text-slate-400 text-sm max-w-xl">
                Enrolled in <span className="text-slate-200 font-semibold">{student?.course?.name || 'B.Tech Computer Science'}</span> &bull; Batch{' '}
                <span className="text-slate-200 font-semibold">{student?.batch || '2026'}</span> &bull; Section{' '}
                <span className="text-slate-200 font-semibold">{student?.section?.name || 'Section A'}</span>.
              </p>
            </div>

            {/* Results / Attendance Gauge */}
            {activeTab === 'results' && resultsInfo ? (
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex items-center space-x-6">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Semester SGPA</p>
                  <p className="text-4xl font-black text-white mt-1">{resultsInfo.sgpa}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Credits Earned: {resultsInfo.totalCredits}
                  </p>
                </div>
                <div>
                  {resultsInfo.overallStatus === 'PASS' ? (
                    <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> OVERALL PASS
                    </span>
                  ) : resultsInfo.overallStatus === 'FAIL' ? (
                    <span className="px-3.5 py-1.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-extrabold flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> OVERALL FAIL
                    </span>
                  ) : (
                    <span className="px-3.5 py-1.5 rounded-full bg-slate-800 text-slate-400 text-xs font-extrabold">
                      PENDING
                    </span>
                  )}
                </div>
              </div>
            ) : overall ? (
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex items-center space-x-6">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overall Attendance</p>
                  <p className="text-4xl font-black text-white mt-1">{overall.percentage}%</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {overall.totalAttended} / {overall.totalClasses} Sessions
                  </p>
                </div>
                <div>{getHealthCategoryBadge(overall.healthCategory)}</div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Tab 1: Attendance */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* Academic Details Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-4">
                <div className="p-3 bg-brand-500/10 rounded-xl text-brand-400">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-medium">Department</p>
                  <p className="text-sm font-bold text-white mt-1">{student?.department?.name || 'CSE'}</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-4">
                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-medium">Current Semester</p>
                  <p className="text-sm font-bold text-white mt-1">Semester {student?.semester?.number || 1}</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-medium">Attendance Calculation</p>
                  <p className="text-sm font-bold text-emerald-400 mt-1">Automated (Real-time)</p>
                </div>
              </div>
            </div>

            {/* Subject-Wise Attendance Breakdown Cards */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-brand-400" />
                  <span>Subject-Wise Attendance Breakdown</span>
                </h3>
                <button
                  onClick={loadData}
                  className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 transition"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loading ? (
                <div className="glass-panel p-12 text-center text-slate-400 rounded-3xl border border-slate-800">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-400 mb-2" />
                  Loading student attendance breakdown...
                </div>
              ) : subjects.length === 0 ? (
                <div className="glass-panel p-8 text-center text-slate-400 rounded-3xl border border-slate-800">
                  No subjects or attendance data found for this semester.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subjects.map((sub) => (
                    <div
                      key={sub.subjectId}
                      className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 hover:border-slate-700 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-brand-300 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                            {sub.subjectCode} &bull; {sub.credits} Credits
                          </span>
                          <h4 className="text-base font-extrabold text-white mt-1">{sub.subjectName}</h4>
                        </div>
                        {getHealthCategoryBadge(sub.healthCategory)}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-400">Attendance Turnout</span>
                          <span className="text-emerald-400">{sub.percentage}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, sub.percentage))}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-center">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Attended</p>
                          <p className="text-sm font-bold text-emerald-400 mt-0.5">{sub.attended}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Absent</p>
                          <p className="text-sm font-bold text-rose-400 mt-0.5">{sub.absent}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Late</p>
                          <p className="text-sm font-bold text-amber-400 mt-0.5">{sub.late}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Total</p>
                          <p className="text-sm font-bold text-slate-200 mt-0.5">{sub.total}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Log Feed */}
            <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span>Recent Class Session Activity Log</span>
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/60">
                      <th className="py-3 px-6">Session Date</th>
                      <th className="py-3 px-6">Subject Code</th>
                      <th className="py-3 px-6">Subject Name</th>
                      <th className="py-3 px-6 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {recentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 px-6 font-mono text-slate-300">{log.date}</td>
                        <td className="py-3 px-6 font-mono text-brand-300 font-semibold">{log.subjectCode}</td>
                        <td className="py-3 px-6 text-white font-medium">{log.subjectName}</td>
                        <td className="py-3 px-6 text-center">{getStatusBadge(log.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Exam Results & Scorecard */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Official Academic Grade Scorecard</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">10-Point Grade Scale</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/60">
                      <th className="py-3.5 px-6">Subject Code &amp; Title</th>
                      <th className="py-3.5 px-6 text-center">Credits</th>
                      <th className="py-3.5 px-6 text-center">Marks Obtained / Max</th>
                      <th className="py-3.5 px-6 text-center">Percentage</th>
                      <th className="py-3.5 px-6 text-center">Letter Grade</th>
                      <th className="py-3.5 px-6 text-center">Grade Points</th>
                      <th className="py-3.5 px-6 text-center">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-400 mb-2" />
                          Calculating student academic scorecard...
                        </td>
                      </tr>
                    ) : subjectScorecards.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          No examination marks entered yet for this semester.
                        </td>
                      </tr>
                    ) : (
                      subjectScorecards.map((sub) => (
                        <tr key={sub.subjectId} className="hover:bg-slate-900/40 transition">
                          <td className="py-3.5 px-6">
                            <p className="font-semibold text-white">{sub.subjectName}</p>
                            <p className="text-[10px] font-mono text-brand-300">{sub.subjectCode}</p>
                          </td>
                          <td className="py-3.5 px-6 text-center font-mono text-slate-300">
                            {sub.credits}
                          </td>
                          <td className="py-3.5 px-6 text-center font-mono font-bold text-slate-200">
                            {sub.obtained} / {sub.maxMarks}
                          </td>
                          <td className="py-3.5 px-6 text-center font-mono font-extrabold text-white">
                            {sub.percentage}%
                          </td>
                          <td className="py-3.5 px-6 text-center">
                            <span
                              className={`px-2.5 py-1 rounded text-xs font-black ${
                                sub.grade === 'O'
                                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                  : sub.grade === 'A+' || sub.grade === 'A'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : sub.grade === 'B+' || sub.grade === 'B'
                                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {sub.grade}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-center font-mono font-bold text-slate-200">
                            {sub.gradePoint.toFixed(1)}
                          </td>
                          <td className="py-3.5 px-6 text-center">
                            {sub.status === 'PASS' ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                                PASS
                              </span>
                            ) : sub.status === 'FAIL' ? (
                              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                                FAIL
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold">
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
      </main>

      <footer className="text-center text-xs text-slate-500 z-10 py-4">
        AcademiaPro College ERP &copy; 2026 | Student Portal
      </footer>
    </div>
  );
};

export default StudentDashboard;

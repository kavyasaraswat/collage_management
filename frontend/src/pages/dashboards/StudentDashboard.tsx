import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserCheck, LogOut, BookOpen, Layers, Award, CheckCircle2 } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const student = user?.student;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 md:p-12 relative overflow-hidden">
      {/* Background Lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="flex items-center justify-between z-10 glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <UserCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Student Portal</h1>
            <p className="text-xs text-slate-400">AcademiaPro ERP</p>
          </div>
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
      <main className="max-w-6xl mx-auto w-full my-8 z-10">
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-xs font-semibold text-brand-400 mb-3">
            <Award className="w-4 h-4" /> Phase 2 Verification Success
          </span>
          <h2 className="text-3xl font-extrabold text-white mb-2">Welcome, {student?.name || 'Student'}!</h2>
          <p className="text-slate-400 text-sm max-w-xl">
            Enrolled in <span className="text-slate-200">{student?.course?.name || 'B.Tech Computer Science & Engineering'}</span> | Batch{' '}
            <span className="text-slate-200">{student?.batch || '2026'}</span> | Section{' '}
            <span className="text-slate-200">{student?.section?.name || 'Section A'}</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-4">
            <div className="p-3 bg-brand-500/10 rounded-xl text-brand-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-medium">Department</p>
              <p className="text-sm font-bold text-white mt-1">{student?.department?.name || 'CSE'}</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-medium">Current Semester</p>
              <p className="text-sm font-bold text-white mt-1">Semester {student?.semester?.number || 1}</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-medium">Authentication</p>
              <p className="text-sm font-bold text-emerald-400 mt-1">Verified Session</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-500 z-10">
        AcademiaPro College ERP &copy; 2026 | Student Portal
      </footer>
    </div>
  );
};

export default StudentDashboard;

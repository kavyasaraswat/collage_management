import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, LogOut, BookOpen, Calendar, CheckSquare, Sparkles, LayoutDashboard } from 'lucide-react';
import TeacherAttendance from '../../components/teacher/TeacherAttendance';

export const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const teacher = user?.teacher;
  const [activeTab, setActiveTab] = useState<'attendance' | 'overview'>('attendance');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-8 relative overflow-hidden font-sans">
      {/* Background Lighting Blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 z-10 glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-brand-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Faculty Portal</h1>
            <p className="text-xs text-slate-400">AcademiaPro Enterprise ERP</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'attendance'
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Mark Attendance</span>
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Faculty Profile</span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-white">{teacher?.name || user?.email}</p>
            <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {teacher?.designation || 'Faculty Member'}
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
        {activeTab === 'overview' ? (
          <div className="space-y-6">
            <div className="glass-panel p-8 rounded-3xl border border-slate-800">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400 mb-3">
                <Sparkles className="w-4 h-4" /> Phase 4 Attendance System Active
              </span>
              <h2 className="text-3xl font-extrabold text-white mb-2">Welcome, {teacher?.name || 'Faculty Member'}!</h2>
              <p className="text-slate-400 text-sm max-w-xl">
                Teacher ID <span className="font-mono text-slate-200">{teacher?.teacherId || 'TCH-101'}</span> in Department of{' '}
                <span className="text-slate-200">{teacher?.department?.name || 'Computer Science & Engineering'}</span>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-4">
                <div className="p-3 bg-brand-500/10 rounded-xl text-brand-400">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-medium">Assigned Subject</p>
                  <p className="text-lg font-bold text-white mt-1">Data Structures & Algorithms</p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-4">
                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-medium">Attendance Subsystem</p>
                  <p className="text-lg font-bold text-emerald-400 mt-1">Active &amp; Verified</p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-4">
                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-medium">Academic Session</p>
                  <p className="text-lg font-bold text-white mt-1">2026 - 2027</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <TeacherAttendance />
        )}
      </main>

      <footer className="text-center text-xs text-slate-500 z-10 py-4">
        AcademiaPro College ERP &copy; 2026 | Faculty Portal
      </footer>
    </div>
  );
};

export default TeacherDashboard;

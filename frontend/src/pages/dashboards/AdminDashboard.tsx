import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, LogOut, Users, BookOpen, Layers, Award } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 md:p-12 relative overflow-hidden">
      {/* Background Lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation */}
      <header className="flex items-center justify-between z-10 glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-brand-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Admin Control Portal</h1>
            <p className="text-xs text-slate-400">AcademiaPro Management Suite</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-white">{user?.email}</p>
            <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Role: {user?.role}
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
        {/* Banner */}
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 mb-8 relative overflow-hidden">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400 mb-3">
              <ShieldCheck className="w-4 h-4" /> Phase 2 Verification Success
            </span>
            <h2 className="text-3xl font-extrabold text-white mb-2">Welcome Back, Administrator!</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Your administrative credentials have been successfully authenticated with JWT session token. Role-based access control and user authorization middleware are active.
            </p>
          </div>
        </div>

        {/* Quick Diagnostics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-4">
            <div className="p-3 bg-brand-500/10 rounded-xl text-brand-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-medium">System Users</p>
              <p className="text-xl font-bold text-white mt-1">Active</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-medium">Departments</p>
              <p className="text-xl font-bold text-white mt-1">CSE Configured</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-medium">Courses</p>
              <p className="text-xl font-bold text-white mt-1">B.Tech CSE</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-4">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-medium">Auth Status</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">JWT Verified</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-500 z-10">
        AcademiaPro College ERP &copy; 2026 | Admin Console
      </footer>
    </div>
  );
};

export default AdminDashboard;

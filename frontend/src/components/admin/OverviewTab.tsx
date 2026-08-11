import React from 'react';
import { Users, UserCheck, Layers, BookOpen, GraduationCap, Award, PlusCircle, Server, CheckCircle } from 'lucide-react';

interface OverviewTabProps {
  stats: {
    studentsCount: number;
    teachersCount: number;
    departmentsCount: number;
    coursesCount: number;
    subjectsCount: number;
  };
  onNavigateTab: (tab: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ stats, onNavigateTab }) => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 relative overflow-hidden bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-indigo-950/40">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-2xl relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-xs font-semibold text-brand-400 mb-3">
            <CheckCircle className="w-3.5 h-3.5" /> System Status: Operational
          </span>
          <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
            AcademiaPro Executive Command Dashboard
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Welcome to the centralized management console. Control departments, courses, student enrollments, faculty allocations, and administrative controls.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('students')}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-brand-600/30 transition"
            >
              <PlusCircle className="w-4 h-4" /> Manage Students
            </button>
            <button
              onClick={() => onNavigateTab('teachers')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
            >
              <Users className="w-4 h-4 text-emerald-400" /> Faculty Management
            </button>
            <button
              onClick={() => onNavigateTab('academic')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
            >
              <Layers className="w-4 h-4 text-indigo-400" /> Academic Structures
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-4 shadow-xl hover:border-slate-700 transition">
          <div className="p-3 bg-brand-500/10 rounded-xl text-brand-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-medium tracking-wider">Total Students</p>
            <p className="text-2xl font-bold text-white mt-0.5">{stats.studentsCount}</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-4 shadow-xl hover:border-slate-700 transition">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-medium tracking-wider">Faculty Teachers</p>
            <p className="text-2xl font-bold text-white mt-0.5">{stats.teachersCount}</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-4 shadow-xl hover:border-slate-700 transition">
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-medium tracking-wider">Departments</p>
            <p className="text-2xl font-bold text-white mt-0.5">{stats.departmentsCount}</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-4 shadow-xl hover:border-slate-700 transition">
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-medium tracking-wider">Courses</p>
            <p className="text-2xl font-bold text-white mt-0.5">{stats.coursesCount}</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-4 shadow-xl hover:border-slate-700 transition">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-medium tracking-wider">Active Subjects</p>
            <p className="text-2xl font-bold text-white mt-0.5">{stats.subjectsCount}</p>
          </div>
        </div>
      </div>

      {/* Diagnostics Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-3 mb-4">
          <Server className="w-5 h-5 text-brand-400" />
          <h3 className="text-base font-semibold text-white">System Architecture & Active Modules</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <p className="text-xs font-semibold text-brand-400 uppercase">Phase 1 & Phase 2</p>
            <h4 className="text-sm font-bold text-white mt-1">Auth & RBAC Infrastructure</h4>
            <p className="text-xs text-slate-400 mt-1">JWT verification, password hashing, and role authorization active.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-emerald-900/40">
            <p className="text-xs font-semibold text-emerald-400 uppercase">Phase 3 Ready</p>
            <h4 className="text-sm font-bold text-white mt-1">Master Resource Engine</h4>
            <p className="text-xs text-slate-400 mt-1">Complete REST APIs for Students, Teachers, Departments, Courses & Subjects.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <p className="text-xs font-semibold text-indigo-400 uppercase">Security & Validation</p>
            <h4 className="text-sm font-bold text-white mt-1">Unique Constraint Engine</h4>
            <p className="text-xs text-slate-400 mt-1">Unique Student Roll ID, Teacher Employee ID, and Course/Subject codes enforced.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;

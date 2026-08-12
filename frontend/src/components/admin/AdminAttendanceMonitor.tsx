import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Search,
  Filter,
  RefreshCw,
  Award,
  BookOpen,
} from 'lucide-react';
import { attendanceService, AttendanceOverviewData, DefaulterStudent } from '../../services/attendanceService';
import { Department } from '../../services/departmentService';
import { Course } from '../../services/courseService';
import { Semester } from '../../services/semesterService';
import { Section } from '../../services/sectionService';

interface AdminAttendanceMonitorProps {
  departments: Department[];
  courses: Course[];
  semesters: Semester[];
  sections: Section[];
}

export const AdminAttendanceMonitor: React.FC<AdminAttendanceMonitorProps> = ({
  departments,
  courses,
  semesters,
  sections,
}) => {
  const [data, setData] = useState<AttendanceOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [departmentId, setDepartmentId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [sectionId, setSectionId] = useState('');
  
  const [filterMode, setFilterMode] = useState<'ALL' | 'DEFAULTERS' | 'CRITICAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getOverview({
        departmentId: departmentId || undefined,
        courseId: courseId || undefined,
        semesterId: semesterId || undefined,
        sectionId: sectionId || undefined,
      });

      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load attendance overview data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, [departmentId, courseId, semesterId, sectionId]);

  const getHealthBadge = (category: string) => {
    switch (category) {
      case 'EXCELLENT':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">Excellent (&ge;85%)</span>;
      case 'GOOD':
        return <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold">Good (75-84.9%)</span>;
      case 'WARNING':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">Warning (65-74.9%)</span>;
      case 'CRITICAL':
        return <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold">Critical (&lt;65%)</span>;
      default:
        return null;
    }
  };

  const studentList: DefaulterStudent[] = data?.allStudentsSummary || [];
  const filteredStudents = studentList.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.studentId.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterMode === 'DEFAULTERS') return st.percentage < 75;
    if (filterMode === 'CRITICAL') return st.percentage < 65;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Overview Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 flex items-center space-x-4">
          <div className="p-3 bg-brand-500/10 rounded-2xl text-brand-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Total Students</p>
            <p className="text-2xl font-black text-white mt-1">{data?.totalStudents || 0}</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-semibold">College Turnout Avg</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{data?.averagePercentage || '100.0'}%</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/90 border border-amber-500/20 flex items-center space-x-4">
          <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Defaulters (&lt;75%)</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{data?.defaultersCount || 0}</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/90 border border-rose-500/20 flex items-center space-x-4">
          <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-400">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Critical Risk (&lt;65%)</p>
            <p className="text-2xl font-black text-rose-400 mt-1">{data?.criticalCount || 0}</p>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-brand-400 font-semibold text-xs">
            <Filter className="w-4 h-4" />
            <span>ATTENDANCE MONITOR FILTERS</span>
          </div>
          <button
            onClick={loadOverview}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload Analytics</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>

          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={semesterId}
            onChange={(e) => setSemesterId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
          >
            <option value="">All Semesters</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                Semester {s.number} ({s.academicYear})
              </option>
            ))}
          </select>

          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
          >
            <option value="">All Sections</option>
            {sections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Student Attendance Roster Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/40">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterMode === 'ALL'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Roster ({studentList.length})
            </button>
            <button
              onClick={() => setFilterMode('DEFAULTERS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterMode === 'DEFAULTERS'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Defaulters (&lt;75%) ({data?.defaultersCount || 0})
            </button>
            <button
              onClick={() => setFilterMode('CRITICAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterMode === 'CRITICAL'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Critical (&lt;65%) ({data?.criticalCount || 0})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search roll no or student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/60">
                <th className="py-3.5 px-6">Student</th>
                <th className="py-3.5 px-6">Department & Course</th>
                <th className="py-3.5 px-6">Class Section</th>
                <th className="py-3.5 px-6 text-center">Attended / Total</th>
                <th className="py-3.5 px-6 text-center">Turnout %</th>
                <th className="py-3.5 px-6 text-center">Health Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-400 mb-2" />
                    Calculating college attendance statistics...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No student records matching current filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                          {st.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{st.name}</p>
                          <p className="text-[10px] font-mono text-brand-400">{st.studentId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <p className="font-medium text-slate-200">{st.course}</p>
                      <p className="text-[10px] text-slate-400">{st.department}</p>
                    </td>
                    <td className="py-3.5 px-6 text-slate-300">
                      Sem {st.semester} &bull; {st.section}
                    </td>
                    <td className="py-3.5 px-6 text-center font-mono font-medium text-slate-200">
                      {st.attendedClasses} / {st.totalClasses}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <span
                        className={`font-mono font-black text-sm ${
                          st.percentage >= 85
                            ? 'text-emerald-400'
                            : st.percentage >= 75
                            ? 'text-indigo-400'
                            : st.percentage >= 65
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {st.percentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-center">{getHealthBadge(st.healthCategory)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAttendanceMonitor;

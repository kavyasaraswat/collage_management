import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  LogOut,
  LayoutDashboard,
  GraduationCap,
  Users,
  Layers,
  BookOpen,
  Menu,
  X,
  Sparkles,
  CheckSquare,
} from 'lucide-react';
import OverviewTab from '../../components/admin/OverviewTab';
import StudentManagement from '../../components/admin/StudentManagement';
import TeacherManagement from '../../components/admin/TeacherManagement';
import AcademicManagement from '../../components/admin/AcademicManagement';
import SubjectManagement from '../../components/admin/SubjectManagement';
import AdminAttendanceMonitor from '../../components/admin/AdminAttendanceMonitor';

import { departmentService, Department } from '../../services/departmentService';
import { courseService, Course } from '../../services/courseService';
import { semesterService, Semester } from '../../services/semesterService';
import { sectionService, Section } from '../../services/sectionService';
import { subjectService, Subject } from '../../services/subjectService';
import { teacherService } from '../../services/teacherService';
import { studentService } from '../../services/studentService';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'students' | 'teachers' | 'academic' | 'subjects' | 'attendance'
  >('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Master Shared State
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [stats, setStats] = useState({
    studentsCount: 0,
    teachersCount: 0,
    departmentsCount: 0,
    coursesCount: 0,
    subjectsCount: 0,
    semestersCount: 0,
    sectionsCount: 0,
  });

  const loadAllMasterData = async () => {
    try {
      const [deptRes, courseRes, semRes, secRes, subjRes, teachRes, studRes] = await Promise.all([
        departmentService.getAll(),
        courseService.getAll(),
        semesterService.getAll(),
        sectionService.getAll(),
        subjectService.getAll(),
        teacherService.getAll(),
        studentService.getAll({ limit: 1 }),
      ]);

      if (deptRes.success) setDepartments(deptRes.data);
      if (courseRes.success) setCourses(courseRes.data);
      if (semRes.success) setSemesters(semRes.data);
      if (secRes.success) setSections(secRes.data);
      if (subjRes.success) setSubjects(subjRes.data);

      setStats({
        departmentsCount: deptRes.data?.length || 0,
        coursesCount: courseRes.data?.length || 0,
        semestersCount: semRes.data?.length || 0,
        sectionsCount: secRes.data?.length || 0,
        subjectsCount: subjRes.data?.length || 0,
        teachersCount: teachRes.data?.length || 0,
        studentsCount: studRes.pagination?.total || 0,
      });
    } catch (err) {
      console.error('Failed to load master admin data', err);
    }
  };

  useEffect(() => {
    loadAllMasterData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row relative overflow-hidden font-sans">
      {/* Background Lighting Blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-slate-900/90 backdrop-blur-xl border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6 space-y-6">
          {/* Logo Brand */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-white">AcademiaPro</h1>
                <p className="text-[10px] text-brand-400 font-semibold tracking-wider uppercase">ERP Admin Portal</p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-4">
            <button
              onClick={() => {
                setActiveTab('overview');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-semibold transition ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-600/25'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Executive Overview</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('students');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition ${
                activeTab === 'students'
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-600/25'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <GraduationCap className="w-4 h-4" />
                <span>Student Roster</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-brand-300 font-mono">
                {stats.studentsCount}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('teachers');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition ${
                activeTab === 'teachers'
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-600/25'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Users className="w-4 h-4" />
                <span>Faculty Members</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-emerald-300 font-mono">
                {stats.teachersCount}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('academic');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-semibold transition ${
                activeTab === 'academic'
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-600/25'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Departments & Courses</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('subjects');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition ${
                activeTab === 'subjects'
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-600/25'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <BookOpen className="w-4 h-4" />
                <span>Subjects Catalog</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-amber-300 font-mono">
                {stats.subjectsCount}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('attendance');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-semibold transition ${
                activeTab === 'attendance'
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-600/25'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <span>Attendance Monitor</span>
            </button>
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-6 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user?.email}</p>
              <span className="inline-block text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mt-1">
                ROLE: {user?.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="p-2.5 bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 text-slate-300 rounded-xl border border-slate-700 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto z-10">
        {/* Top Header */}
        <header className="p-6 border-b border-slate-800/80 glass-panel sticky top-0 z-30 flex items-center justify-between backdrop-blur-md bg-slate-950/60">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-white capitalize">
                {activeTab === 'overview' && 'Executive Overview'}
                {activeTab === 'students' && 'Student Directory & Management'}
                {activeTab === 'teachers' && 'Faculty Roster & Allocation'}
                {activeTab === 'academic' && 'Academic Structures'}
                {activeTab === 'subjects' && 'Subject Syllabus & Curriculum'}
                {activeTab === 'attendance' && 'College Attendance Monitor & Analytics'}
              </h2>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                AcademiaPro Enterprise System &bull; Phase 4 Active
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Phase 4 Active</span>
          </div>
        </header>

        {/* Tab Content Body */}
        <div className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'overview' && (
            <OverviewTab stats={stats} onNavigateTab={(tab) => setActiveTab(tab as any)} />
          )}

          {activeTab === 'students' && (
            <StudentManagement
              departments={departments}
              courses={courses}
              semesters={semesters}
              sections={sections}
            />
          )}

          {activeTab === 'teachers' && (
            <TeacherManagement
              departments={departments}
              subjects={subjects}
              sections={sections}
            />
          )}

          {activeTab === 'academic' && (
            <AcademicManagement
              departments={departments}
              courses={courses}
              semesters={semesters}
              sections={sections}
              onRefresh={loadAllMasterData}
            />
          )}

          {activeTab === 'subjects' && (
            <SubjectManagement
              subjects={subjects}
              courses={courses}
              onRefresh={loadAllMasterData}
            />
          )}

          {activeTab === 'attendance' && (
            <AdminAttendanceMonitor
              departments={departments}
              courses={courses}
              semesters={semesters}
              sections={sections}
            />
          )}
        </div>

        <footer className="p-6 text-center text-xs text-slate-500 mt-auto border-t border-slate-800/60">
          AcademiaPro ERP &copy; 2026 | Comprehensive Enterprise College Platform
        </footer>
      </main>
    </div>
  );
};

export default AdminDashboard;

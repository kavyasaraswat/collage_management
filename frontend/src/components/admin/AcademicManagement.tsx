import React, { useState } from 'react';
import { Layers, BookOpen, Calendar, Grid, Plus, Trash2, Edit2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { departmentService, Department } from '../../services/departmentService';
import { courseService, Course } from '../../services/courseService';
import { semesterService, Semester } from '../../services/semesterService';
import { sectionService, Section } from '../../services/sectionService';

interface AcademicManagementProps {
  departments: Department[];
  courses: Course[];
  semesters: Semester[];
  sections: Section[];
  onRefresh: () => void;
}

export const AcademicManagement: React.FC<AcademicManagementProps> = ({
  departments,
  courses,
  semesters,
  sections,
  onRefresh,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'departments' | 'courses' | 'semesters' | 'sections'>('departments');

  // Modal states
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptForm, setDeptForm] = useState({ code: '', name: '', description: '' });

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseForm, setCourseForm] = useState({ code: '', name: '', departmentId: '', totalSemesters: 8, durationYears: 4 });

  const [isSemModalOpen, setIsSemModalOpen] = useState(false);
  const [semForm, setSemForm] = useState({ number: 1, academicYear: '2026-2027', isCurrent: true, courseId: '' });

  const [isSecModalOpen, setIsSecModalOpen] = useState(false);
  const [secForm, setSecForm] = useState({ name: '', courseId: '', semesterId: '', capacity: 60 });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Department Handlers
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await departmentService.create(deptForm);
      setSuccess('Department created successfully!');
      setTimeout(() => {
        setIsDeptModalOpen(false);
        setDeptForm({ code: '', name: '', description: '' });
        onRefresh();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create department');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      await departmentService.delete(id);
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to delete department');
    }
  };

  // Course Handlers
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await courseService.create(courseForm);
      setSuccess('Course created successfully!');
      setTimeout(() => {
        setIsCourseModalOpen(false);
        setCourseForm({ code: '', name: '', departmentId: '', totalSemesters: 8, durationYears: 4 });
        onRefresh();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      await courseService.delete(id);
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to delete course');
    }
  };

  // Semester Handlers
  const handleCreateSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await semesterService.create(semForm);
      setSuccess('Semester created successfully!');
      setTimeout(() => {
        setIsSemModalOpen(false);
        setSemForm({ number: 1, academicYear: '2026-2027', isCurrent: true, courseId: '' });
        onRefresh();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create semester');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSemester = async (id: string) => {
    if (!confirm('Are you sure you want to delete this semester?')) return;
    try {
      await semesterService.delete(id);
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to delete semester');
    }
  };

  // Section Handlers
  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await sectionService.create(secForm);
      setSuccess('Section created successfully!');
      setTimeout(() => {
        setIsSecModalOpen(false);
        setSecForm({ name: '', courseId: '', semesterId: '', capacity: 60 });
        onRefresh();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create section');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;
    try {
      await sectionService.delete(id);
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to delete section');
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-2 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('departments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${activeSubTab === 'departments' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Layers className="w-4 h-4" /> Departments ({departments.length})
          </button>
          <button
            onClick={() => setActiveSubTab('courses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${activeSubTab === 'courses' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <BookOpen className="w-4 h-4" /> Courses ({courses.length})
          </button>
          <button
            onClick={() => setActiveSubTab('semesters')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${activeSubTab === 'semesters' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Calendar className="w-4 h-4" /> Semesters ({semesters.length})
          </button>
          <button
            onClick={() => setActiveSubTab('sections')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${activeSubTab === 'sections' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Grid className="w-4 h-4" /> Sections ({sections.length})
          </button>
        </div>

        {activeSubTab === 'departments' && (
          <button
            onClick={() => { setDeptForm({ code: '', name: '', description: '' }); setError(null); setSuccess(null); setIsDeptModalOpen(true); }}
            className="flex items-center gap-2 px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
          >
            <Plus className="w-4 h-4" /> Add Department
          </button>
        )}
        {activeSubTab === 'courses' && (
          <button
            onClick={() => { setCourseForm({ code: '', name: '', departmentId: departments[0]?.id || '', totalSemesters: 8, durationYears: 4 }); setError(null); setSuccess(null); setIsCourseModalOpen(true); }}
            className="flex items-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
          >
            <Plus className="w-4 h-4" /> Add Course
          </button>
        )}
        {activeSubTab === 'semesters' && (
          <button
            onClick={() => { setSemForm({ number: 1, academicYear: '2026-2027', isCurrent: true, courseId: courses[0]?.id || '' }); setError(null); setSuccess(null); setIsSemModalOpen(true); }}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
          >
            <Plus className="w-4 h-4" /> Add Semester
          </button>
        )}
        {activeSubTab === 'sections' && (
          <button
            onClick={() => { setSecForm({ name: '', courseId: courses[0]?.id || '', semesterId: semesters[0]?.id || '', capacity: 60 }); setError(null); setSuccess(null); setIsSecModalOpen(true); }}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
          >
            <Plus className="w-4 h-4" /> Add Section
          </button>
        )}
      </div>

      {/* Departments SubTab */}
      {activeSubTab === 'departments' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div key={dept.id} className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-400 font-mono font-bold text-xs">
                    {dept.code}
                  </span>
                  <button
                    onClick={() => handleDeleteDepartment(dept.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition"
                    title="Delete Department"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-base font-bold text-white mb-1">{dept.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{dept.description || 'No description provided.'}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Courses: <strong className="text-white">{dept._count?.courses ?? 0}</strong></span>
                <span>Faculty: <strong className="text-white">{dept._count?.teachers ?? 0}</strong></span>
                <span>Students: <strong className="text-white">{dept._count?.students ?? 0}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Courses SubTab */}
      {activeSubTab === 'courses' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <div key={course.id} className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 font-mono font-bold text-xs">
                    {course.code}
                  </span>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition"
                    title="Delete Course"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-base font-bold text-white mb-1">{course.name}</h3>
                <p className="text-xs text-brand-400 font-semibold">{course.department?.name || 'Department'}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Semesters: <strong className="text-white">{course.totalSemesters}</strong></span>
                <span>Duration: <strong className="text-white">{course.durationYears} Years</strong></span>
                <span>Subjects: <strong className="text-white">{course._count?.subjects ?? 0}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Semesters SubTab */}
      {activeSubTab === 'semesters' && (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <th className="py-4 px-6">Semester Number</th>
                <th className="py-4 px-4">Academic Year</th>
                <th className="py-4 px-4">Associated Course</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {semesters.map((sem) => (
                <tr key={sem.id} className="hover:bg-slate-900/40 transition">
                  <td className="py-4 px-6 font-bold text-white text-xs">
                    Semester {sem.number}
                  </td>
                  <td className="py-4 px-4 font-mono text-emerald-400 font-semibold">
                    {sem.academicYear}
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-200">
                    {sem.course?.name} ({sem.course?.code})
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${sem.isCurrent ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                      {sem.isCurrent ? 'Current Active' : 'Upcoming / Past'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleDeleteSemester(sem.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sections SubTab */}
      {activeSubTab === 'sections' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sections.map((sec) => (
            <div key={sec.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-white">{sec.name}</h3>
                  <button
                    onClick={() => handleDeleteSection(sec.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs font-semibold text-indigo-400">{sec.course?.code}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Academic Year: {sec.semester?.academicYear} (Sem {sec.semester?.number})</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Capacity: <strong className="text-white">{sec.capacity}</strong></span>
                <span>Enrolled: <strong className="text-emerald-400">{sec._count?.students ?? 0}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals for Create Operations */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Create Department</h3>
            {error && <div className="p-3 bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs rounded-xl">{error}</div>}
            {success && <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs rounded-xl">{success}</div>}
            <form onSubmit={handleCreateDepartment} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Code (e.g. CSE)</label>
                <input
                  type="text"
                  required
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white uppercase focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Description</label>
                <textarea
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setIsDeptModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-brand-600 text-white text-xs rounded-xl font-semibold">{loading ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Create Course</h3>
            {error && <div className="p-3 bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs rounded-xl">{error}</div>}
            {success && <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs rounded-xl">{success}</div>}
            <form onSubmit={handleCreateCourse} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Course Code (e.g. BTECH-CSE)</label>
                <input
                  type="text"
                  required
                  value={courseForm.code}
                  onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white uppercase focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Course Name</label>
                <input
                  type="text"
                  required
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Department</label>
                <select
                  required
                  value={courseForm.departmentId}
                  onChange={(e) => setCourseForm({ ...courseForm, departmentId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Total Semesters</label>
                  <input
                    type="number"
                    value={courseForm.totalSemesters}
                    onChange={(e) => setCourseForm({ ...courseForm, totalSemesters: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Duration (Years)</label>
                  <input
                    type="number"
                    value={courseForm.durationYears}
                    onChange={(e) => setCourseForm({ ...courseForm, durationYears: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setIsCourseModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 text-white text-xs rounded-xl font-semibold">{loading ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Create Semester</h3>
            {error && <div className="p-3 bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs rounded-xl">{error}</div>}
            {success && <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs rounded-xl">{success}</div>}
            <form onSubmit={handleCreateSemester} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Semester Number</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={semForm.number}
                  onChange={(e) => setSemForm({ ...semForm, number: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Academic Year</label>
                <input
                  type="text"
                  required
                  value={semForm.academicYear}
                  onChange={(e) => setSemForm({ ...semForm, academicYear: e.target.value })}
                  placeholder="2026-2027"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Course</label>
                <select
                  required
                  value={semForm.courseId}
                  onChange={(e) => setSemForm({ ...semForm, courseId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setIsSemModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-emerald-600 text-white text-xs rounded-xl font-semibold">{loading ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSecModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Create Section</h3>
            {error && <div className="p-3 bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs rounded-xl">{error}</div>}
            {success && <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs rounded-xl">{success}</div>}
            <form onSubmit={handleCreateSection} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Section Name (e.g. Section A)</label>
                <input
                  type="text"
                  required
                  value={secForm.name}
                  onChange={(e) => setSecForm({ ...secForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Course</label>
                <select
                  required
                  value={secForm.courseId}
                  onChange={(e) => setSecForm({ ...secForm, courseId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Semester</label>
                <select
                  required
                  value={secForm.semesterId}
                  onChange={(e) => setSecForm({ ...secForm, semesterId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                >
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>Sem {s.number} ({s.academicYear})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Capacity</label>
                <input
                  type="number"
                  value={secForm.capacity}
                  onChange={(e) => setSecForm({ ...secForm, capacity: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setIsSecModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white text-xs rounded-xl font-semibold">{loading ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicManagement;

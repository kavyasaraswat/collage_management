import React, { useEffect, useState } from 'react';
import { Search, Filter, Plus, Eye, Edit2, UserX, UserCheck, RefreshCw, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { studentService, Student } from '../../services/studentService';
import { Department } from '../../services/departmentService';
import { Course } from '../../services/courseService';
import { Semester } from '../../services/semesterService';
import { Section } from '../../services/sectionService';
import StudentDetailModal from './StudentDetailModal';

interface StudentManagementProps {
  departments: Department[];
  courses: Course[];
  semesters: Semester[];
  sections: Section[];
}

export const StudentManagement: React.FC<StudentManagementProps> = ({
  departments,
  courses,
  semesters,
  sections,
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deactivated'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'password123',
    studentId: '',
    phone: '',
    dob: '',
    gender: 'Male',
    address: '',
    departmentId: '',
    courseId: '',
    semesterId: '',
    sectionId: '',
    batch: new Date().getFullYear().toString(),
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await studentService.getAll({
        search: search || undefined,
        departmentId: selectedDept || undefined,
        courseId: selectedCourse || undefined,
        semesterId: selectedSemester || undefined,
        sectionId: selectedSection || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        limit: 15,
      });
      if (res.success) {
        setStudents(res.data);
        setTotalPages(res.pagination.totalPages);
        setTotalCount(res.pagination.total);
      }
    } catch (err) {
      console.error('Failed to fetch students', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, selectedDept, selectedCourse, selectedSemester, selectedSection, statusFilter, page]);

  const handleToggleStatus = async (id: string) => {
    try {
      await studentService.toggleStatus(id);
      fetchStudents();
      if (viewStudent && viewStudent.id === id) {
        const updated = await studentService.getById(id);
        if (updated.success) setViewStudent(updated.data);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to toggle student status');
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      email: '',
      password: 'password123',
      studentId: `STU-${Date.now().toString().slice(-4)}`,
      phone: '',
      dob: '',
      gender: 'Male',
      address: '',
      departmentId: departments[0]?.id || '',
      courseId: courses[0]?.id || '',
      semesterId: semesters[0]?.id || '',
      sectionId: sections[0]?.id || '',
      batch: new Date().getFullYear().toString(),
    });
    setFormError(null);
    setFormSuccess(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formData.name || !formData.email || !formData.studentId || !formData.departmentId || !formData.courseId || !formData.semesterId || !formData.sectionId) {
      setFormError('Please fill in all required fields (*)');
      return;
    }

    setSubmitting(true);
    try {
      const res = await studentService.create(formData);
      if (res.success) {
        setFormSuccess('Student registered successfully!');
        setTimeout(() => {
          setIsCreateModalOpen(false);
          fetchStudents();
        }, 1000);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Failed to register student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (student: Student) => {
    setEditStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      password: '',
      studentId: student.studentId,
      phone: student.phone || '',
      dob: student.dob || '',
      gender: student.gender || 'Male',
      address: student.address || '',
      departmentId: student.departmentId,
      courseId: student.courseId,
      semesterId: student.semesterId,
      sectionId: student.sectionId,
      batch: student.batch,
    });
    setFormError(null);
    setFormSuccess(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;
    setFormError(null);
    setFormSuccess(null);

    setSubmitting(true);
    try {
      const res = await studentService.update(editStudent.id, {
        name: formData.name,
        phone: formData.phone,
        dob: formData.dob,
        gender: formData.gender,
        address: formData.address,
        departmentId: formData.departmentId,
        courseId: formData.courseId,
        semesterId: formData.semesterId,
        sectionId: formData.sectionId,
        batch: formData.batch,
      });
      if (res.success) {
        setFormSuccess('Student profile updated!');
        setTimeout(() => {
          setEditStudent(null);
          fetchStudents();
        }, 1000);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Failed to update student');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by Name, Roll ID, Email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={fetchStudents}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 transition"
              title="Refresh list"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-brand-600/30 transition"
            >
              <Plus className="w-4 h-4" /> Register New Student
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-800/80">
          <div>
            <label className="block text-[10px] text-slate-400 font-medium mb-1">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => { setSelectedDept(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-medium mb-1">Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => { setSelectedCourse(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.code}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-medium mb-1">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => { setSelectedSemester(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
            >
              <option value="">All Semesters</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>Sem {s.number} ({s.academicYear})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-medium mb-1">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => { setSelectedSection(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
            >
              <option value="">All Sections</option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>{sec.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-medium mb-1">Account Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="deactivated">Deactivated Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <th className="py-4 px-6">Student Info</th>
                <th className="py-4 px-4">Roll ID</th>
                <th className="py-4 px-4">Department & Course</th>
                <th className="py-4 px-4">Sem & Section</th>
                <th className="py-4 px-4">Batch</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-500 mb-2" />
                    Loading student records...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No student records matching current filters.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const isDeactivated = student.user?.isDeactivated ?? false;
                  return (
                    <tr key={student.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600/30 to-indigo-500/30 border border-brand-500/30 flex items-center justify-center font-bold text-brand-300">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs">{student.name}</p>
                            <p className="text-[11px] text-slate-400">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono font-semibold text-brand-400">
                        {student.studentId}
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-semibold text-slate-200">{student.department?.code || 'N/A'}</p>
                        <p className="text-[10px] text-slate-400">{student.course?.code || 'N/A'}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium mr-1.5">
                          Sem {student.semester?.number || 'N/A'}
                        </span>
                        <span className="text-slate-400">{student.section?.name || 'N/A'}</span>
                      </td>
                      <td className="py-4 px-4 text-slate-300 font-mono">
                        {student.batch}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${isDeactivated ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                          {isDeactivated ? 'Deactivated' : 'Active'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => setViewStudent(student)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                          title="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(student)}
                          className="p-1.5 bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/50 rounded-lg transition"
                          title="Edit Profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(student.id)}
                          className={`p-1.5 rounded-lg border transition ${isDeactivated ? 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/50' : 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border-rose-800/50'}`}
                          title={isDeactivated ? 'Reactivate Student' : 'Deactivate Student'}
                        >
                          {isDeactivated ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/40 text-xs text-slate-400">
          <span>Showing total {totalCount} students</span>
          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-lg border border-slate-800 text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>Page {page} of {totalPages || 1}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-lg border border-slate-800 text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: View Student */}
      {viewStudent && (
        <StudentDetailModal
          student={viewStudent}
          onClose={() => setViewStudent(null)}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {/* Modal: Register/Edit Student */}
      {(isCreateModalOpen || editStudent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <h3 className="text-lg font-bold text-white">
                {editStudent ? `Edit Student: ${editStudent.name}` : 'Register New Student'}
              </h3>
              <button
                onClick={() => { setIsCreateModalOpen(false); setEditStudent(null); }}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 transition"
              >
                &times;
              </button>
            </div>

            <form onSubmit={editStudent ? handleEditSubmit : handleCreateSubmit} className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Roll ID / Student ID *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editStudent}
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    disabled={!!editStudent}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:opacity-50"
                  />
                </div>

                {!editStudent && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Password *</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Department *</label>
                  <select
                    required
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Course *</label>
                  <select
                    required
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Semester *</label>
                  <select
                    required
                    value={formData.semesterId}
                    onChange={(e) => setFormData({ ...formData, semesterId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    {semesters.map((s) => (
                      <option key={s.id} value={s.id}>Sem {s.number} ({s.academicYear})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Section *</label>
                  <select
                    required
                    value={formData.sectionId}
                    onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>{sec.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Address</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="p-4 border-t border-slate-800 flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setIsCreateModalOpen(false); setEditStudent(null); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-brand-600/30 transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editStudent ? 'Update Profile' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;

import React, { useEffect, useState } from 'react';
import { Search, Plus, BookOpen, Edit2, UserX, UserCheck, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { teacherService, Teacher } from '../../services/teacherService';
import { Department } from '../../services/departmentService';
import { Subject } from '../../services/subjectService';
import { Section } from '../../services/sectionService';
import TeacherAssignmentModal from './TeacherAssignmentModal';

interface TeacherManagementProps {
  departments: Department[];
  subjects: Subject[];
  sections: Section[];
}

export const TeacherManagement: React.FC<TeacherManagementProps> = ({
  departments,
  subjects,
  sections,
}) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  // Modals
  const [assignmentTeacher, setAssignmentTeacher] = useState<Teacher | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'password123',
    teacherId: '',
    phone: '',
    departmentId: '',
    designation: 'Assistant Professor',
    joiningDate: new Date().toISOString().split('T')[0],
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await teacherService.getAll({
        search: search || undefined,
        departmentId: selectedDept || undefined,
      });
      if (res.success) {
        setTeachers(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch teachers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [search, selectedDept]);

  const handleToggleStatus = async (id: string) => {
    try {
      await teacherService.toggleStatus(id);
      fetchTeachers();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle teacher status');
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      email: '',
      password: 'password123',
      teacherId: `TCH-${Date.now().toString().slice(-4)}`,
      phone: '',
      departmentId: departments[0]?.id || '',
      designation: 'Assistant Professor',
      joiningDate: new Date().toISOString().split('T')[0],
    });
    setFormError(null);
    setFormSuccess(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formData.name || !formData.email || !formData.teacherId || !formData.departmentId) {
      setFormError('Please fill in all required fields (*)');
      return;
    }

    setSubmitting(true);
    try {
      const res = await teacherService.create(formData);
      if (res.success) {
        setFormSuccess('Faculty account created successfully!');
        setTimeout(() => {
          setIsCreateModalOpen(false);
          fetchTeachers();
        }, 1000);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Failed to create teacher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (teacher: Teacher) => {
    setEditTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      password: '',
      teacherId: teacher.teacherId,
      phone: teacher.phone || '',
      departmentId: teacher.departmentId,
      designation: teacher.designation,
      joiningDate: teacher.joiningDate || '',
    });
    setFormError(null);
    setFormSuccess(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTeacher) return;
    setFormError(null);
    setFormSuccess(null);

    setSubmitting(true);
    try {
      const res = await teacherService.update(editTeacher.id, {
        name: formData.name,
        phone: formData.phone,
        departmentId: formData.departmentId,
        designation: formData.designation,
        joiningDate: formData.joiningDate,
      });
      if (res.success) {
        setFormSuccess('Teacher profile updated!');
        setTimeout(() => {
          setEditTeacher(null);
          fetchTeachers();
        }, 1000);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Failed to update teacher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignSubject = async (data: { subjectId: string; sectionId: string; academicYear: string }) => {
    if (!assignmentTeacher) return;
    await teacherService.assignSubject(assignmentTeacher.id, data);
    fetchTeachers();
    const updated = await teacherService.getById(assignmentTeacher.id);
    if (updated.success) setAssignmentTeacher(updated.data);
  };

  const handleUnassignSubject = async (assignmentId: string) => {
    if (!assignmentTeacher) return;
    await teacherService.unassignSubject(assignmentTeacher.id, assignmentId);
    fetchTeachers();
    const updated = await teacherService.getById(assignmentTeacher.id);
    if (updated.success) setAssignmentTeacher(updated.data);
  };

  return (
    <div className="space-y-6">
      {/* Search & Action Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search Name, Employee ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full sm:w-56 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={fetchTeachers}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/30 transition"
          >
            <Plus className="w-4 h-4" /> Add Faculty Member
          </button>
        </div>
      </div>

      {/* Faculty Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <th className="py-4 px-6">Faculty Member</th>
                <th className="py-4 px-4">Employee ID</th>
                <th className="py-4 px-4">Department</th>
                <th className="py-4 px-4">Designation</th>
                <th className="py-4 px-4">Assigned Subjects</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
                    Loading faculty records...
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No faculty members found.
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => {
                  const isDeactivated = teacher.user?.isDeactivated ?? false;
                  return (
                    <tr key={teacher.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600/30 to-brand-500/30 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-300">
                            {teacher.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs">{teacher.name}</p>
                            <p className="text-[11px] text-slate-400">{teacher.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono font-semibold text-emerald-400">
                        {teacher.teacherId}
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-200">
                        {teacher.department?.code || 'N/A'}
                      </td>
                      <td className="py-4 px-4 text-slate-300">
                        {teacher.designation}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {teacher.teacherSubjects && teacher.teacherSubjects.length > 0 ? (
                            teacher.teacherSubjects.map((ts) => (
                              <span key={ts.id} className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/50 text-indigo-300 text-[10px] font-mono">
                                {ts.subject?.code} ({ts.section?.name})
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500 text-[11px]">Unassigned</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${isDeactivated ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                          {isDeactivated ? 'Deactivated' : 'Active'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => setAssignmentTeacher(teacher)}
                          className="px-2.5 py-1.5 bg-brand-950/60 hover:bg-brand-900/60 text-brand-300 border border-brand-800/50 rounded-lg text-[11px] font-semibold transition"
                          title="Manage Course Allocations"
                        >
                          <BookOpen className="w-3.5 h-3.5 inline mr-1" /> Allocations
                        </button>
                        <button
                          onClick={() => handleOpenEdit(teacher)}
                          className="p-1.5 bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/50 rounded-lg transition"
                          title="Edit Profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(teacher.id)}
                          className={`p-1.5 rounded-lg border transition ${isDeactivated ? 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/50' : 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border-rose-800/50'}`}
                          title={isDeactivated ? 'Reactivate Teacher' : 'Deactivate Teacher'}
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
      </div>

      {/* Modal: Subject Allocations */}
      {assignmentTeacher && (
        <TeacherAssignmentModal
          teacher={assignmentTeacher}
          subjects={subjects}
          sections={sections}
          onClose={() => setAssignmentTeacher(null)}
          onAssign={handleAssignSubject}
          onUnassign={handleUnassignSubject}
        />
      )}

      {/* Modal: Create/Edit Teacher */}
      {(isCreateModalOpen || editTeacher) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative flex flex-col">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <h3 className="text-lg font-bold text-white">
                {editTeacher ? `Edit Faculty: ${editTeacher.name}` : 'Register Faculty Member'}
              </h3>
              <button
                onClick={() => { setIsCreateModalOpen(false); setEditTeacher(null); }}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 transition"
              >
                &times;
              </button>
            </div>

            <form onSubmit={editTeacher ? handleEditSubmit : handleCreateSubmit} className="p-6 space-y-4">
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
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editTeacher}
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    disabled={!!editTeacher}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-50"
                  />
                </div>

                {!editTeacher && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Password *</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Department *</label>
                  <select
                    required
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="Assistant Professor"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-800 flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setIsCreateModalOpen(false); setEditTeacher(null); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editTeacher ? 'Update Faculty' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManagement;

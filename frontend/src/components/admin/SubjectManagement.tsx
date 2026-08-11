import React, { useState } from 'react';
import { BookOpen, Plus, Trash2, Edit2, AlertCircle, CheckCircle2, Award, FileCode } from 'lucide-react';
import { subjectService, Subject } from '../../services/subjectService';
import { Course } from '../../services/courseService';

interface SubjectManagementProps {
  subjects: Subject[];
  courses: Course[];
  onRefresh: () => void;
}

export const SubjectManagement: React.FC<SubjectManagementProps> = ({
  subjects,
  courses,
  onRefresh,
}) => {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    courseId: courses[0]?.id || '',
    semesterNumber: 1,
    credits: 4,
    isPractical: false,
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredSubjects = selectedCourse
    ? subjects.filter((s) => s.courseId === selectedCourse)
    : subjects;

  const handleOpenCreate = () => {
    setEditSubject(null);
    setFormData({
      code: '',
      name: '',
      courseId: courses[0]?.id || '',
      semesterNumber: 1,
      credits: 4,
      isPractical: false,
    });
    setError(null);
    setSuccess(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (subject: Subject) => {
    setEditSubject(subject);
    setFormData({
      code: subject.code,
      name: subject.name,
      courseId: subject.courseId,
      semesterNumber: subject.semesterNumber,
      credits: subject.credits,
      isPractical: subject.isPractical,
    });
    setError(null);
    setSuccess(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      if (editSubject) {
        await subjectService.update(editSubject.id, formData);
        setSuccess('Subject updated successfully!');
      } else {
        await subjectService.create(formData);
        setSuccess('Subject created successfully!');
      }
      setTimeout(() => {
        setIsModalOpen(false);
        onRefresh();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;
    try {
      await subjectService.delete(id);
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to delete subject');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Filter Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <label className="text-xs font-medium text-slate-300">Filter by Course:</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-600/30 transition"
        >
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubjects.map((subj) => (
          <div key={subj.id} className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs">
                  {subj.code}
                </span>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEdit(subj)}
                    className="p-1.5 text-slate-400 hover:text-indigo-400 transition"
                    title="Edit Subject"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(subj.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 transition"
                    title="Delete Subject"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-base font-bold text-white mb-1">{subj.name}</h3>
              <p className="text-xs text-brand-400 font-medium">{subj.course?.name || 'Course'}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                Sem {subj.semesterNumber}
              </span>

              <span>Credits: <strong className="text-white">{subj.credits}</strong></span>

              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${subj.isPractical ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'}`}>
                {subj.isPractical ? 'Practical Lab' : 'Theory'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Create/Edit Subject */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">
              {editSubject ? `Edit Subject: ${editSubject.code}` : 'Add New Subject'}
            </h3>

            {error && <div className="p-3 bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs rounded-xl flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
            {success && <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs rounded-xl flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" />{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Subject Code *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="CS101"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white uppercase focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Data Structures & Algorithms"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Course *</label>
                <select
                  required
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Semester Number *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.semesterNumber}
                    onChange={(e) => setFormData({ ...formData, semesterNumber: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Credits</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isPractical"
                  checked={formData.isPractical}
                  onChange={(e) => setFormData({ ...formData, isPractical: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="isPractical" className="text-xs text-slate-300 font-medium">Is Practical / Laboratory Subject</label>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs rounded-xl font-semibold shadow-lg shadow-amber-600/30 transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editSubject ? 'Update Subject' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectManagement;

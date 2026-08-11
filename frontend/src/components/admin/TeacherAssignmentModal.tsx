import React, { useState } from 'react';
import { X, BookOpen, Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import { Teacher } from '../../services/teacherService';
import { Subject } from '../../services/subjectService';
import { Section } from '../../services/sectionService';

interface TeacherAssignmentModalProps {
  teacher: Teacher | null;
  subjects: Subject[];
  sections: Section[];
  onClose: () => void;
  onAssign: (data: { subjectId: string; sectionId: string; academicYear: string }) => Promise<void>;
  onUnassign: (assignmentId: string) => Promise<void>;
}

export const TeacherAssignmentModal: React.FC<TeacherAssignmentModalProps> = ({
  teacher,
  subjects,
  sections,
  onClose,
  onAssign,
  onUnassign,
}) => {
  const [subjectId, setSubjectId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!teacher) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !sectionId || !academicYear) {
      setError('Please select subject, section, and academic year');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onAssign({ subjectId, sectionId, academicYear });
      setSubjectId('');
      setSectionId('');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to assign subject');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div>
            <h3 className="text-xl font-bold text-white">Faculty Course Allocations</h3>
            <p className="text-xs text-slate-400 font-medium">Teacher: {teacher.name} ({teacher.teacherId})</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form to Assign */}
          <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
            <h4 className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Assign New Subject & Section</h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Select Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.code} - {sub.name} (Sem {sub.semesterNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Select Section</label>
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="">-- Select Section --</option>
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name} ({sec.course?.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Academic Year</label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="2026-2027"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50"
              >
                {loading ? 'Assigning...' : 'Assign Subject'}
              </button>
            </div>
          </form>

          {/* Current Assignments Table */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Current Active Assignments</h4>
            {teacher.teacherSubjects && teacher.teacherSubjects.length > 0 ? (
              <div className="space-y-2">
                {teacher.teacherSubjects.map((ts) => (
                  <div key={ts.id} className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{ts.subject?.name || 'Subject'} ({ts.subject?.code})</p>
                        <p className="text-[10px] text-slate-400">
                          Section: <span className="text-slate-200 font-medium">{ts.section?.name || 'N/A'}</span> | Year: {ts.academicYear}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onUnassign(ts.id)}
                      className="px-3 py-1 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-[10px] font-semibold border border-rose-800/50 rounded-lg transition"
                    >
                      Unassign
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-950/30 rounded-2xl border border-slate-800/50 text-slate-400 text-xs">
                No subjects assigned yet.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherAssignmentModal;

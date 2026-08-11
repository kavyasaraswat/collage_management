import React from 'react';
import { X, GraduationCap, Mail, Phone, Calendar, MapPin, Building, BookOpen, Layers, ShieldCheck, UserX, UserCheck } from 'lucide-react';
import { Student } from '../../services/studentService';

interface StudentDetailModalProps {
  student: Student | null;
  onClose: () => void;
  onToggleStatus: (id: string) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ student, onClose, onToggleStatus }) => {
  if (!student) return null;

  const isDeactivated = student.user?.isDeactivated ?? false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white font-bold text-lg">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold text-white">{student.name}</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isDeactivated ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                  {isDeactivated ? 'Deactivated' : 'Active'}
                </span>
              </div>
              <p className="text-xs text-brand-400 font-mono font-medium">Roll ID: {student.studentId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Academic Info */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Academic Placement</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase font-medium">Department</p>
                <p className="text-sm font-bold text-white mt-0.5">{student.department?.code || 'N/A'}</p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase font-medium">Course</p>
                <p className="text-sm font-bold text-white mt-0.5">{student.course?.code || 'N/A'}</p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase font-medium">Semester</p>
                <p className="text-sm font-bold text-white mt-0.5">Sem {student.semester?.number || 'N/A'}</p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase font-medium">Section & Batch</p>
                <p className="text-sm font-bold text-white mt-0.5">{student.section?.name || 'N/A'} ({student.batch})</p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contact & Demographics</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                <div className="overflow-hidden">
                  <p className="text-[10px] text-slate-400 uppercase font-medium">Email Address</p>
                  <p className="text-xs font-semibold text-slate-200 truncate">{student.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-medium">Phone Number</p>
                  <p className="text-xs font-semibold text-slate-200">{student.phone || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-medium">Date of Birth & Gender</p>
                  <p className="text-xs font-semibold text-slate-200">{student.dob || 'N/A'} {student.gender ? `(${student.gender})` : ''}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-medium">Admission Date</p>
                  <p className="text-xs font-semibold text-slate-200">{student.admissionDate || 'N/A'}</p>
                </div>
              </div>
            </div>

            {student.address && (
              <div className="mt-3 flex items-start space-x-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-medium">Residential Address</p>
                  <p className="text-xs font-semibold text-slate-200 leading-relaxed">{student.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-between bg-slate-950/50">
          <button
            onClick={() => onToggleStatus(student.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition ${isDeactivated ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/30' : 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border-rose-500/30'}`}
          >
            {isDeactivated ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
            <span>{isDeactivated ? 'Reactivate Account' : 'Deactivate Account'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailModal;

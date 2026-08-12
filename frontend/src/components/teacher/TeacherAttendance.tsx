import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Save,
  RefreshCw,
  AlertCircle,
  Search,
  Check,
  Zap,
} from 'lucide-react';
import { subjectService, Subject } from '../../services/subjectService';
import { sectionService, Section } from '../../services/sectionService';
import { studentService, Student } from '../../services/studentService';
import { attendanceService, AttendanceRecordInput } from '../../services/attendanceService';

export const TeacherAttendance: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [recordsMap, setRecordsMap] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'>>({});
  const [isExistingRecord, setIsExistingRecord] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initial load: Fetch available subjects & sections
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [subjRes, secRes] = await Promise.all([
          subjectService.getAll(),
          sectionService.getAll(),
        ]);
        if (subjRes.success && subjRes.data?.length > 0) {
          setSubjects(subjRes.data);
          setSelectedSubjectId(subjRes.data[0].id);
        }
        if (secRes.success && secRes.data?.length > 0) {
          setSections(secRes.data);
          setSelectedSectionId(secRes.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load initial attendance dropdown options', err);
      }
    };
    fetchOptions();
  }, []);

  // Load students and existing session attendance whenever subject, section, or date changes
  const loadClassSession = async () => {
    if (!selectedSectionId || !selectedSubjectId || !selectedDate) return;
    setLoading(true);
    setMessage(null);
    try {
      // 1. Fetch students in this section
      const studRes = await studentService.getAll({ sectionId: selectedSectionId, limit: 100 });
      const studentList: Student[] = studRes.success ? studRes.data : [];
      setStudents(studentList);

      // 2. Fetch existing attendance for this session if available
      const sessionRes = await attendanceService.getSessionAttendance(
        selectedSubjectId,
        selectedSectionId,
        selectedDate
      );

      const initialMap: Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'> = {};

      if (sessionRes.success && sessionRes.data?.length > 0) {
        setIsExistingRecord(true);
        sessionRes.data.forEach((item: any) => {
          initialMap[item.studentId] = item.status;
        });
        // Default missing students to PRESENT
        studentList.forEach((st) => {
          if (!initialMap[st.id]) initialMap[st.id] = 'PRESENT';
        });
      } else {
        setIsExistingRecord(false);
        // Default all to PRESENT
        studentList.forEach((st) => {
          initialMap[st.id] = 'PRESENT';
        });
      }

      setRecordsMap(initialMap);
    } catch (err) {
      console.error('Failed to load session attendance data', err);
      setMessage({ type: 'error', text: 'Error loading session students and attendance' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassSession();
  }, [selectedSubjectId, selectedSectionId, selectedDate]);

  const handleStatusChange = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    setRecordsMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const setAllStatus = (status: 'PRESENT' | 'ABSENT') => {
    const updated: Record<string, 'PRESENT' | 'ABSENT'> = {};
    students.forEach((st) => {
      updated[st.id] = status;
    });
    setRecordsMap(updated as any);
  };

  const handleSubmitAttendance = async () => {
    if (!selectedSubjectId || !selectedSectionId || !selectedDate) {
      setMessage({ type: 'error', text: 'Please select Subject, Section, and Date.' });
      return;
    }
    if (students.length === 0) {
      setMessage({ type: 'error', text: 'No students available in this section to mark.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const recordsPayload: AttendanceRecordInput[] = students.map((st) => ({
        studentId: st.id,
        status: recordsMap[st.id] || 'PRESENT',
      }));

      const res = await attendanceService.markAttendance({
        subjectId: selectedSubjectId,
        sectionId: selectedSectionId,
        date: selectedDate,
        records: recordsPayload,
      });

      if (res.success) {
        setIsExistingRecord(true);
        setMessage({
          type: 'success',
          text: `Attendance saved successfully for ${recordsPayload.length} student(s)!`,
        });
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to submit attendance' });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Error recording attendance. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Stats calculation
  const totalCount = students.length;
  const filteredStudents = students.filter(
    (st) =>
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = Object.values(recordsMap).filter((s) => s === 'PRESENT').length;
  const absentCount = Object.values(recordsMap).filter((s) => s === 'ABSENT').length;
  const lateCount = Object.values(recordsMap).filter((s) => s === 'LATE').length;
  const excusedCount = Object.values(recordsMap).filter((s) => s === 'EXCUSED').length;
  const presentPercentage = totalCount > 0 ? (((presentCount + lateCount) / totalCount) * 100).toFixed(1) : '100.0';

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs mb-1">
              <CheckSquare className="w-4 h-4" />
              <span>FACULTY ATTENDANCE MODULE</span>
            </div>
            <h2 className="text-2xl font-black text-white">Daily Class Attendance</h2>
            <p className="text-xs text-slate-400 mt-1">
              Select course details, date, and toggle attendance statuses for your class roster.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadClassSession}
              disabled={loading}
              className="p-3 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-2xl text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
              title="Refresh session data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleSubmitAttendance}
              disabled={submitting || loading || totalCount === 0}
              className="px-5 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-brand-500/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : isExistingRecord ? 'Update Attendance' : 'Save Attendance'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selector Filters & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Subject Select */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <label className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block mb-2">
            Subject Syllabus
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
          >
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.code} - {sub.name} (Sem {sub.semesterNumber})
              </option>
            ))}
          </select>
        </div>

        {/* Section Select */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <label className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block mb-2">
            Class Section
          </label>
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
          >
            {sections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.name} ({sec.course?.name || 'Course'})
              </option>
            ))}
          </select>
        </div>

        {/* Date Select */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <label className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block mb-2">
            Attendance Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
            />
            <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Alert Message Banner */}
      {message && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
          {isExistingRecord && message.type === 'success' && (
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              Session Updated
            </span>
          )}
        </div>
      )}

      {/* Summary KPI Strip & Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Enrolled</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-extrabold text-white mt-2">{totalCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-400">Present</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-extrabold text-emerald-400 mt-2">{presentCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-rose-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-rose-400">Absent</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xl font-extrabold text-rose-400 mt-2">{absentCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-amber-400">Late</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-extrabold text-amber-400 mt-2">{lateCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-indigo-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-indigo-400">Turnout %</span>
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xl font-extrabold text-indigo-400 mt-2">{presentPercentage}%</p>
        </div>
      </div>

      {/* Roster & Attendance Controls Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/40">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search student roll no or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setAllStatus('PRESENT')}
              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold transition"
            >
              Mark All Present
            </button>
            <button
              onClick={() => setAllStatus('ABSENT')}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold transition"
            >
              Mark All Absent
            </button>
          </div>
        </div>

        {/* Student Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/60">
                <th className="py-3.5 px-6">Roll No / ID</th>
                <th className="py-3.5 px-6">Student Name</th>
                <th className="py-3.5 px-6 text-center">Status Selection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-400 font-medium">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-400 mb-2" />
                    Loading class roster and attendance data...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-400">
                    No students found for this section.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const currentStatus = recordsMap[student.id] || 'PRESENT';

                  return (
                    <tr key={student.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3.5 px-6 font-mono text-brand-300 font-semibold">
                        {student.studentId}
                      </td>
                      <td className="py-3.5 px-6">
                        <p className="font-semibold text-white">{student.name}</p>
                        <p className="text-[10px] text-slate-400">{student.email}</p>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleStatusChange(student.id, 'PRESENT')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                              currentStatus === 'PRESENT'
                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Present</span>
                          </button>

                          <button
                            onClick={() => handleStatusChange(student.id, 'ABSENT')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                              currentStatus === 'ABSENT'
                                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Absent</span>
                          </button>

                          <button
                            onClick={() => handleStatusChange(student.id, 'LATE')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                              currentStatus === 'LATE'
                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Late</span>
                          </button>

                          <button
                            onClick={() => handleStatusChange(student.id, 'EXCUSED')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                              currentStatus === 'EXCUSED'
                                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                            }`}
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Excused</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherAttendance;

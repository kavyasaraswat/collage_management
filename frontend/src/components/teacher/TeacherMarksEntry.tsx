import React, { useState, useEffect } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  Save,
  RefreshCw,
  AlertCircle,
  Search,
  Check,
  Zap,
  TrendingUp,
  Percent,
  Sliders,
} from 'lucide-react';
import { subjectService, Subject } from '../../services/subjectService';
import { sectionService, Section } from '../../services/sectionService';
import { studentService, Student } from '../../services/studentService';
import { examService, Exam } from '../../services/examService';
import { marksService, BatchMarkRecordInput } from '../../services/marksService';

export const TeacherMarksEntry: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedExamId, setSelectedExamId] = useState<string>('');

  const [marksMap, setMarksMap] = useState<Record<string, number | ''>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initial load: Fetch subjects and sections
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
        console.error('Failed to load initial dropdown options', err);
      }
    };
    fetchOptions();
  }, []);

  // Fetch exams whenever selected subject changes
  useEffect(() => {
    if (!selectedSubjectId) return;
    const fetchExams = async () => {
      try {
        const res = await examService.getAll({ subjectId: selectedSubjectId });
        if (res.success && res.data?.length > 0) {
          setExams(res.data);
          setSelectedExamId(res.data[0].id);
        } else {
          setExams([]);
          setSelectedExamId('');
        }
      } catch (err) {
        console.error('Failed to fetch subject exams', err);
      }
    };
    fetchExams();
  }, [selectedSubjectId]);

  // Load students and existing marks whenever selected exam or section changes
  const loadExamMarksSession = async () => {
    if (!selectedSectionId || !selectedSubjectId || !selectedExamId) return;
    setLoading(true);
    setMessage(null);

    try {
      // 1. Fetch students in selected section
      const studRes = await studentService.getAll({ sectionId: selectedSectionId, limit: 100 });
      const studentList: Student[] = studRes.success ? studRes.data : [];
      setStudents(studentList);

      // 2. Fetch existing marks entered for this exam
      const marksRes = await marksService.getMarksForExam(selectedExamId);

      const initialMap: Record<string, number | ''> = {};

      if (marksRes.success && marksRes.data?.marks) {
        marksRes.data.marks.forEach((item: any) => {
          initialMap[item.studentId] = item.marksObtained;
        });
      }

      // Fill remaining students with empty string or 0
      studentList.forEach((st) => {
        if (initialMap[st.id] === undefined) {
          initialMap[st.id] = '';
        }
      });

      setMarksMap(initialMap);
    } catch (err) {
      console.error('Failed to load exam marks session', err);
      setMessage({ type: 'error', text: 'Error loading student roster or marks.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExamMarksSession();
  }, [selectedExamId, selectedSectionId]);

  const activeExam = exams.find((e) => e.id === selectedExamId);
  const maxMarks = activeExam?.maxMarks || 100;

  const handleMarkChange = (studentId: string, value: string) => {
    if (value === '') {
      setMarksMap((prev) => ({ ...prev, [studentId]: '' }));
      return;
    }

    const num = Number(value);
    if (isNaN(num)) return;
    if (num < 0) return;

    if (num > maxMarks) {
      setMessage({ type: 'error', text: `Marks cannot exceed max marks (${maxMarks}).` });
      return;
    }

    setMessage(null);
    setMarksMap((prev) => ({ ...prev, [studentId]: num }));
  };

  const handleSetAllMax = () => {
    const updated: Record<string, number> = {};
    students.forEach((st) => {
      updated[st.id] = maxMarks;
    });
    setMarksMap(updated);
  };

  const handleClearAll = () => {
    const updated: Record<string, ''> = {};
    students.forEach((st) => {
      updated[st.id] = '';
    });
    setMarksMap(updated);
  };

  const handleSubmitMarks = async () => {
    if (!selectedExamId || !selectedSubjectId || !selectedSectionId) {
      setMessage({ type: 'error', text: 'Please select Subject, Section, and Exam.' });
      return;
    }

    if (students.length === 0) {
      setMessage({ type: 'error', text: 'No students found in this section.' });
      return;
    }

    // Prepare records
    const recordsPayload: BatchMarkRecordInput[] = [];
    for (const st of students) {
      const val = marksMap[st.id];
      if (val === '' || val === undefined) {
        setMessage({
          type: 'error',
          text: `Please enter valid marks for ${st.name} before submitting.`,
        });
        return;
      }
      recordsPayload.push({
        studentId: st.id,
        marksObtained: Number(val),
      });
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await marksService.batchMarks({
        examId: selectedExamId,
        subjectId: selectedSubjectId,
        records: recordsPayload,
      });

      if (res.success) {
        setMessage({
          type: 'success',
          text: `Successfully saved marks for ${recordsPayload.length} student(s)!`,
        });
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to submit marks.' });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Error recording marks. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Stats calculation
  const filledValues = Object.values(marksMap).filter((v): v is number => typeof v === 'number');
  const classAvg =
    filledValues.length > 0
      ? (filledValues.reduce((a, b) => a + b, 0) / filledValues.length).toFixed(1)
      : '0.0';
  const highestMark = filledValues.length > 0 ? Math.max(...filledValues) : 0;
  const passCount = filledValues.filter((v) => (v / maxMarks) * 100 >= 40).length;
  const passRate = filledValues.length > 0 ? ((passCount / filledValues.length) * 100).toFixed(1) : '100.0';

  const filteredStudents = students.filter(
    (st) =>
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs mb-1">
              <Award className="w-4 h-4" />
              <span>FACULTY MARKS ENTRY WORKSPACE</span>
            </div>
            <h2 className="text-2xl font-black text-white">Student Examination Marks Entry</h2>
            <p className="text-xs text-slate-400 mt-1">
              Select subject, exam schedule, and section to evaluate student performance.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadExamMarksSession}
              disabled={loading}
              className="p-3 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-2xl text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleSubmitMarks}
              disabled={submitting || loading || students.length === 0 || !selectedExamId}
              className="px-5 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-brand-500/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Submitting...' : 'Submit Exam Marks'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Subject Select */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <label className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block mb-2">
            Subject
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
                {sec.name}
              </option>
            ))}
          </select>
        </div>

        {/* Exam Select */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <label className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block mb-2">
            Select Exam Schedule
          </label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
          >
            {exams.length === 0 ? (
              <option value="">No Exams Scheduled</option>
            ) : (
              exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.examType}) - Max Marks: {ex.maxMarks}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Alert Banner */}
      {message && (
        <div
          className={`p-4 rounded-2xl border flex items-center space-x-2 text-xs font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Class Average</span>
            <TrendingUp className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-xl font-extrabold text-white mt-2">
            {classAvg} <span className="text-xs text-slate-500 font-normal">/ {maxMarks}</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-400">Highest Mark</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-extrabold text-emerald-400 mt-2">
            {highestMark} <span className="text-xs text-slate-500 font-normal">/ {maxMarks}</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-indigo-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-indigo-400">Pass Rate %</span>
            <Percent className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xl font-extrabold text-indigo-400 mt-2">{passRate}%</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-amber-400">Max Score Limit</span>
            <Sliders className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-extrabold text-amber-400 mt-2">{maxMarks} Marks</p>
        </div>
      </div>

      {/* Roster & Marks Input Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
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
              onClick={handleSetAllMax}
              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold transition"
            >
              Fill All Max ({maxMarks})
            </button>
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold transition"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/60">
                <th className="py-3.5 px-6">Roll No / ID</th>
                <th className="py-3.5 px-6">Student Name</th>
                <th className="py-3.5 px-6 text-center">Marks Obtained (Out of {maxMarks})</th>
                <th className="py-3.5 px-6 text-center">Percentage &amp; Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-400 mb-2" />
                    Loading exam student roster...
                  </td>
                </tr>
              ) : !selectedExamId ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    No exam selected. Please schedule or select an exam first.
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    No students found for this section.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const val = marksMap[student.id];
                  const numVal = typeof val === 'number' ? val : 0;
                  const pct = typeof val === 'number' ? Number(((numVal / maxMarks) * 100).toFixed(1)) : 0;

                  return (
                    <tr key={student.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3.5 px-6 font-mono text-brand-300 font-semibold">
                        {student.studentId}
                      </td>
                      <td className="py-3.5 px-6">
                        <p className="font-semibold text-white">{student.name}</p>
                        <p className="text-[10px] text-slate-400">{student.email}</p>
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <div className="inline-flex items-center space-x-2">
                          <input
                            type="number"
                            min={0}
                            max={maxMarks}
                            step={0.5}
                            value={val}
                            onChange={(e) => handleMarkChange(student.id, e.target.value)}
                            placeholder="0"
                            className="w-24 bg-slate-900 border border-slate-700 text-white font-mono font-bold text-center rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                          />
                          <span className="text-xs text-slate-500 font-semibold">/ {maxMarks}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        {typeof val === 'number' ? (
                          <div className="inline-flex items-center space-x-2">
                            <span
                              className={`font-mono font-bold ${
                                pct >= 40 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {pct}%
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                pct >= 90
                                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                  : pct >= 75
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : pct >= 40
                                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {pct >= 90
                                ? 'Grade O'
                                : pct >= 80
                                ? 'Grade A+'
                                : pct >= 70
                                ? 'Grade A'
                                : pct >= 60
                                ? 'Grade B+'
                                : pct >= 50
                                ? 'Grade B'
                                : pct >= 40
                                ? 'Grade C'
                                : 'Grade F (Fail)'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Not Entered</span>
                        )}
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

export default TeacherMarksEntry;

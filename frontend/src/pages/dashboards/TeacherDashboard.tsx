import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  LogOut,
  BookOpen,
  Calendar,
  CheckSquare,
  Sparkles,
  LayoutDashboard,
  Award,
  Bell,
  FileText,
  Clock,
  RefreshCw,
} from 'lucide-react';
import TeacherAttendance from '../../components/teacher/TeacherAttendance';
import TeacherMarksEntry from '../../components/teacher/TeacherMarksEntry';
import timetableService, { TimetableSlot } from '../../services/timetableService';
import noticeService, { Notice } from '../../services/noticeService';
import NotificationCenterModal from '../../components/NotificationCenterModal';

export const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const teacher = user?.teacher;

  const [activeTab, setActiveTab] = useState<'attendance' | 'marks' | 'schedule' | 'notices' | 'overview'>('attendance');

  const [mySchedule, setMySchedule] = useState<TimetableSlot[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ttRes, nRes] = await Promise.all([
        timetableService.getMySchedule(),
        noticeService.getAll(),
      ]);

      if (ttRes.success) setMySchedule(ttRes.data);
      if (nRes.success) setNotices(nRes.data);
    } catch (err) {
      console.error('Failed to load faculty schedule & notices', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-8 relative overflow-hidden font-sans">
      {/* Background Lighting Blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 z-10 glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-brand-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Faculty Portal</h1>
            <p className="text-xs text-slate-400">AcademiaPro Enterprise ERP</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mark Attendance</span>
          </button>

          <button
            onClick={() => setActiveTab('marks')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'marks'
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Marks Entry</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>My Schedule</span>
          </button>

          <button
            onClick={() => setActiveTab('notices')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'notices'
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-brand-400" />
            <span>Notice Board</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Faculty Profile</span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowNotificationModal(true)}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-brand-400" />
          </button>

          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-white">{teacher?.name || user?.email}</p>
            <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {teacher?.designation || 'Faculty Member'}
            </span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-sm font-medium transition"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto w-full my-6 z-10 space-y-6">
        {activeTab === 'overview' ? (
          <div className="space-y-6">
            <div className="glass-panel p-8 rounded-3xl border border-slate-800">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400 mb-3">
                <Sparkles className="w-4 h-4" /> Phase 7 Timetable &amp; Notices Active
              </span>
              <h2 className="text-3xl font-extrabold text-white mb-2">Welcome, {teacher?.name || 'Faculty Member'}!</h2>
              <p className="text-slate-400 text-sm max-w-xl">
                Teacher ID <span className="font-mono text-slate-200">{teacher?.teacherId || 'TCH-101'}</span> in Department of{' '}
                <span className="text-slate-200">{teacher?.department?.name || 'Computer Science & Engineering'}</span>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-4">
                <div className="p-3 bg-brand-500/10 rounded-xl text-brand-400">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-medium">Assigned Subject</p>
                  <p className="text-lg font-bold text-white mt-1">Data Structures &amp; Algorithms</p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-4">
                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-medium">Grading Subsystem</p>
                  <p className="text-lg font-bold text-emerald-400 mt-1">Active &amp; Verified</p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-4">
                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-medium">Academic Session</p>
                  <p className="text-lg font-bold text-white mt-1">2026 - 2027</p>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'marks' ? (
          <TeacherMarksEntry />
        ) : activeTab === 'attendance' ? (
          <TeacherAttendance />
        ) : activeTab === 'schedule' ? (
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden space-y-4">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                <span>My Weekly Teaching Schedule</span>
              </h3>
              <button onClick={loadData} className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/60">
                    <th className="py-3.5 px-6">Day &amp; Time Window</th>
                    <th className="py-3.5 px-6">Subject Title</th>
                    <th className="py-3.5 px-6">Course &amp; Section</th>
                    <th className="py-3.5 px-6">Assigned Room</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {mySchedule.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">
                        No timetable slots scheduled for your faculty profile.
                      </td>
                    </tr>
                  ) : (
                    mySchedule.map((slot) => (
                      <tr key={slot.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3.5 px-6">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                            {slot.dayOfWeek}
                          </span>
                          <p className="font-mono font-extrabold text-white mt-1">
                            {slot.startTime} - {slot.endTime}
                          </p>
                        </td>
                        <td className="py-3.5 px-6">
                          <p className="font-bold text-white">{slot.subject?.name}</p>
                          <p className="text-[10px] font-mono text-brand-300">{slot.subject?.code}</p>
                        </td>
                        <td className="py-3.5 px-6">
                          <p className="font-semibold text-slate-200">{slot.course?.name}</p>
                          <p className="text-[10px] text-slate-400">
                            Sem {slot.semester?.number} &bull; {slot.section?.name}
                          </p>
                        </td>
                        <td className="py-3.5 px-6 font-mono text-emerald-400 font-bold">
                          {slot.roomId}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-400" />
              <span>Campus Bulletin Notices</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notices.length === 0 ? (
                <div className="glass-panel p-8 text-center text-slate-400 rounded-3xl border border-slate-800 col-span-2">
                  No active campus notices posted.
                </div>
              ) : (
                notices.map((n) => (
                  <div
                    key={n.id}
                    className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3 hover:border-slate-700 transition"
                  >
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      Target: {n.targetAudience}
                    </span>
                    <h4 className="text-base font-extrabold text-white mt-1.5">{n.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{n.content}</p>
                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span>Published: {n.publishDate}</span>
                      <span>By: {n.author?.email}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Notifications Modal */}
      {showNotificationModal && (
        <NotificationCenterModal onClose={() => setShowNotificationModal(false)} />
      )}

      <footer className="text-center text-xs text-slate-500 z-10 py-4">
        AcademiaPro College ERP &copy; 2026 | Faculty Portal
      </footer>
    </div>
  );
};

export default TeacherDashboard;

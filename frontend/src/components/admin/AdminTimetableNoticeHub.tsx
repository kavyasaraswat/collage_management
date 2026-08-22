import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Bell,
  Send,
  AlertTriangle,
  CheckCircle2,
  Users,
  Layers,
  BookOpen,
  RefreshCw,
  Search,
  Filter,
  FileText,
  Building,
  UserCheck,
} from 'lucide-react';
import timetableService, { TimetableSlot } from '../../services/timetableService';
import noticeService, { Notice } from '../../services/noticeService';
import notificationService from '../../services/notificationService';
import { Course } from '../../services/courseService';
import { Semester } from '../../services/semesterService';
import { Section } from '../../services/sectionService';
import { Subject } from '../../services/subjectService';
import { teacherService } from '../../services/teacherService';
import { departmentService, Department } from '../../services/departmentService';

interface AdminTimetableNoticeHubProps {
  courses: Course[];
  semesters: Semester[];
  sections: Section[];
  subjects: Subject[];
  departments: Department[];
}

export const AdminTimetableNoticeHub: React.FC<AdminTimetableNoticeHubProps> = ({
  courses,
  semesters,
  sections,
  subjects,
  departments,
}) => {
  const [activeTab, setActiveTab] = useState<'timetable' | 'notices' | 'broadcast'>('timetable');

  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Timetable Form State
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState<'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY'>('MONDAY');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [slotCourseId, setSlotCourseId] = useState('');
  const [slotSemesterId, setSlotSemesterId] = useState('');
  const [slotSectionId, setSlotSectionId] = useState('');
  const [slotSubjectId, setSlotSubjectId] = useState('');
  const [slotTeacherId, setSlotTeacherId] = useState('');
  const [slotRoomId, setSlotRoomId] = useState('Lab 301');

  // Timetable Filter State
  const [filterDay, setFilterDay] = useState<string>('');

  // Notice Form State
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeAudience, setNoticeAudience] = useState<'EVERYONE' | 'DEPARTMENT' | 'COURSE' | 'SEMESTER' | 'SECTION'>('EVERYONE');
  const [noticeDeptId, setNoticeDeptId] = useState('');
  const [noticeCourseId, setNoticeCourseId] = useState('');
  const [noticePublishDate, setNoticePublishDate] = useState('2026-08-22');

  // Broadcast Form State
  const [broadcastTargetRole, setBroadcastTargetRole] = useState<'EVERYONE' | 'ADMIN' | 'TEACHER' | 'STUDENT'>('EVERYONE');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'INFO' | 'WARNING' | 'SUCCESS' | 'ALERT'>('INFO');

  const loadData = async () => {
    setLoading(true);
    try {
      const [ttRes, nRes, tRes] = await Promise.all([
        timetableService.getAll(),
        noticeService.getAll(),
        teacherService.getAll(),
      ]);

      if (ttRes.success) setTimetableSlots(ttRes.data);
      if (nRes.success) setNotices(nRes.data);
      if (tRes.success) setTeachers(tRes.data);
    } catch (err) {
      console.error('Failed to load timetable and notice hub data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTimetableSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotCourseId || !slotSemesterId || !slotSectionId || !slotSubjectId || !slotTeacherId || !slotRoomId) {
      setMessage({ type: 'error', text: 'Please fill in all timetable slot details' });
      return;
    }

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await timetableService.create({
        dayOfWeek,
        startTime,
        endTime,
        courseId: slotCourseId,
        semesterId: slotSemesterId,
        sectionId: slotSectionId,
        subjectId: slotSubjectId,
        teacherId: slotTeacherId,
        roomId: slotRoomId,
      });

      if (res.success) {
        setMessage({ type: 'success', text: 'Timetable entry created with 0 conflicts!' });
        setShowSlotModal(false);
        loadData();
      } else {
        setMessage({ type: 'error', text: res.message || 'Schedule conflict detected' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Schedule conflict detected' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!window.confirm('Delete this timetable slot?')) return;
    try {
      const res = await timetableService.delete(id);
      if (res.success) {
        setMessage({ type: 'success', text: 'Timetable entry deleted' });
        loadData();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete slot' });
    }
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle || !noticeContent) {
      setMessage({ type: 'error', text: 'Notice title and content are required' });
      return;
    }

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await noticeService.create({
        title: noticeTitle,
        content: noticeContent,
        targetAudience: noticeAudience,
        departmentId: noticeDeptId || undefined,
        courseId: noticeCourseId || undefined,
        publishDate: noticePublishDate,
      });

      if (res.success) {
        setMessage({ type: 'success', text: 'Campus Notice published successfully!' });
        setShowNoticeModal(false);
        setNoticeTitle('');
        setNoticeContent('');
        loadData();
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to publish notice' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error publishing notice' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!window.confirm('Delete this notice?')) return;
    try {
      const res = await noticeService.delete(id);
      if (res.success) {
        setMessage({ type: 'success', text: 'Notice deleted' });
        loadData();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete notice' });
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) {
      setMessage({ type: 'error', text: 'Title and message are required' });
      return;
    }

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await notificationService.sendNotification({
        targetRole: broadcastTargetRole,
        title: broadcastTitle,
        message: broadcastMessage,
        type: broadcastType,
      });

      if (res.success) {
        setMessage({ type: 'success', text: res.message });
        setBroadcastTitle('');
        setBroadcastMessage('');
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to send broadcast' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error sending broadcast' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredSlots = timetableSlots.filter(
    (slot) => !filterDay || slot.dayOfWeek === filterDay
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Controls */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Timetable, Notices &amp; Communications Hub</h2>
            <p className="text-xs text-slate-400">Class schedule engine, conflict alerts, and campus announcements</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('timetable')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'timetable'
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Timetable Schedule ({timetableSlots.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notices')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'notices'
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Campus Notices ({notices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'broadcast'
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Send Broadcast</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {message && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* Tab 1: Timetable Builder & Conflict Engine */}
      {activeTab === 'timetable' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <select
                value={filterDay}
                onChange={(e) => setFilterDay(e.target.value)}
                className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
              >
                <option value="">All Days of Week</option>
                <option value="MONDAY">Monday</option>
                <option value="TUESDAY">Tuesday</option>
                <option value="WEDNESDAY">Wednesday</option>
                <option value="THURSDAY">Thursday</option>
                <option value="FRIDAY">Friday</option>
                <option value="SATURDAY">Saturday</option>
              </select>

              <button
                onClick={loadData}
                className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <button
              onClick={() => setShowSlotModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:shadow-lg transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Timetable Slot</span>
            </button>
          </div>

          {/* Slots Table */}
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/60">
                    <th className="py-3.5 px-6">Day &amp; Time Window</th>
                    <th className="py-3.5 px-6">Subject &amp; Code</th>
                    <th className="py-3.5 px-6">Faculty Member</th>
                    <th className="py-3.5 px-6">Course, Sem &amp; Section</th>
                    <th className="py-3.5 px-6">Room / Venue</th>
                    <th className="py-3.5 px-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-400 mb-2" />
                        Loading timetable slots...
                      </td>
                    </tr>
                  ) : filteredSlots.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No timetable slots configured matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredSlots.map((slot) => (
                      <tr key={slot.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3.5 px-6">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-brand-500/20 text-brand-400 border border-brand-500/30">
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
                        <td className="py-3.5 px-6 text-slate-300 font-medium">
                          {slot.teacher?.name}
                        </td>
                        <td className="py-3.5 px-6">
                          <p className="font-semibold text-slate-200">{slot.course?.code}</p>
                          <p className="text-[10px] text-slate-400">
                            Sem {slot.semester?.number} &bull; {slot.section?.name}
                          </p>
                        </td>
                        <td className="py-3.5 px-6 font-mono text-emerald-400 font-bold">
                          {slot.roomId}
                        </td>
                        <td className="py-3.5 px-6 text-center">
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Campus Notices Bulletin */}
      {activeTab === 'notices' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Campus Bulletin Announcements</h3>
            <button
              onClick={() => setShowNoticeModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:shadow-lg transition"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Notice</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notices.map((n) => (
              <div
                key={n.id}
                className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      Target: {n.targetAudience}
                    </span>
                    <h4 className="text-base font-extrabold text-white mt-1.5">{n.title}</h4>
                  </div>
                  <button
                    onClick={() => handleDeleteNotice(n.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{n.content}</p>

                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                  <span>Published: {n.publishDate}</span>
                  <span>Author: {n.author?.email}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Send In-App Broadcast Notification */}
      {activeTab === 'broadcast' && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 max-w-xl mx-auto space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
            <Bell className="w-6 h-6 text-brand-400" />
            <div>
              <h3 className="text-lg font-bold text-white">System Broadcast Dispatcher</h3>
              <p className="text-xs text-slate-400">Send real-time in-app notification alerts to user roles</p>
            </div>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Target Audience Role</label>
              <select
                value={broadcastTargetRole}
                onChange={(e) => setBroadcastTargetRole(e.target.value as any)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none"
              >
                <option value="EVERYONE">All Campus Users (Students + Faculty + Admins)</option>
                <option value="STUDENT">All Enrolled Students Only</option>
                <option value="TEACHER">All Faculty Members Only</option>
                <option value="ADMIN">System Administrators Only</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Alert Type</label>
                <select
                  value={broadcastType}
                  onChange={(e) => setBroadcastType(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="INFO">Info (Blue)</option>
                  <option value="WARNING">Warning (Amber)</option>
                  <option value="SUCCESS">Success (Green)</option>
                  <option value="ALERT">Emergency Alert (Red)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Notification Title</label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Mid-Sem Exam Timetable Released"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Message Body</label>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                rows={4}
                placeholder="Type in-app notification alert details..."
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-600/20 hover:opacity-95 transition flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Dispatch System Broadcast</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Modal: Create Timetable Slot */}
      {showSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-400" />
                <span>Add Timetable Slot</span>
              </h3>
              <button onClick={() => setShowSlotModal(false)} className="text-slate-400 hover:text-white">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateTimetableSlot} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Day</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="MONDAY">Mon</option>
                    <option value="TUESDAY">Tue</option>
                    <option value="WEDNESDAY">Wed</option>
                    <option value="THURSDAY">Thu</option>
                    <option value="FRIDAY">Fri</option>
                    <option value="SATURDAY">Sat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Start Time</label>
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="09:00"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">End Time</label>
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="10:00"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Course</label>
                  <select
                    value={slotCourseId}
                    onChange={(e) => setSlotCourseId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    required
                  >
                    <option value="">-- Select --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Semester</label>
                  <select
                    value={slotSemesterId}
                    onChange={(e) => setSlotSemesterId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    required
                  >
                    <option value="">-- Select --</option>
                    {semesters.map((s) => (
                      <option key={s.id} value={s.id}>
                        Sem {s.number}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Section</label>
                  <select
                    value={slotSectionId}
                    onChange={(e) => setSlotSectionId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    required
                  >
                    <option value="">-- Select --</option>
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Subject</label>
                  <select
                    value={slotSubjectId}
                    onChange={(e) => setSlotSubjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    required
                  >
                    <option value="">-- Select --</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Faculty Member</label>
                  <select
                    value={slotTeacherId}
                    onChange={(e) => setSlotTeacherId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    required
                  >
                    <option value="">-- Select --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Room / Venue</label>
                  <input
                    type="text"
                    value={slotRoomId}
                    onChange={(e) => setSlotRoomId(e.target.value)}
                    placeholder="Lab 301 / Hall A"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-brand-500/10 border border-brand-500/30 rounded-xl text-[11px] text-slate-400">
                <span className="font-bold text-brand-400">Conflict Engine Active:</span> Checks teacher, section, and room availability automatically before saving.
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSlotModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-500"
                >
                  {actionLoading ? 'Validating...' : 'Save Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Publish Notice */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-400" />
                <span>Publish Campus Notice</span>
              </h3>
              <button onClick={() => setShowNoticeModal(false)} className="text-slate-400 hover:text-white">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Notice Title</label>
                <input
                  type="text"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="e.g. End Semester Exam Schedule & Rules"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Target Audience</label>
                <select
                  value={noticeAudience}
                  onChange={(e) => setNoticeAudience(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="EVERYONE">Everyone (All Campus)</option>
                  <option value="DEPARTMENT">Specific Department</option>
                  <option value="COURSE">Specific Course</option>
                </select>
              </div>

              {noticeAudience === 'DEPARTMENT' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Department</label>
                  <select
                    value={noticeDeptId}
                    onChange={(e) => setNoticeDeptId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="">-- Choose Department --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {noticeAudience === 'COURSE' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Course</label>
                  <select
                    value={noticeCourseId}
                    onChange={(e) => setNoticeCourseId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="">-- Choose Course --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Notice Content</label>
                <textarea
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  rows={4}
                  placeholder="Type bulletin text..."
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-500"
                >
                  {actionLoading ? 'Publishing...' : 'Publish Bulletin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTimetableNoticeHub;

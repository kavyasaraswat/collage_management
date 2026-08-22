import React, { useEffect, useState } from 'react';
import { Bell, X, CheckCheck, Info, AlertTriangle, CheckCircle2, ShieldAlert, RefreshCw } from 'lucide-react';
import notificationService, { NotificationItem } from '../services/notificationService';

interface NotificationCenterModalProps {
  onClose: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({ onClose }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getAll();
      if (res.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkSingleRead = async (id: string) => {
    try {
      const res = await notificationService.markAsRead(id);
      if (res.success) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await notificationService.markAllAsRead();
      if (res.success) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'ALERT':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <Info className="w-4 h-4 text-brand-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/60 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-brand-400" />
            <h3 className="text-sm font-bold text-white">Notifications Center</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-brand-500 text-white text-[10px] font-black">
                {unreadCount} New
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-bold transition"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mark All Read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 border border-slate-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notification Feed */}
        <div className="p-4 max-h-[420px] overflow-y-auto space-y-3">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-brand-400 mb-2" />
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No notifications in your inbox.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && handleMarkSingleRead(n.id)}
                className={`p-4 rounded-2xl border transition cursor-pointer ${
                  n.isRead
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-75'
                    : 'bg-slate-900 border-brand-500/30 shadow-md shadow-brand-500/5'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(n.type)}
                    <h4 className="text-xs font-bold text-white">{n.title}</h4>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{n.message}</p>
                {!n.isRead && (
                  <div className="mt-2 text-right">
                    <span className="inline-block text-[9px] font-bold text-brand-400">Click to mark as read</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenterModal;

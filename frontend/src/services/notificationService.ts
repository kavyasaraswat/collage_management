import api from './api';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ALERT';
  isRead: boolean;
  createdAt: string;
}

export interface NotificationFeedResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

export const notificationService = {
  getAll: async () => {
    const res = await api.get<{ success: boolean; data: NotificationFeedResponse }>('/notifications');
    return res.data;
  },

  markAsRead: async (id: string) => {
    const res = await api.put<{ success: boolean; message: string; data: NotificationItem }>(
      `/notifications/${id}/read`
    );
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await api.put<{ success: boolean; message: string }>('/notifications/read-all');
    return res.data;
  },

  sendNotification: async (data: {
    targetUserId?: string;
    targetRole?: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'EVERYONE';
    title: string;
    message: string;
    type?: 'INFO' | 'WARNING' | 'SUCCESS' | 'ALERT';
  }) => {
    const res = await api.post<{ success: boolean; message: string; count: number }>('/notifications', data);
    return res.data;
  },
};

export default notificationService;

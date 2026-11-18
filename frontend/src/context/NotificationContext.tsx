import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NotificationItem } from '../types';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { useAuth } from './AuthContext';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'emergency';
  title: string;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { ...toast, id, duration: toast.duration ?? 5000 };
    setToasts((prev) => [...prev, newToast]);

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications);
      setUnreadCount(res.unread_count);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    refreshNotifications();

    const socket = socketService.connect();
    if (!socket) return;

    // Real-time Event: New Emergency Request (for Hospital / Admin)
    const handleNewRequest = (data: any) => {
      addToast({
        type: 'emergency',
        title: `🚨 Emergency Alert: ${data.emergency_level || 'CRITICAL'}`,
        message: `Ambulance ${data.ambulance_id} requesting transfer for patient (${data.patient_age} yrs).`,
        duration: 9000,
      });
      refreshNotifications();
    };

    // Real-time Event: Request Decision (for Ambulance)
    const handleDecision = (data: any) => {
      const isAccepted = data.status === 'ACCEPTED';
      addToast({
        type: isAccepted ? 'success' : 'warning',
        title: `Request ${data.status}`,
        message: `${data.hospital_name} has ${data.status.toLowerCase()} your emergency transfer request.`,
        duration: 7000,
      });
      refreshNotifications();
    };

    // Real-time Event: Journey Status Changed
    const handleJourneyStatus = (data: any) => {
      addToast({
        type: 'info',
        title: `Journey ${data.status}`,
        message: `Ambulance ${data.ambulance_id} status updated to ${data.status}.`,
        duration: 5000,
      });
      refreshNotifications();
    };

    // Real-time Event: Bed Availability Updated
    const handleBedUpdate = (data: any) => {
      // Background cache sync
      window.dispatchEvent(new CustomEvent('medtrack_beds_updated', { detail: data }));
    };

    socket.on('new_emergency_request', handleNewRequest);
    socket.on('request_decision', handleDecision);
    socket.on('journey_status_changed', handleJourneyStatus);
    socket.on('bed_availability_updated', handleBedUpdate);

    return () => {
      socket.off('new_emergency_request', handleNewRequest);
      socket.off('request_decision', handleDecision);
      socket.off('journey_status_changed', handleJourneyStatus);
      socket.off('bed_availability_updated', handleBedUpdate);
    };
  }, [isAuthenticated, user?.user_id, addToast, refreshNotifications]);

  const markAsRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        addToast,
        removeToast,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

import React, { useEffect, useState } from 'react';
import { Bell, X, CheckCircle2, AlertCircle, Calendar, Clock } from 'lucide-react';
import api from '../services/api';

interface NotificationItem {
  id: string;
  recipient_phone: string;
  title: string;
  message: string;
  category: string;
  booking_ref?: string;
  status: string;
  timestamp: string;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      api.get('/notifications').then((res) => {
        setNotifications(res.data);
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Live Dispatched Notifications</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="p-3.5 overflow-y-auto flex-1 space-y-2.5">
          {notifications.length > 0 ? (
            notifications.map((n) => {
              const isExpired = n.category === 'TOKEN_EXPIRED';
              const isCheckin = n.category === 'CHECKIN_CONFIRMATION';
              const isDelay = n.category === 'DOCTOR_DELAY_UPDATE' || n.title.includes('Delay');

              return (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl border text-xs transition-all ${
                    isDelay
                      ? 'bg-amber-50/80 border-amber-300 text-amber-950 shadow-xs'
                      : isExpired
                      ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                      : isCheckin
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      {isDelay ? (
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                      ) : isExpired ? (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      ) : isCheckin ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      )}
                      <span>{n.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-normal">{n.message}</p>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
                    <span>To: {n.recipient_phone}</span>
                    <span className="px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-600">
                      SMS Delivered
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              No notifications dispatched yet. Book a token or trigger auto-expiry to see live SMS alerts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

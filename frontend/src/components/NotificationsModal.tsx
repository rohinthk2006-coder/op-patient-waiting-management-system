import React, { useEffect, useState } from 'react';
import { Bell, X, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-white">Live Dispatched Notifications</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {notifications.length > 0 ? (
            notifications.map((n) => {
              const isExpired = n.category === 'TOKEN_EXPIRED';
              const isCheckin = n.category === 'CHECKIN_CONFIRMATION';

              return (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-2xl border text-xs ${
                    isExpired
                      ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                      : isCheckin
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      {isExpired ? (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                      ) : isCheckin ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      )}
                      <span>{n.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{n.message}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>To: {n.recipient_phone}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                      SMS / Push Delivered
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs">
              No notifications dispatched yet. Book a token or trigger auto-expiry to see live SMS alerts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

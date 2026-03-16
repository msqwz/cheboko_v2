import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Filter, Mail, AlertTriangle, Clock, UserPlus, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  subscribeNotifications,
  type EmailNotification,
  type NotificationType,
} from '../lib/notifications';

const TYPE_ICONS: Partial<Record<NotificationType, React.FC<any>>> = {
  ticket_created: Mail,
  ticket_opened: Clock,
  ticket_assigned: UserPlus,
  ticket_enroute: Clock,
  ticket_in_work: Wrench,
  ticket_completed: Check,
  ticket_canceled: X,
  ticket_on_hold: Clock,
  ticket_comment: Mail,
  ticket_high_priority: AlertTriangle,
  ticket_overdue: AlertTriangle,
  invite_created: UserPlus,
  invite_used: UserPlus,
  engineer_report_synced: Check,
};

const TYPE_COLORS: Partial<Record<NotificationType, string>> = {
  ticket_created: 'bg-blue-100 text-blue-600',
  ticket_opened: 'bg-indigo-100 text-indigo-600',
  ticket_assigned: 'bg-purple-100 text-purple-600',
  ticket_enroute: 'bg-yellow-100 text-yellow-600',
  ticket_in_work: 'bg-orange-100 text-orange-600',
  ticket_completed: 'bg-green-100 text-green-600',
  ticket_canceled: 'bg-red-100 text-red-600',
  ticket_on_hold: 'bg-gray-100 text-gray-600',
  ticket_comment: 'bg-blue-100 text-blue-600',
  ticket_high_priority: 'bg-red-100 text-red-600',
  ticket_overdue: 'bg-red-100 text-red-600',
  invite_created: 'bg-purple-100 text-purple-600',
  invite_used: 'bg-green-100 text-green-600',
  engineer_report_synced: 'bg-green-100 text-green-600',
};

type FilterType = 'all' | 'unread' | 'tickets' | 'invites' | 'system';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<EmailNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<FilterType>('all');
  const panelRef = useRef<HTMLDivElement>(null);

  // Subscribe to notification changes
  useEffect(() => {
    const update = () => {
      setNotifications(getNotifications());
      setUnreadCount(getUnreadCount());
    };
    update();
    const unsub = subscribeNotifications(update);
    return unsub;
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleMarkAllRead = () => {
    markAllAsRead();
    setNotifications(getNotifications());
    setUnreadCount(0);
  };

  const handleMarkRead = (id: string) => {
    markAsRead(id);
    setNotifications(getNotifications());
    setUnreadCount(getUnreadCount());
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    switch (filter) {
      case 'unread': return !n.read;
      case 'tickets': return n.type.startsWith('ticket_');
      case 'invites': return n.type.startsWith('invite_');
      case 'system': return ['engineer_report_synced', 'maintenance_reminder'].includes(n.type);
      default: return true;
    }
  });

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Все' },
    { key: 'unread', label: 'Непрочитанные' },
    { key: 'tickets', label: 'Заявки' },
    { key: 'invites', label: 'Приглашения' },
  ];

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label="Уведомления"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-semibold text-gray-900 text-sm">Уведомления</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Прочитать все
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded hover:bg-gray-200 text-gray-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="px-3 py-2 border-b border-gray-100 flex gap-1 overflow-x-auto">
              {filters.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter === f.key
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {f.label}
                  {f.key === 'unread' && unreadCount > 0 && (
                    <span className="ml-1 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[10px]">{unreadCount}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Notification list */}
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {filteredNotifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Нет уведомлений</p>
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const Icon = TYPE_ICONS[notif.type] || Mail;
                  const colorClass = TYPE_COLORS[notif.type] || 'bg-gray-100 text-gray-600';

                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.read ? 'bg-indigo-50/50' : ''}`}
                      onClick={() => handleMarkRead(notif.id)}
                    >
                      <div className="flex gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm truncate ${!notif.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                              {notif.subject}
                            </p>
                            {!notif.read && (
                              <div className="h-2 w-2 bg-indigo-500 rounded-full shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.body}</p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {format(new Date(notif.timestamp), 'd MMM, HH:mm', { locale: ru })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 text-center">
                <span className="text-xs text-gray-400">
                  Всего: {notifications.length} | Непрочитанных: {unreadCount}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Email Notification System — 15 trigger types
 * In production, these would call a backend API (e.g., FastAPI + SMTP/SendGrid).
 * On the frontend, we log notifications and store them for UI display.
 */

export type NotificationType =
  | 'ticket_created'           // 1. Новая заявка создана
  | 'ticket_opened'            // 2. Заявка принята в работу оператором
  | 'ticket_assigned'          // 3. Инженер назначен на заявку
  | 'ticket_enroute'           // 4. Инженер выехал на объект
  | 'ticket_in_work'           // 5. Инженер начал работу
  | 'ticket_completed'         // 6. Заявка завершена
  | 'ticket_canceled'          // 7. Заявка отменена
  | 'ticket_on_hold'           // 8. Заявка приостановлена
  | 'ticket_comment'           // 9. Новый комментарий к заявке
  | 'ticket_high_priority'     // 10. Создана заявка с высоким приоритетом
  | 'ticket_overdue'           // 11. Заявка просрочена (> 48ч без завершения)
  | 'invite_created'           // 12. Приглашение создано
  | 'invite_used'              // 13. Приглашение использовано (новый пользователь)
  | 'maintenance_reminder'     // 14. Напоминание о ТО за 2 недели
  | 'engineer_report_synced';  // 15. Офлайн-отчёт синхронизирован

export interface EmailNotification {
  id: string;
  type: NotificationType;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  timestamp: string;
  read: boolean;
  metadata?: Record<string, string>;
}

const NOTIFICATION_TEMPLATES: Record<NotificationType, { subject: string; body: (ctx: Record<string, string>) => string }> = {
  ticket_created: {
    subject: 'Новая заявка #{ticketId}',
    body: (ctx) => `Создана новая заявка #${ctx.ticketId}. Оборудование: ${ctx.model}. Адрес: ${ctx.address}. Описание: ${ctx.description}`,
  },
  ticket_opened: {
    subject: 'Заявка #{ticketId} принята в работу',
    body: (ctx) => `Оператор ${ctx.operatorName} принял заявку #${ctx.ticketId} в работу.`,
  },
  ticket_assigned: {
    subject: 'Вам назначена заявка #{ticketId}',
    body: (ctx) => `Вам назначена заявка #${ctx.ticketId}. Оборудование: ${ctx.model}. Адрес: ${ctx.address}.`,
  },
  ticket_enroute: {
    subject: 'Инженер выехал — заявка #{ticketId}',
    body: (ctx) => `Инженер ${ctx.engineerName} выехал на объект по заявке #${ctx.ticketId}.`,
  },
  ticket_in_work: {
    subject: 'Работы начаты — заявка #{ticketId}',
    body: (ctx) => `Инженер ${ctx.engineerName} начал работы по заявке #${ctx.ticketId}.`,
  },
  ticket_completed: {
    subject: 'Заявка #{ticketId} завершена',
    body: (ctx) => `Заявка #${ctx.ticketId} успешно завершена. Результат: ${ctx.resolution}`,
  },
  ticket_canceled: {
    subject: 'Заявка #{ticketId} отменена',
    body: (ctx) => `Заявка #${ctx.ticketId} была отменена. Причина: ${ctx.reason}`,
  },
  ticket_on_hold: {
    subject: 'Заявка #{ticketId} приостановлена',
    body: (ctx) => `Заявка #${ctx.ticketId} была приостановлена. Причина: ${ctx.reason}`,
  },
  ticket_comment: {
    subject: 'Новый комментарий к заявке #{ticketId}',
    body: (ctx) => `${ctx.authorName} оставил комментарий к заявке #${ctx.ticketId}: "${ctx.comment}"`,
  },
  ticket_high_priority: {
    subject: '⚠️ Срочная заявка #{ticketId}',
    body: (ctx) => `Создана заявка с высоким приоритетом #${ctx.ticketId}. Оборудование: ${ctx.model}. Адрес: ${ctx.address}.`,
  },
  ticket_overdue: {
    subject: '⏰ Просроченная заявка #{ticketId}',
    body: (ctx) => `Заявка #${ctx.ticketId} не завершена более 48 часов. Требуется внимание.`,
  },
  invite_created: {
    subject: 'Приглашение в систему Чебоко',
    body: (ctx) => `Вам создано приглашение для роли "${ctx.roleName}". Ссылка: ${ctx.inviteUrl}. Действительна 24 часа.`,
  },
  invite_used: {
    subject: 'Новый пользователь зарегистрирован',
    body: (ctx) => `${ctx.userName} зарегистрировался по вашему приглашению с ролью "${ctx.roleName}".`,
  },
  maintenance_reminder: {
    subject: '🔧 Напоминание о ТО — ${equipmentModel}',
    body: (ctx) => `Плановое техническое обслуживание оборудования ${ctx.equipmentModel} (S/N: ${ctx.serialNumber}) запланировано через 2 недели. Адрес: ${ctx.address}.`,
  },
  engineer_report_synced: {
    subject: 'Офлайн-отчёт синхронизирован — заявка #{ticketId}',
    body: (ctx) => `Офлайн-отчёт по заявке #${ctx.ticketId} успешно синхронизирован с сервером.`,
  },
};

// In-memory notification store
let notifications: EmailNotification[] = [];
let listeners: Array<() => void> = [];

function notifyListeners() {
  listeners.forEach(l => l());
}

export function subscribeNotifications(listener: () => void) {
  listeners.push(listener);
  return () => { listeners = listeners.filter(l => l !== listener); };
}

export function getNotifications(): EmailNotification[] {
  return notifications;
}

export function getUnreadCount(): number {
  return notifications.filter(n => !n.read).length;
}

export function markAsRead(id: string) {
  notifications = notifications.map(n => n.id === id ? { ...n, read: true } : n);
  notifyListeners();
}

export function markAllAsRead() {
  notifications = notifications.map(n => ({ ...n, read: true }));
  notifyListeners();
}

export function sendNotification(
  type: NotificationType,
  recipientEmail: string,
  recipientName: string,
  context: Record<string, string>
): EmailNotification {
  const template = NOTIFICATION_TEMPLATES[type];
  let subject = template.subject;
  // Replace placeholders in subject
  Object.entries(context).forEach(([key, value]) => {
    subject = subject.replace(`{${key}}`, value).replace(`\${${key}}`, value);
  });

  const notification: EmailNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    type,
    recipientEmail,
    recipientName,
    subject,
    body: template.body(context),
    timestamp: new Date().toISOString(),
    read: false,
    metadata: context,
  };

  notifications = [notification, ...notifications].slice(0, 100); // Keep last 100
  notifyListeners();

  // In production: POST /api/notifications/email
  console.log(`[Email] → ${recipientEmail}: ${subject}`);

  return notification;
}

/** Trigger helper: send notifications for a ticket status change */
export function triggerTicketStatusNotification(
  type: NotificationType,
  context: Record<string, string>,
  recipients: Array<{ email: string; name: string }>
) {
  recipients.forEach(r => {
    sendNotification(type, r.email, r.name, context);
  });
}

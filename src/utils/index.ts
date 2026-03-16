import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STATUS_LABELS: Record<string, string> = {
  created: 'Создана',
  opened: 'Открыта',
  assigned: 'Назначен инженер',
  enroute: 'В пути',
  in_work: 'В работе',
  completed: 'Выполнена',
  on_hold: 'Приостановлена',
  canceled: 'Отменена',
};

export const STATUS_COLORS: Record<string, string> = {
  created: 'bg-gray-100 text-gray-800',
  opened: 'bg-blue-100 text-blue-800',
  assigned: 'bg-indigo-100 text-indigo-800',
  enroute: 'bg-yellow-100 text-yellow-800',
  in_work: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  on_hold: 'bg-red-100 text-red-800',
  canceled: 'bg-gray-300 text-gray-800',
};

export const PRIORITY_LABELS: Record<string, string> = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
};

export const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200',
};

export const ROLE_LABELS: Record<string, string> = {
  specialist: 'Специалист',
  location_manager: 'Управляющий точкой',
  network_manager: 'Руководитель сети',
  operator: 'Оператор',
  engineer: 'Инженер',
  region_manager: 'Менеджер региона',
  admin: 'Администратор',
};

/** Open external navigator app with route to given coordinates */
export function openNavigator(lat: number, lng: number) {
  const yandexUrl = `yandexnavi://build_route_on_map?lat_to=${lat}&lon_to=${lng}`;
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const appleUrl = `maps://maps.apple.com/?daddr=${lat},${lng}`;

  const ua = navigator.userAgent;
  if (/iPhone|iPad/i.test(ua)) {
    window.location.href = appleUrl;
    setTimeout(() => window.open(googleUrl, '_blank'), 1000);
  } else if (/Android/i.test(ua)) {
    window.location.href = yandexUrl;
    setTimeout(() => window.open(googleUrl, '_blank'), 1000);
  } else {
    window.open(googleUrl, '_blank');
  }
}

/** Get the default route for a given role */
export function getDefaultRouteForRole(role: string): string {
  switch (role) {
    case 'engineer':
      return '/tickets';
    case 'specialist':
      return '/tickets';
    case 'location_manager':
      return '/dashboard';
    case 'network_manager':
      return '/dashboard';
    case 'operator':
      return '/tickets';
    case 'region_manager':
      return '/dashboard';
    case 'admin':
      return '/dashboard';
    default:
      return '/dashboard';
  }
}

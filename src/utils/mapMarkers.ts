/**
 * Генерация SVG-икonoк для типов оборудования
 */

export const EQUIPMENT_ICONS: Record<string, string> = {
  // WiFi роутеры и точки доступа
  'wifi': `<path d="M5 12.55a11 11 0 0 1 14.08 0" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M1.42 9a16 16 0 0 1 21.16 0" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/><line x1="12" y1="20" x2="12.01" y2="20" stroke="white" stroke-width="3" stroke-linecap="round"/>`,
  
  // Камеры видеонаблюдения
  'camera': `<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" fill="white"/><circle cx="12" cy="13" r="3" fill="#1f2937"/><path d="M12 10v6" stroke="#1f2937" stroke-width="1.5" stroke-linecap="round"/>`,
  
  // Турникеты и СКУД
  'access': `<rect x="3" y="4" width="18" height="16" rx="2" fill="white"/><line x1="12" y1="8" x2="12" y2="16" stroke="#1f2937" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="14" r="1.5" fill="#1f2937"/>`,
  
  // Датчики (движения, открытия, дыма)
  'sensor': `<circle cx="12" cy="12" r="8" fill="white" stroke="#1f2937" stroke-width="1.5"/><circle cx="12" cy="12" r="3" fill="#1f2937"/><path d="M12 4v2M12 18v2M4 12h2M18 12h2" stroke="#1f2937" stroke-width="1.5" stroke-linecap="round"/>`,
  
  // Серверы и сетевое оборудование
  'server': `<rect x="4" y="5" width="16" height="14" rx="2" fill="white"/><line x1="8" y1="9" x2="16" y2="9" stroke="#1f2937" stroke-width="1.5" stroke-linecap="round"/><line x1="8" y1="13" x2="16" y2="13" stroke="#1f2937" stroke-width="1.5" stroke-linecap="round"/><circle cx="6" cy="9" r="0.75" fill="#10b981"/><circle cx="6" cy="13" r="0.75" fill="#10b981"/>`,
  
  // Терминалы оплаты
  'terminal': `<rect x="5" y="4" width="14" height="16" rx="2" fill="white"/><rect x="7" y="6" width="10" height="7" rx="1" fill="#1f2937"/><circle cx="12" cy="16" r="1.5" fill="white" stroke="#1f2937" stroke-width="1.5"/>`,
  
  // Холодильное оборудование
  'fridge': `<rect x="7" y="4" width="10" height="16" rx="2" fill="white"/><line x1="7" y1="10" x2="17" y2="10" stroke="#1f2937" stroke-width="1.5"/><circle cx="12" cy="14" r="1.5" fill="#1f2937"/>`,
  
  // Вендинговые автоматы
  'vending': `<rect x="6" y="4" width="12" height="16" rx="2" fill="white"/><rect x="8" y="6" width="8" height="8" rx="1" fill="#1f2937"/><circle cx="12" cy="17" r="1" fill="#1f2937"/>`,
  
  // Кондиционеры
  'ac': `<rect x="4" y="7" width="16" height="10" rx="2" fill="white"/><path d="M6 10h3M15 10h3M6 14h3M15 14h3" stroke="#1f2937" stroke-width="1.5" stroke-linecap="round"/>`,
  
  // ИК-панели
  'heating': `<rect x="5" y="5" width="14" height="14" rx="2" fill="white"/><path d="M8 8l8 8M16 8l-8 8" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>`,
  
  // Освещение
  'light': `<path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" fill="white" stroke="#1f2937" stroke-width="1.5"/><path d="M9 21h6" stroke="#1f2937" stroke-width="2" stroke-linecap="round"/>`,
  
  // Прочее оборудование
  'other': `<circle cx="12" cy="12" r="9" fill="white" stroke="#1f2937" stroke-width="1.5"/><line x1="12" y1="8" x2="12" y2="16" stroke="#1f2937" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="12" x2="16" y2="12" stroke="#1f2937" stroke-width="2" stroke-linecap="round"/>`,
};

/**
 * Получить иконку оборудования по названию модели
 */
export function getEquipmentIcon(model: string): string {
  const modelLower = model.toLowerCase();
  
  if (modelLower.includes('wi-fi') || modelLower.includes('wifi') || modelLower.includes('router') || modelLower.includes('роутер') || modelLower.includes('точка доступа')) {
    return EQUIPMENT_ICONS.wifi;
  }
  if (modelLower.includes('cam') || modelLower.includes('камер') || modelLower.includes('видео') || modelLower.includes('cctv')) {
    return EQUIPMENT_ICONS.camera;
  }
  if (modelLower.includes('турникет') || modelLower.includes('скуд') || modelLower.includes('access') || modelLower.includes('контроль')) {
    return EQUIPMENT_ICONS.access;
  }
  if (modelLower.includes('датчик') || modelLower.includes('sensor') || modelLower.includes('движения') || modelLower.includes('дыма')) {
    return EQUIPMENT_ICONS.sensor;
  }
  if (modelLower.includes('сервер') || modelLower.includes('server') || modelLower.includes('switch') || modelLower.includes('network')) {
    return EQUIPMENT_ICONS.server;
  }
  if (modelLower.includes('терминал') || modelLower.includes('terminal') || modelLower.includes('оплата') || modelLower.includes('payment')) {
    return EQUIPMENT_ICONS.terminal;
  }
  if (modelLower.includes('холодиль') || modelLower.includes('fridge') || modelLower.includes('cold')) {
    return EQUIPMENT_ICONS.fridge;
  }
  if (modelLower.includes('вендин') || modelLower.includes('vending') || modelLower.includes('автомат')) {
    return EQUIPMENT_ICONS.vending;
  }
  if (modelLower.includes('кондиционер') || modelLower.includes('ac ') || modelLower.includes('air cond')) {
    return EQUIPMENT_ICONS.ac;
  }
  if (modelLower.includes('ик-панель') || modelLower.includes('heating') || modelLower.includes('обогрев')) {
    return EQUIPMENT_ICONS.heating;
  }
  if (modelLower.includes('свет') || modelLower.includes('light') || modelLower.includes('освещ')) {
    return EQUIPMENT_ICONS.light;
  }
  
  return EQUIPMENT_ICONS.other;
}

/**
 * Сгенерировать SVG для маркера карты
 * @param color - цвет маркера (hex)
 * @param count - количество заявок
 * @param iconSvg - SVG-иконка оборудования
 * @param isPulsing - пульсирующая анимация для активных заявок
 */
export function generateMarkerSvg(color: string, count: number, iconSvg: string, isPulsing: boolean = false): string {
  const animation = isPulsing ? `
    <circle cx="20" cy="20" r="18" fill="none" stroke="${color}" stroke-width="2" opacity="0.4">
      <animate attributeName="r" from="18" to="28" dur="1.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite"/>
    </circle>
  ` : '';
  
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
        </filter>
      </defs>
      ${animation}
      <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="2.5" filter="url(#shadow)"/>
      <g transform="translate(20, 20) scale(0.5) translate(-24, -24)">
        ${iconSvg}
      </g>
      <circle cx="30" cy="10" r="9" fill="${color}" stroke="white" stroke-width="1.5"/>
      <text x="30" y="14" text-anchor="middle" fill="white" font-size="10" font-weight="bold" font-family="sans-serif">${count}</text>
    </svg>
  `)}`;
}

/**
 * Получить приоритет для локации на основе заявок
 */
export function getLocationPriority(tickets: Array<{ priority: string }>): string {
  if (tickets.some(t => t.priority === 'high')) return 'high';
  if (tickets.some(t => t.priority === 'medium')) return 'medium';
  return 'low';
}

/**
 * Цвет маркера по приоритету
 */
export const PRIORITY_MARKER_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#3b82f6',
};

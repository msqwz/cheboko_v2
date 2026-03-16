import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps';
import { useNavigate } from 'react-router-dom';
import { FadeIn, SwipeCard } from '../components/AnimatedComponents';
import { Navigation, Filter, X, ChevronUp, ChevronDown, MapPin, ExternalLink } from 'lucide-react';
import { STATUS_LABELS, PRIORITY_LABELS, PRIORITY_COLORS, STATUS_COLORS, cn, openNavigator } from '../utils';
import { AnimatePresence, motion } from 'motion/react';
import type { Ticket, Location as AppLocation } from '../types';

// Priority → marker color map
const PRIORITY_MARKER_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#3b82f6',
};

export const MapPage = () => {
  const { currentUser, locations, tickets, users, rolePermissions } = useAppContext();
  const navigate = useNavigate();

  // ALL hooks must be called before any conditional return
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [engineerFilter, setEngineerFilter] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ loc: AppLocation; tickets: Ticket[] } | null>(null);

  const currentPerms = currentUser ? rolePermissions[currentUser.role] || [] : [];

  if (!currentUser || !currentPerms.includes('view_map')) {
    return <div className="p-4 text-center text-gray-500">Доступ запрещен</div>;
  }

  const isEngineer = currentUser.role === 'engineer';
  const engineers = users.filter(u => u.role === 'engineer');

  // Data scope: which tickets are visible based on role
  const scopedTickets = React.useMemo(() => {
    const active = tickets.filter(t => !['completed', 'canceled'].includes(t.status));
    switch (currentUser.role) {
      case 'engineer':
        return active.filter(t => t.assignedTo === currentUser.id);
      case 'specialist':
        return active.filter(t => t.createdBy === currentUser.id);
      case 'location_manager':
        return active.filter(t => t.equipmentDetails.locationId === currentUser.locationId);
      case 'network_manager':
        return active.filter(t => {
          const loc = locations.find(l => l.id === t.equipmentDetails.locationId);
          return (loc as any)?.networkId === currentUser.networkId;
        });
      default:
        return active;
    }
  }, [tickets, currentUser, locations]);

  // Apply map filters
  const filteredTickets = React.useMemo(() => {
    let result = scopedTickets;
    if (statusFilter) result = result.filter(t => t.status === statusFilter);
    if (priorityFilter) result = result.filter(t => t.priority === priorityFilter);
    if (engineerFilter) result = result.filter(t => t.assignedTo === engineerFilter);
    return result;
  }, [scopedTickets, statusFilter, priorityFilter, engineerFilter]);

  // Locations that have filtered tickets
  const locationsWithTickets = locations.filter(loc =>
    filteredTickets.some(t => t.equipmentDetails.locationId === loc.id)
  ).map(loc => ({
    loc,
    tickets: filteredTickets.filter(t => t.equipmentDetails.locationId === loc.id),
  }));

  // Determine highest priority at each location for marker color
  const getLocationPriority = (locTickets: Ticket[]): string => {
    if (locTickets.some(t => t.priority === 'high')) return 'high';
    if (locTickets.some(t => t.priority === 'medium')) return 'medium';
    return 'low';
  };

  // Engineer placemarks (dispatchers only)
  const engineerMarkers = !isEngineer ? users.filter(u => u.role === 'engineer' && u.lat && u.lng) : [];

  // Engineer's own ticket list for navigation
  const engineerNavTickets = isEngineer
    ? filteredTickets.map(t => ({
        ticket: t,
        location: locations.find(l => l.id === t.equipmentDetails.locationId),
      })).filter(item => item.location?.lat && item.location?.lng)
    : [];

  const handleLocationClick = (loc: AppLocation, locTickets: Ticket[]) => {
    setSelectedLocation({ loc, tickets: locTickets });
  };

  const activeFilterCount = [statusFilter, priorityFilter, engineerFilter].filter(Boolean).length;

  return (
    <FadeIn>
      <div className="space-y-3 h-[calc(100vh-8rem)] flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Карта</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border",
              showFilters ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            )}
          >
            <Filter className="h-4 w-4" />
            Фильтры
            {activeFilterCount > 0 && (
              <span className="bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>
        </div>

        {/* Filter panel with AnimatePresence */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Статус</label>
                  <select className="block w-full rounded-lg border-gray-300 text-sm border p-2" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="">Все статусы</option>
                    {Object.entries(STATUS_LABELS).filter(([k]) => !['completed','canceled'].includes(k)).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Приоритет</label>
                  <select className="block w-full rounded-lg border-gray-300 text-sm border p-2" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                    <option value="">Все</option>
                    {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                {!isEngineer && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Инженер</label>
                    <select className="block w-full rounded-lg border-gray-300 text-sm border p-2" value={engineerFilter} onChange={e => setEngineerFilter(e.target.value)}>
                      <option value="">Все</option>
                      {engineers.map(eng => <option key={eng.id} value={eng.id}>{eng.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Map container */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden flex-1 flex flex-col border border-gray-100">
          {/* Legend bar */}
          <div className="px-4 py-2 border-b border-gray-200 flex flex-wrap gap-3 items-center bg-gray-50 text-xs">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>Высокий</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>Средний</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>Низкий</div>
            {!isEngineer && <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>Инженеры</div>}
            <span className="ml-auto text-gray-500">Точек: {locationsWithTickets.length} | Заявок: {filteredTickets.length}</span>
          </div>

          {/* Engineer quick-nav */}
          {isEngineer && engineerNavTickets.length > 0 && (
            <div className="border-b border-gray-200 bg-indigo-50 px-3 py-2 overflow-x-auto flex gap-2">
              {engineerNavTickets.map(({ ticket, location }) => (
                <button
                  key={ticket.id}
                  onClick={() => location?.lat && location?.lng && openNavigator(location.lat, location.lng)}
                  className="shrink-0 inline-flex items-center gap-1.5 bg-white border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-50 transition-colors"
                >
                  <Navigation className="h-3 w-3" />
                  {ticket.equipmentDetails.model}
                </button>
              ))}
            </div>
          )}

          {/* Yandex Map */}
          <div className="flex-1 w-full h-full relative min-h-[300px]">
            <YMaps query={{ apikey: '', lang: 'ru_RU' }}>
              <Map defaultState={{ center: [55.751574, 37.573856], zoom: 11 }} width="100%" height="100%" options={{ suppressMapOpenBlock: true }}>
                {locationsWithTickets.map(({ loc, tickets: locTickets }) => {
                  const priority = getLocationPriority(locTickets);
                  const color = PRIORITY_MARKER_COLORS[priority];
                  const hasHigh = priority === 'high';
                  return loc.lat && loc.lng && (
                    <Placemark
                      key={`loc-${loc.id}`}
                      geometry={[loc.lat, loc.lng]}
                      properties={{
                        iconContent: String(locTickets.length),
                        hintContent: `${loc.name} (${locTickets.length})`,
                      }}
                      options={{
                        iconLayout: 'default#imageWithContent',
                        iconImageHref: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><circle cx="18" cy="18" r="16" fill="${color}" stroke="white" stroke-width="2"/>${hasHigh ? '<circle cx="18" cy="18" r="16" fill="none" stroke="' + color + '" stroke-width="3" opacity="0.4"><animate attributeName="r" from="16" to="24" dur="1.5s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite"/></circle>' : ''}<text x="18" y="23" text-anchor="middle" fill="white" font-size="13" font-weight="bold" font-family="sans-serif">${locTickets.length}</text></svg>`)}`,
                        iconImageSize: [36, 36],
                        iconImageOffset: [-18, -18],
                      }}
                      onClick={() => handleLocationClick(loc, locTickets)}
                    />
                  );
                })}

                {engineerMarkers.map(eng => {
                  const engTickets = filteredTickets.filter(t => t.assignedTo === eng.id);
                  return eng.lat && eng.lng && (
                    <Placemark
                      key={`eng-${eng.id}`}
                      geometry={[eng.lat, eng.lng]}
                      properties={{
                        hintContent: `${eng.name} (${engTickets.length} заявок)`,
                        balloonContentHeader: `<strong>${eng.name}</strong>`,
                        balloonContentBody: `<p style="font-size:12px;color:#6b7280;">Инженер • Активных: ${engTickets.length}</p>`,
                      }}
                      options={{ preset: 'islands#greenDotIcon' }}
                    />
                  );
                })}
              </Map>
            </YMaps>
          </div>
        </div>

        {/* Bottom Sheet — appears when a location marker is clicked */}
        <AnimatePresence>
          {selectedLocation && (
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 max-h-[60vh] flex flex-col"
            >
              {/* Handle */}
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedLocation.loc.name}</h3>
                  <button
                    onClick={() => selectedLocation.loc.lat && selectedLocation.loc.lng && openNavigator(selectedLocation.loc.lat, selectedLocation.loc.lng)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-0.5"
                  >
                    <MapPin className="h-3 w-3" />
                    {selectedLocation.loc.address}
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              {/* Ticket list */}
              <div className="overflow-y-auto flex-1 px-4 py-2 space-y-2">
                {selectedLocation.tickets.map((ticket) => {
                  const assignee = ticket.assignedTo ? users.find(u => u.id === ticket.assignedTo) : null;
                  return (
                    <div key={ticket.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-900">#{ticket.id}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATUS_COLORS[ticket.status])}>
                            {STATUS_LABELS[ticket.status]}
                          </span>
                          <span className={cn("inline-flex items-center rounded-full border px-1.5 py-0.5 text-xs font-medium", PRIORITY_COLORS[ticket.priority])}>
                            {PRIORITY_LABELS[ticket.priority]}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{ticket.equipmentDetails.model}</p>
                      {assignee && <p className="text-xs text-gray-500 mt-0.5">Инженер: {assignee.name}</p>}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium text-center transition-colors"
                        >
                          Детали
                        </button>
                        {selectedLocation.loc.lat && selectedLocation.loc.lng && (
                          <button
                            onClick={() => openNavigator(selectedLocation.loc.lat!, selectedLocation.loc.lng!)}
                            className="inline-flex items-center gap-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          >
                            <Navigation className="h-3 w-3" />
                            Навигатор
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FadeIn>
  );
};

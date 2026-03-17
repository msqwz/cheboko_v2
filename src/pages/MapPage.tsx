import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps';
import { useNavigate } from 'react-router-dom';
import { FadeIn } from '../components/AnimatedComponents';
import { Navigation, Filter, X, MapPin, ExternalLink, Wrench, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { STATUS_LABELS, PRIORITY_LABELS, PRIORITY_COLORS, STATUS_COLORS, cn, openNavigator } from '../utils';
import { generateMarkerSvg, getEquipmentIcon, getLocationPriority, PRIORITY_MARKER_COLORS } from '../utils/mapMarkers';
import { AnimatePresence, motion } from 'motion/react';
import type { Ticket, Location as AppLocation } from '../types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

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

  // Determine which tickets are "active" (not completed/canceled) for pulsing animation
  const activeTicketIds = React.useMemo(() => {
    return new Set(
      tickets
        .filter(t => !['completed', 'canceled'].includes(t.status))
        .map(t => t.id)
    );
  }, [tickets]);

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
            <YMaps query={{ apikey: 'e1a186ee-6741-4e3f-b7f4-438ed8c61c4b', lang: 'ru_RU' }}>
              <Map defaultState={{ center: [47.2357, 39.7015 ], zoom: 10 }} width="100%" height="100%" options={{ suppressMapOpenBlock: true }}>
                {locationsWithTickets.map(({ loc, tickets: locTickets }) => {
                  const priority = getLocationPriority(locTickets);
                  const color = PRIORITY_MARKER_COLORS[priority];
                  // Pulsing for locations with active (non-completed) tickets
                  const hasActiveTickets = locTickets.some(t => activeTicketIds.has(t.id));
                  // Get the most common equipment type icon
                  const equipmentType = locTickets[0]?.equipmentDetails.model || 'other';
                  const iconSvg = getEquipmentIcon(equipmentType);
                  const markerSvg = generateMarkerSvg(color, locTickets.length, iconSvg, hasActiveTickets);
                  
                  return loc.lat && loc.lng && (
                    <Placemark
                      key={`loc-${loc.id}`}
                      geometry={[loc.lat, loc.lng]}
                      properties={{
                        hintContent: `${loc.name} (${locTickets.length} заявок)`,
                      }}
                      options={{
                        iconLayout: 'default#image',
                        iconImageHref: markerSvg,
                        iconImageSize: [40, 40],
                        iconImageOffset: [-20, -20],
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
              className="absolute bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 max-h-[70vh] flex flex-col"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
              </div>

              {/* Header */}
              <div className="flex items-start justify-between px-4 pb-3 border-b border-gray-100">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{selectedLocation.loc.name}</h3>
                  <button
                    onClick={() => selectedLocation.loc.lat && selectedLocation.loc.lng && openNavigator(selectedLocation.loc.lat, selectedLocation.loc.lng)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 mt-1 font-medium"
                  >
                    <MapPin className="h-4 w-4" />
                    {selectedLocation.loc.address}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                  <p className="text-xs text-gray-500 mt-0.5">{selectedLocation.loc.legalEntity}</p>
                </div>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="p-2 rounded-full hover:bg-gray-100 -mt-2 -mr-2"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              {/* Stats bar */}
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="font-medium">Высокий:</span>
                  <span className="text-gray-700">{selectedLocation.tickets.filter(t => t.priority === 'high').length}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span className="font-medium">Средний:</span>
                  <span className="text-gray-700">{selectedLocation.tickets.filter(t => t.priority === 'medium').length}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="font-medium">Низкий:</span>
                  <span className="text-gray-700">{selectedLocation.tickets.filter(t => t.priority === 'low').length}</span>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-gray-600">Всего: {selectedLocation.tickets.length}</span>
                </div>
              </div>

              {/* Ticket list */}
              <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2.5">
                {selectedLocation.tickets.map((ticket) => {
                  const assignee = ticket.assignedTo ? users.find(u => u.id === ticket.assignedTo) : null;
                  const isActive = !['completed', 'canceled'].includes(ticket.status);
                  return (
                    <div 
                      key={ticket.id} 
                      className={cn(
                        "rounded-xl p-3 border transition-all hover:shadow-md cursor-pointer",
                        isActive ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100 opacity-75"
                      )}
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-gray-900">#{ticket.id}</span>
                          {isActive ? (
                            <AlertCircle className="h-4 w-4 text-indigo-500 shrink-0" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATUS_COLORS[ticket.status])}>
                            {STATUS_LABELS[ticket.status]}
                          </span>
                          <span className={cn("inline-flex items-center rounded-full border px-1.5 py-0.5 text-xs font-medium", PRIORITY_COLORS[ticket.priority])}>
                            {PRIORITY_LABELS[ticket.priority]}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm font-medium text-gray-800 mb-1">{ticket.equipmentDetails.model}</p>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">{ticket.description}</p>
                      
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs">
                          {assignee && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs">
                                {assignee.name.charAt(0)}
                              </div>
                              <span className="truncate max-w-[100px]">{assignee.name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-gray-400">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="text-xs">{format(new Date(ticket.createdAt), 'dd.MM.yy HH:mm', { locale: ru })}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex gap-2 mt-2.5 pt-2 border-t border-gray-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/tickets/${ticket.id}`); }}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-medium text-center transition-colors"
                        >
                          Детали
                        </button>
                        {selectedLocation.loc.lat && selectedLocation.loc.lng && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openNavigator(selectedLocation.loc.lat!, selectedLocation.loc.lng!); }}
                            className="inline-flex items-center justify-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                          >
                            <Navigation className="h-3.5 w-3.5" />
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

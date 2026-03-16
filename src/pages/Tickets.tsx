import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, cn, openNavigator } from '../utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TicketProgressBar } from '../components/TicketProgressBar';
import { Search, Filter, Download, MapPin, Navigation, ChevronRight } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { FadeIn, SwipeCard } from '../components/AnimatedComponents';

export const Tickets = () => {
  const { currentUser, tickets, users, locations, rolePermissions } = useAppContext();
  const navigate = useNavigate();

  const currentPerms = currentUser ? rolePermissions[currentUser.role] || [] : [];

  // ALL hooks before conditional returns
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [engineerFilter, setEngineerFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  if (!currentUser || !currentPerms.includes('view_tickets')) {
    return <div className="p-4 text-center text-gray-500">Доступ запрещен</div>;
  }

  const engineers = users.filter(u => u.role === 'engineer');

  // Data Scope filtering based on role
  const visibleTickets = React.useMemo(() => {
    if (!currentUser) return [];
    switch (currentUser.role) {
      case 'specialist':
        // Specialist sees ONLY tickets they created personally
        return tickets.filter(t => t.createdBy === currentUser.id);
      case 'location_manager':
        // Location manager sees all tickets for their specific location (own + specialists')
        return tickets.filter(t => t.equipmentDetails.locationId === currentUser.locationId);
      case 'network_manager':
        // Network manager sees all tickets across all locations in their network
        return tickets.filter(t => {
          const loc = locations.find(l => l.id === t.equipmentDetails.locationId);
          return loc?.networkId === currentUser.networkId;
        });
      case 'engineer':
        // Engineer sees only tickets assigned to them or created by them
        return tickets.filter(t => t.assignedTo === currentUser.id || t.createdBy === currentUser.id);
      case 'region_manager':
      case 'operator':
      case 'admin':
        return tickets;
      default:
        return [];
    }
  }, [tickets, currentUser, locations]);

  const filteredTickets = React.useMemo(() => {
    let filtered = visibleTickets;
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.equipmentDetails.model.toLowerCase().includes(lowerQuery) ||
        t.equipmentDetails.serialNumber.toLowerCase().includes(lowerQuery) ||
        t.equipmentDetails.locationName.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery)
      );
    }
    if (statusFilter) filtered = filtered.filter(t => t.status === statusFilter);
    if (priorityFilter) filtered = filtered.filter(t => t.priority === priorityFilter);
    if (engineerFilter) filtered = filtered.filter(t => t.assignedTo === engineerFilter);
    if (dateFrom) filtered = filtered.filter(t => new Date(t.createdAt) >= new Date(dateFrom));
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setDate(toDate.getDate() + 1);
      filtered = filtered.filter(t => new Date(t.createdAt) < toDate);
    }
    return filtered;
  }, [visibleTickets, searchQuery, statusFilter, priorityFilter, engineerFilter, dateFrom, dateTo]);

  const handleExportCSV = () => {
    const headers = ['ID', 'Модель', 'S/N', 'Адрес', 'Статус', 'Приоритет', 'Инженер', 'Дата создания'];
    const csvContent = [
      headers.join(','),
      ...filteredTickets.map(t => {
        const eng = t.assignedTo ? users.find(u => u.id === t.assignedTo)?.name || '' : '';
        return [
          t.id,
          `"${t.equipmentDetails.model}"`,
          `"${t.equipmentDetails.serialNumber}"`,
          `"${t.equipmentDetails.locationName}"`,
          STATUS_LABELS[t.status],
          PRIORITY_LABELS[t.priority],
          `"${eng}"`,
          format(new Date(t.createdAt), 'yyyy-MM-dd HH:mm')
        ].join(',');
      })
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `tickets_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddressClick = (e: React.MouseEvent, locationId: string) => {
    e.stopPropagation();
    const loc = locations.find(l => l.id === locationId);
    if (loc?.lat && loc?.lng) {
      openNavigator(loc.lat, loc.lng);
    }
  };

  // Quick action button for engineer
  const getQuickAction = (ticket: typeof tickets[0]) => {
    if (currentUser?.role !== 'engineer' || ticket.assignedTo !== currentUser.id) return null;
    switch (ticket.status) {
      case 'assigned': return { label: 'Выехать', color: 'bg-yellow-500' };
      case 'enroute': return { label: 'Начать', color: 'bg-orange-500' };
      case 'in_work': return { label: 'Завершить', color: 'bg-green-500' };
      default: return null;
    }
  };

  return (
    <FadeIn>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Заявки</h2>
          <div className="mt-3 sm:mt-0 sm:ml-4 flex flex-wrap gap-2">
            <div className="relative rounded-md shadow-sm w-full sm:w-64">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Поиск..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="mr-2 h-4 w-4 text-gray-400" />
              <span className="hidden sm:inline">Фильтры</span>
            </Button>
            <Button variant="outline" onClick={handleExportCSV} className="hidden sm:flex">
              <Download className="mr-2 h-4 w-4 text-gray-400" />
              Экспорт
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Статус</label>
              <select className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm border p-2" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">Все</option>
                {Object.entries(STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Приоритет</label>
              <select className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm border p-2" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                <option value="">Все</option>
                {Object.entries(PRIORITY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Инженер</label>
              <select className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm border p-2" value={engineerFilter} onChange={e => setEngineerFilter(e.target.value)}>
                <option value="">Все</option>
                {engineers.map(eng => <option key={eng.id} value={eng.id}>{eng.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">От</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">До</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
        )}

        {/* MOBILE: Card view */}
        <div className="block lg:hidden space-y-3">
          {filteredTickets.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-500 bg-white rounded-xl border border-gray-100">
              Нет заявок для отображения
            </div>
          )}
          {filteredTickets.map((ticket, idx) => {
            const assignee = ticket.assignedTo ? users.find(u => u.id === ticket.assignedTo) : null;
            const quickAction = getQuickAction(ticket);
            const loc = locations.find(l => l.id === ticket.equipmentDetails.locationId);

            return (
              <SwipeCard key={ticket.id} index={idx}>
                <div
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden active:bg-gray-50 transition-colors"
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">#{ticket.id}</span>
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATUS_COLORS[ticket.status])}>
                        {STATUS_LABELS[ticket.status]}
                      </span>
                    </div>
                    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", PRIORITY_COLORS[ticket.priority])}>
                      {PRIORITY_LABELS[ticket.priority]}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="px-4 pb-3">
                    <p className="text-sm font-medium text-gray-900">{ticket.equipmentDetails.model}</p>
                    <p className="text-xs text-gray-500 mt-0.5">S/N: {ticket.equipmentDetails.serialNumber}</p>

                    {/* Clickable address — opens navigator */}
                    <button
                      onClick={(e) => handleAddressClick(e, ticket.equipmentDetails.locationId)}
                      className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-left truncate">{ticket.equipmentDetails.locationName}</span>
                      <Navigation className="h-3 w-3 shrink-0 ml-auto" />
                    </button>

                    {assignee && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700 shrink-0">
                          {assignee.name.charAt(0)}
                        </span>
                        <span className="text-xs text-gray-600">{assignee.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Card footer */}
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      {format(new Date(ticket.createdAt), 'd MMM, HH:mm', { locale: ru })}
                    </span>
                    <div className="flex items-center gap-2">
                      {quickAction && (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/tickets/${ticket.id}`); }}
                          className={`${quickAction.color} text-white px-3 py-1 rounded-lg text-xs font-medium`}
                        >
                          {quickAction.label}
                        </button>
                      )}
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </SwipeCard>
            );
          })}
        </div>

        {/* DESKTOP: Table view */}
        <div className="hidden lg:block overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">ID</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Оборудование</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Адрес</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Инженер</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Статус</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Прогресс</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Приоритет</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Создана</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredTickets.map((ticket) => {
                  const assignee = ticket.assignedTo ? users.find(u => u.id === ticket.assignedTo) : null;
                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {ticket.id}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="font-medium text-gray-900">{ticket.equipmentDetails.model}</div>
                        <div className="text-xs text-gray-500">S/N: {ticket.equipmentDetails.serialNumber}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <button
                          onClick={(e) => handleAddressClick(e, ticket.equipmentDetails.locationId)}
                          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                        >
                          <MapPin className="h-3.5 w-3.5" />
                          {ticket.equipmentDetails.locationName}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {assignee ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700">
                              {assignee.name.charAt(0)}
                            </span>
                            <span className="text-xs">{assignee.name.split(' ')[0]}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_COLORS[ticket.status])}>
                          {STATUS_LABELS[ticket.status]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm w-32">
                        <TicketProgressBar status={ticket.status} compact />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", PRIORITY_COLORS[ticket.priority])}>
                          {PRIORITY_LABELS[ticket.priority]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {format(new Date(ticket.createdAt), 'd MMM yyyy, HH:mm', { locale: ru })}
                      </td>
                    </tr>
                  );
                })}
                {filteredTickets.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-sm text-gray-500">
                      Нет заявок для отображения
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </FadeIn>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Ticket, Clock, CheckCircle, AlertTriangle, TrendingUp, MapPin, Wrench, ChevronRight, Calendar } from 'lucide-react';
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, cn } from '../utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { FadeIn, SlideUp, StaggerList, StaggerItem } from '../components/AnimatedComponents';

export const Dashboard = () => {
  const { currentUser, tickets, users, locations, rolePermissions } = useAppContext();
  const navigate = useNavigate();

  const currentPerms = currentUser ? rolePermissions[currentUser.role] || [] : [];

  const visibleTickets = React.useMemo(() => {
    if (!currentUser) return [];
    switch (currentUser.role) {
      case 'specialist':
        return tickets.filter(t => t.createdBy === currentUser.id);
      case 'location_manager':
        return tickets.filter(t => t.equipmentDetails.locationId === currentUser.locationId);
      case 'network_manager':
        return tickets.filter(t => {
          const loc = locations.find(l => l.id === t.equipmentDetails.locationId);
          return loc?.networkId === currentUser.networkId;
        });
      case 'engineer':
        return tickets.filter(t => t.assignedTo === currentUser.id || t.createdBy === currentUser.id);
      case 'region_manager':
      case 'operator':
      case 'admin':
        return tickets;
      default:
        return [];
    }
  }, [tickets, currentUser, locations]);

  const stats = {
    total: visibleTickets.length,
    active: visibleTickets.filter(t => !['completed', 'canceled'].includes(t.status)).length,
    completed: visibleTickets.filter(t => t.status === 'completed').length,
    highPriority: visibleTickets.filter(t => t.priority === 'high' && !['completed', 'canceled'].includes(t.status)).length,
  };

  const activeTickets = visibleTickets
    .filter(t => !['completed', 'canceled'].includes(t.status))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const chartData = [
    { name: 'Пн', tickets: 4 },
    { name: 'Вт', tickets: 3 },
    { name: 'Ср', tickets: 7 },
    { name: 'Чт', tickets: 2 },
    { name: 'Пт', tickets: 5 },
    { name: 'Сб', tickets: 1 },
    { name: 'Вс', tickets: 0 },
  ];

  const statCards = [
    { label: 'Всего заявок', value: stats.total, icon: Ticket, color: 'text-gray-400' },
    { label: 'В работе', value: stats.active, icon: Clock, color: 'text-blue-400' },
    { label: 'Выполнено', value: stats.completed, icon: CheckCircle, color: 'text-green-400' },
    { label: 'Высокий приоритет', value: stats.highPriority, icon: AlertTriangle, color: 'text-red-400' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-6">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Сводка</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {format(new Date(), 'EEEE, d MMMM yyyy', { locale: ru })}
            </p>
          </div>
          <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600 hidden sm:block" />
        </div>
      </FadeIn>

      {/* Mobile: Horizontal scroll stats */}
      <div className="sm:hidden">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="flex-shrink-0 w-36 bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl bg-white shadow-sm`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500 mt-1">{card.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop: Grid stats */}
      <div className="hidden sm:grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <FadeIn key={card.label} delay={index * 0.1}>
              <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="truncate text-sm font-medium text-gray-500">{card.label}</dt>
                        <dd className="text-2xl font-semibold text-gray-900">{card.value}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          );
        })}
      </div>

      {/* Quick Actions - Mobile only */}
      <div className="sm:hidden">
        <FadeIn delay={0.2}>
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
            <h3 className="text-sm font-semibold mb-3">Быстрые действия</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => navigate('/create-ticket')}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
              >
                <Ticket className="h-5 w-5" />
                <span className="text-xs">Заявка</span>
              </button>
              <button
                onClick={() => navigate('/map')}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
              >
                <MapPin className="h-5 w-5" />
                <span className="text-xs">Карта</span>
              </button>
              <button
                onClick={() => navigate('/tickets')}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
              >
                <Wrench className="h-5 w-5" />
                <span className="text-xs">Задачи</span>
              </button>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Mobile: Compact activity list */}
      <div className="sm:hidden">
        <FadeIn delay={0.25}>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Активные задачи</h3>
                <p className="text-xs text-gray-500 mt-0.5">{stats.active} задач в работе</p>
              </div>
              <button
                onClick={() => navigate('/tickets')}
                className="text-sm text-indigo-600 font-medium flex items-center gap-1"
              >
                Все <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {activeTickets.length > 0 ? (
                activeTickets.map((ticket, idx) => (
                  <div
                    key={ticket.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "mt-1 p-2 rounded-lg flex-shrink-0",
                        ticket.priority === 'high' ? 'bg-red-100' :
                        ticket.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                      )}>
                        <AlertTriangle className={cn(
                          "h-4 w-4",
                          ticket.priority === 'high' ? 'text-red-600' :
                          ticket.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {ticket.equipmentDetails.model}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <p className="text-xs text-gray-500 truncate">
                            {ticket.equipmentDetails.locationName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
                            STATUS_COLORS[ticket.status]
                          )}>
                            {STATUS_LABELS[ticket.status]}
                          </span>
                          <span className="text-xs text-gray-400">
                            {format(new Date(ticket.updatedAt), 'd MMM, HH:mm', { locale: ru })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Нет активных задач</p>
                </div>
              )}
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Desktop: Charts and Activity */}
      <div className="hidden sm:grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FadeIn delay={0.3}>
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Динамика заявок за неделю</h3>
              <TrendingUp className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} />
                  <Bar dataKey="tickets" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="rounded-xl bg-white shadow-sm overflow-hidden flex flex-col border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Активные задачи</h3>
              <p className="mt-1 text-sm text-gray-500">Ближайшие задачи, требующие внимания.</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              <StaggerList>
                <ul className="divide-y divide-gray-100">
                  {activeTickets.map((ticket) => (
                    <StaggerItem key={ticket.id}>
                      <li
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <p className="text-sm font-medium text-indigo-600 truncate">
                              {ticket.equipmentDetails.model}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {ticket.equipmentDetails.locationName}
                            </p>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_COLORS[ticket.status])}>
                              {STATUS_LABELS[ticket.status]}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(ticket.updatedAt), 'd MMM, HH:mm', { locale: ru })}
                            </span>
                          </div>
                        </div>
                      </li>
                    </StaggerItem>
                  ))}
                  {activeTickets.length === 0 && (
                    <li className="p-8 text-center text-sm text-gray-500">
                      Нет активных задач
                    </li>
                  )}
                </ul>
              </StaggerList>
            </div>
            {activeTickets.length > 0 && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => navigate('/tickets')}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-900 w-full text-center"
                >
                  Посмотреть все заявки
                </button>
              </div>
            )}
          </div>
        </FadeIn>
      </div>
    </div>
  );
};

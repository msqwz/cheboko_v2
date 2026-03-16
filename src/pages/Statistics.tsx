import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FadeIn } from '../components/AnimatedComponents';
import { STATUS_LABELS } from '../utils';
import { Calendar, Filter, Clock, AlertTriangle, CheckCircle, Activity, TrendingUp, MapPin } from 'lucide-react';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';

export const Statistics = () => {
  const { currentUser, tickets, users, locations, equipments, rolePermissions } = useAppContext();

  const currentPerms = currentUser ? rolePermissions[currentUser.role] || [] : [];

  // ALL hooks before conditional returns
  const [dateFrom, setDateFrom] = useState(() => format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [regionFilter, setRegionFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState('');

  if (!currentUser || !currentPerms.includes('view_statistics')) {
    return <div className="p-4 text-center text-gray-500">Доступ запрещен</div>;
  }

  const isEngineerView = currentUser.role === 'engineer';
  const isLocationManager = currentUser.role === 'location_manager';
  const isRegionManager = currentUser.role === 'region_manager';

  // Data scope filtering by role
  const scopedTickets = React.useMemo(() => {
    switch (currentUser.role) {
      case 'engineer':
        return tickets.filter(t => t.assignedTo === currentUser.id);
      case 'location_manager':
        return tickets.filter(t => t.equipmentDetails.locationId === currentUser.locationId);
      case 'network_manager':
        return tickets.filter(t => {
          const loc = locations.find(l => l.id === t.equipmentDetails.locationId);
          return loc?.networkId === currentUser.networkId;
        });
      case 'region_manager':
      case 'operator':
      case 'admin':
        return tickets;
      default:
        return [];
    }
  }, [tickets, currentUser, locations]);

  // Apply date + other filters
  const filteredTickets = React.useMemo(() => {
    let result = scopedTickets;
    if (dateFrom) {
      const from = startOfDay(new Date(dateFrom));
      result = result.filter(t => new Date(t.createdAt) >= from);
    }
    if (dateTo) {
      const to = endOfDay(new Date(dateTo));
      result = result.filter(t => new Date(t.createdAt) <= to);
    }
    if (locationFilter) result = result.filter(t => t.equipmentDetails.locationId === locationFilter);
    if (equipmentFilter) result = result.filter(t => t.equipmentId === equipmentFilter);
    return result;
  }, [scopedTickets, dateFrom, dateTo, locationFilter, equipmentFilter]);

  // Helper: compute avg time from 'opened' to 'completed' in hours
  const computeAvgResolutionTime = (tix: typeof tickets) => {
    const completedWithHistory = tix.filter(t => t.status === 'completed');
    let totalMs = 0; let count = 0;
    completedWithHistory.forEach(t => {
      const opened = t.history.find(h => h.status === 'opened');
      const completed = t.history.find(h => h.status === 'completed');
      if (opened && completed) {
        totalMs += new Date(completed.timestamp).getTime() - new Date(opened.timestamp).getTime();
        count++;
      }
    });
    return count > 0 ? (totalMs / count / (1000 * 60 * 60)).toFixed(1) : '—';
  };

  const computeMinMaxTime = (tix: typeof tickets) => {
    const times: number[] = [];
    tix.filter(t => t.status === 'completed').forEach(t => {
      const opened = t.history.find(h => h.status === 'opened');
      const completed = t.history.find(h => h.status === 'completed');
      if (opened && completed) {
        times.push(new Date(completed.timestamp).getTime() - new Date(opened.timestamp).getTime());
      }
    });
    if (times.length === 0) return { min: '—', max: '—' };
    return {
      min: (Math.min(...times) / (1000 * 60 * 60)).toFixed(1),
      max: (Math.max(...times) / (1000 * 60 * 60)).toFixed(1),
    };
  };

  // Status distribution
  const statusData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTickets.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({ name: STATUS_LABELS[status] || status, count }));
  }, [filteredTickets]);

  // Weekly chart data based on filtered range
  const chartData = React.useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'EEE', { locale: ru });
      days[d] = 0;
    }
    filteredTickets.forEach(t => {
      const d = format(new Date(t.createdAt), 'EEE', { locale: ru });
      if (d in days) days[d]++;
    });
    return Object.entries(days).map(([name, tickets]) => ({ name, tickets }));
  }, [filteredTickets]);

  // Engineer personal stats
  const engineerPersonalStats = React.useMemo(() => {
    if (!isEngineerView) return null;
    const completed = filteredTickets.filter(t => t.status === 'completed');
    const active = filteredTickets.filter(t => !['completed', 'canceled'].includes(t.status));
    return {
      total: filteredTickets.length,
      activeCount: active.length,
      completedCount: completed.length,
      avgHours: computeAvgResolutionTime(filteredTickets),
    };
  }, [filteredTickets, isEngineerView]);

  // Location manager stats
  const locationManagerStats = React.useMemo(() => {
    if (!isLocationManager) return null;
    const activeEquip = equipments.filter(e => e.locationId === currentUser.locationId);
    const completed = filteredTickets.filter(t => t.status === 'completed');
    // Downtime = total time tickets were open (created → completed)
    let downtimeMs = 0;
    filteredTickets.forEach(t => {
      const end = t.status === 'completed' ? new Date(t.updatedAt) : new Date();
      downtimeMs += end.getTime() - new Date(t.createdAt).getTime();
    });
    const downtimeHours = (downtimeMs / (1000 * 60 * 60)).toFixed(0);
    return {
      totalThisMonth: filteredTickets.length,
      completed: completed.length,
      activeEquipment: activeEquip.length,
      downtimeHours,
    };
  }, [filteredTickets, isLocationManager, equipments, currentUser]);

  // Region manager stats
  const regionManagerStats = React.useMemo(() => {
    if (!isRegionManager) return null;
    const { min, max } = computeMinMaxTime(filteredTickets);
    return {
      total: filteredTickets.length,
      completed: filteredTickets.filter(t => t.status === 'completed').length,
      active: filteredTickets.filter(t => !['completed', 'canceled'].includes(t.status)).length,
      avgHours: computeAvgResolutionTime(filteredTickets),
      minHours: min,
      maxHours: max,
    };
  }, [filteredTickets, isRegionManager]);

  // Engineer ranking (for non-engineers)
  const engineerStats = React.useMemo(() => {
    if (isEngineerView) return [];
    const engineers = users.filter(u => u.role === 'engineer');
    return engineers.map(eng => {
      const engTickets = filteredTickets.filter(t => t.assignedTo === eng.id && t.status === 'completed');
      return {
        id: eng.id, name: eng.name,
        completedCount: engTickets.length,
        avgTimeHours: computeAvgResolutionTime(engTickets.length > 0 ? engTickets : []),
      };
    }).sort((a, b) => b.completedCount - a.completedCount);
  }, [filteredTickets, users, isEngineerView]);

  return (
    <FadeIn>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {isEngineerView ? 'Мои показатели' : isLocationManager ? 'Аналитика точки' : isRegionManager ? 'Аналитика региона' : 'Статистика'}
          </h2>
        </div>

        {/* Filters panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700">
            <Filter className="h-4 w-4" />
            Фильтры отчёта
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1"><Calendar className="inline h-3 w-3 mr-1" />От</label>
              <input type="date" className="w-full rounded-lg border border-gray-300 text-sm p-2" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1"><Calendar className="inline h-3 w-3 mr-1" />До</label>
              <input type="date" className="w-full rounded-lg border border-gray-300 text-sm p-2" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            {!isEngineerView && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1"><MapPin className="inline h-3 w-3 mr-1" />Адрес</label>
                <select className="w-full rounded-lg border border-gray-300 text-sm p-2" value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
                  <option value="">Все</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Оборудование</label>
              <select className="w-full rounded-lg border border-gray-300 text-sm p-2" value={equipmentFilter} onChange={e => setEquipmentFilter(e.target.value)}>
                <option value="">Все</option>
                {equipments.map(eq => <option key={eq.id} value={eq.id}>{eq.model} ({eq.serialNumber})</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Role-specific stat cards */}
        {/* Engineer view */}
        {isEngineerView && engineerPersonalStats && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Всего заявок', value: engineerPersonalStats.total, icon: Activity, color: 'text-gray-600' },
              { label: 'В работе', value: engineerPersonalStats.activeCount, icon: AlertTriangle, color: 'text-amber-600' },
              { label: 'Выполнено', value: engineerPersonalStats.completedCount, icon: CheckCircle, color: 'text-green-600' },
              { label: 'Ср. время (ч)', value: engineerPersonalStats.avgHours, icon: Clock, color: 'text-indigo-600' },
            ].map((card, idx) => (
              <FadeIn key={card.label} delay={idx * 0.1}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                    <p className="text-xs font-medium text-gray-500">{card.label}</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        )}

        {/* Location manager view */}
        {isLocationManager && locationManagerStats && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Заявок за период', value: locationManagerStats.totalThisMonth, icon: Activity, color: 'text-indigo-600' },
              { label: 'Выполнено', value: locationManagerStats.completed, icon: CheckCircle, color: 'text-green-600' },
              { label: 'Оборудования', value: locationManagerStats.activeEquipment, icon: TrendingUp, color: 'text-blue-600' },
              { label: 'Простой (ч)', value: locationManagerStats.downtimeHours, icon: Clock, color: 'text-red-600' },
            ].map((card, idx) => (
              <FadeIn key={card.label} delay={idx * 0.1}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                    <p className="text-xs font-medium text-gray-500">{card.label}</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        )}

        {/* Region manager view */}
        {isRegionManager && regionManagerStats && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[
              { label: 'Всего заявок', value: regionManagerStats.total, icon: Activity },
              { label: 'Активных', value: regionManagerStats.active, icon: AlertTriangle },
              { label: 'Ср. время (ч)', value: regionManagerStats.avgHours, icon: Clock },
              { label: 'Мин. время (ч)', value: regionManagerStats.minHours, icon: TrendingUp },
              { label: 'Макс. время (ч)', value: regionManagerStats.maxHours, icon: TrendingUp },
            ].map((card, idx) => (
              <FadeIn key={card.label} delay={idx * 0.1}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <card.icon className="h-4 w-4 text-indigo-600" />
                    <p className="text-xs font-medium text-gray-500">{card.label}</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        )}

        {/* General stat cards for admin/operator/network_manager */}
        {!isEngineerView && !isLocationManager && !isRegionManager && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Всего заявок', value: filteredTickets.length },
              { label: 'Активных', value: filteredTickets.filter(t => !['completed','canceled'].includes(t.status)).length },
              { label: 'Выполнено', value: filteredTickets.filter(t => t.status === 'completed').length },
              { label: 'Ср. время (ч)', value: computeAvgResolutionTime(filteredTickets) },
            ].map((card, idx) => (
              <FadeIn key={card.label} delay={idx * 0.1}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
                  <p className="text-xs font-medium text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FadeIn delay={0.2}>
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Динамика заявок за неделю</h3>
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

          <FadeIn delay={0.3}>
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Распределение по статусам</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{ fill: '#f3f4f6' }} />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Engineer ranking table (not shown to engineers) */}
        {!isEngineerView && engineerStats.length > 0 && (
          <FadeIn delay={0.4}>
            <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Рейтинг инженеров</h3>
              </div>
              <div className="block sm:hidden divide-y divide-gray-100">
                {engineerStats.map((stat) => (
                  <div key={stat.id} className="p-4">
                    <p className="font-medium text-gray-900">{stat.name}</p>
                    <div className="flex gap-4 mt-1 text-sm text-gray-500">
                      <span>Выполнено: <strong className="text-gray-900">{stat.completedCount}</strong></span>
                      <span>Ср. время: <strong className="text-gray-900">{stat.avgTimeHours}ч</strong></span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Инженер</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Выполнено заявок</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Среднее время (часы)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {engineerStats.map((stat) => (
                      <tr key={stat.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stat.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.completedCount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.avgTimeHours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </FadeIn>
        )}
      </div>
    </FadeIn>
  );
};

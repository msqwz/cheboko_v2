import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { FadeIn } from '../components/AnimatedComponents';
import { Wrench, Calendar, Gauge, Droplet, MapPin, Building, CheckCircle, Clock, Filter, Search, PlusCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '../utils';
import type { MaintenanceRecord, MaintenanceStatus } from '../types';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

const STATUS_LABELS: Record<MaintenanceStatus, string> = {
  completed: 'Выполнено',
  recommended: 'Рекомендовано',
};

const STATUS_COLORS: Record<MaintenanceStatus, string> = {
  completed: 'bg-green-100 text-green-800 border-green-200',
  recommended: 'bg-blue-100 text-blue-800 border-blue-200',
};

export const MaintenancePage = () => {
  const { currentUser, maintenanceRecords, users, rolePermissions, equipments } = useAppContext();
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Form state
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDrinksCount, setNewDrinksCount] = useState('');
  const [newCleaningCount, setNewCleaningCount] = useState('');
  const [newStatus, setNewStatus] = useState<MaintenanceStatus>('completed');

  const currentPerms = currentUser ? rolePermissions[currentUser.role] || [] : [];
  const canManage = currentPerms.includes('manage_equipment') || currentUser.role === 'admin';

  if (!currentUser || !currentPerms.includes('view_maintenance')) {
    return <div className="p-4 text-center text-gray-500">Доступ запрещен</div>;
  }

  // Filter records
  const filteredRecords = useMemo(() => {
    let result = maintenanceRecords || [];

    if (statusFilter) {
      result = result.filter(r => r.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.locationName.toLowerCase().includes(query) ||
        r.address.toLowerCase().includes(query) ||
        r.equipmentDetails.model.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query)
      );
    }

    return [...result].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }, [maintenanceRecords, statusFilter, searchQuery]);

  const stats = useMemo(() => ({
    total: (maintenanceRecords || []).length,
    completed: (maintenanceRecords || []).filter(r => r.status === 'completed').length,
    recommended: (maintenanceRecords || []).filter(r => r.status === 'recommended').length,
  }), [maintenanceRecords]);

  const handleAddMaintenance = () => {
    if (!selectedEquipmentId || !newDescription) return;
    
    const equipment = equipments.find(eq => eq.id === selectedEquipmentId);
    if (!equipment) return;

    // В реальном приложении здесь был бы вызов API
    console.log('Добавление ТО:', {
      equipmentId: selectedEquipmentId,
      description: newDescription,
      drinksCount: parseInt(newDrinksCount) || 0,
      cleaningCount: parseInt(newCleaningCount) || 0,
      status: newStatus,
    });

    setIsAddModalOpen(false);
    setSelectedEquipmentId('');
    setNewDescription('');
    setNewDrinksCount('');
    setNewCleaningCount('');
    setNewStatus('completed');
  };

  return (
    <FadeIn>
      <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Wrench className="h-6 w-6 sm:h-7 sm:w-7 text-indigo-600" />
              Техническое обслуживание
            </h2>
            <p className="text-sm text-gray-500 mt-1">Реестр выполненных и запланированных регламентных работ</p>
          </div>
          {canManage && (
            <Button onClick={() => setIsAddModalOpen(true)} className="sm:w-auto w-full">
              <PlusCircle className="h-4 w-4 mr-2" />
              Добавить ТО
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Wrench className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Всего записей</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Выполнено</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Рекомендовано</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recommended}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Поиск: объект, оборудование..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Status filter */}
            <div className="sm:w-40">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as MaintenanceStatus | '')}
              >
                <option value="">Все статусы</option>
                <option value="completed">Выполнено</option>
                <option value="recommended">Рекомендовано</option>
              </select>
            </div>
          </div>
        </div>

        {/* Records Table - Desktop */}
        <div className="hidden sm:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Объект</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Оборудование</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Описание работ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Gauge className="h-4 w-4 inline" />
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Droplet className="h-4 w-4 inline" />
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      <Wrench className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>Записи о техническом обслуживании не найдены</p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{record.locationName}</p>
                            <p className="text-xs text-gray-500">{record.address}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-900">{record.equipmentDetails.model}</p>
                        <p className="text-xs text-gray-500">S/N: {record.equipmentDetails.serialNumber}</p>
                      </td>
                      <td className="px-4 py-4 max-w-xs">
                        <p className="text-sm text-gray-700 line-clamp-2">{record.description}</p>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {format(new Date(record.completedAt), 'dd.MM.yyyy', { locale: ru })}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700">
                          {record.drinksCount}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                          {record.cleaningCount}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
                          STATUS_COLORS[record.status]
                        )}>
                          {record.status === 'completed' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {STATUS_LABELS[record.status]}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile: Card List */}
        <div className="sm:hidden space-y-3">
          {filteredRecords.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
              <Wrench className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Записи не найдены</p>
            </div>
          ) : (
            filteredRecords.map((record) => (
              <div key={record.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <p className="text-sm font-medium text-gray-900">{record.locationName}</p>
                    </div>
                    <p className="text-xs text-gray-500">{record.address}</p>
                  </div>
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                    STATUS_COLORS[record.status]
                  )}>
                    {STATUS_LABELS[record.status]}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Оборудование</p>
                    <p className="text-sm font-medium text-gray-900">{record.equipmentDetails.model}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Работы</p>
                    <p className="text-sm text-gray-700">{record.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(record.completedAt), 'dd.MM.yy', { locale: ru })}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                        <Gauge className="h-3 w-3" />
                        {record.drinksCount}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">
                        <Droplet className="h-3 w-3" />
                        {record.cleaningCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="hidden sm:block bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Wrench className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-indigo-900">О разделе</h4>
              <p className="text-sm text-indigo-700 mt-1">
                Здесь отображаются записи о проведённом техническом обслуживании оборудования.
              </p>
            </div>
          </div>
        </div>

        {/* Add Maintenance Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Добавить ТО"
          description="Внесите данные о техническом обслуживании"
          confirmText="Сохранить"
          cancelText="Отмена"
          onConfirm={handleAddMaintenance}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Оборудование
              </label>
              <select
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5"
                value={selectedEquipmentId}
                onChange={(e) => setSelectedEquipmentId(e.target.value)}
              >
                <option value="">Выберите оборудование</option>
                {equipments.map(eq => (
                  <option key={eq.id} value={eq.id}>
                    {eq.model} ({eq.locationName})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Статус
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewStatus('completed')}
                  className={cn(
                    "px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors",
                    newStatus === 'completed'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  )}
                >
                  Выполнено
                </button>
                <button
                  type="button"
                  onClick={() => setNewStatus('recommended')}
                  className={cn(
                    "px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors",
                    newStatus === 'recommended'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  )}
                >
                  Рекомендовано
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание работ
              </label>
              <textarea
                rows={3}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5"
                placeholder="Замена прокладок, чистка бойлера..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Gauge className="h-4 w-4 inline mr-1" />
                  Счётчик напитков
                </label>
                <input
                  type="number"
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5"
                  placeholder="0"
                  value={newDrinksCount}
                  onChange={(e) => setNewDrinksCount(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Droplet className="h-4 w-4 inline mr-1" />
                  Счётчик очисток
                </label>
                <input
                  type="number"
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5"
                  placeholder="0"
                  value={newCleaningCount}
                  onChange={(e) => setNewCleaningCount(e.target.value)}
                />
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </FadeIn>
  );
};

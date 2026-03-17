import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { FadeIn } from '../components/AnimatedComponents';
import { 
  ArrowLeft, Wrench, Calendar, Gauge, Droplet, MapPin, Building, 
  CheckCircle, ClipboardList, History, PlusCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '../utils';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import type { MaintenanceRecord } from '../types';

export const EquipmentCard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    currentUser, equipments, locations, maintenanceRecords, 
    tickets, rolePermissions 
  } = useAppContext();

  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [drinksCount, setDrinksCount] = useState('');
  const [cleaningCount, setCleaningCount] = useState('');
  const [maintenanceDescription, setMaintenanceDescription] = useState('');

  const currentPerms = currentUser ? rolePermissions[currentUser.role] || [] : [];

  if (!currentUser || !currentPerms.includes('view_equipment')) {
    return <div className="p-4 text-center text-gray-500">Доступ запрещен</div>;
  }

  const equipment = equipments.find(eq => eq.id === id);
  const location = locations.find(loc => loc.id === equipment?.locationId);
  const equipmentTickets = tickets.filter(t => t.equipmentId === id);
  const equipmentMaintenance = maintenanceRecords
    .filter(m => m.equipmentId === id)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  const lastMaintenance = equipmentMaintenance[0];
  const isEngineer = currentUser.role === 'engineer';

  const handleMaintenanceSubmit = () => {
    if (!equipment || !drinksCount || !cleaningCount) return;

    // В реальном приложении здесь был бы вызов API
    console.log('Проведение ТО:', {
      equipmentId: equipment.id,
      drinksCount: parseInt(drinksCount),
      cleaningCount: parseInt(cleaningCount),
      description: maintenanceDescription,
    });

    setIsMaintenanceModalOpen(false);
    setDrinksCount('');
    setCleaningCount('');
    setMaintenanceDescription('');
  };

  if (!equipment) {
    return (
      <div className="p-8 text-center">
        <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Оборудование не найдено</p>
        <Button onClick={() => navigate('/equipment')} className="mt-4">
          К оборудованию
        </Button>
      </div>
    );
  }

  return (
    <FadeIn>
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {equipment.model}
            </h2>
            <p className="text-sm text-gray-500">S/N: {equipment.serialNumber}</p>
          </div>
        </div>

        {/* Location Info */}
        {location && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <MapPin className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{location.name}</p>
                <p className="text-sm text-white/80 mt-1">{location.address}</p>
                <p className="text-xs text-white/70 mt-1">{location.legalEntity}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="h-5 w-5 text-indigo-600" />
              <span className="text-sm font-medium text-gray-600">Заявок</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{equipmentTickets.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">ТО проведено</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{equipmentMaintenance.length}</p>
          </div>
        </div>

        {/* Last Maintenance */}
        {lastMaintenance && (
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Последнее ТО
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>
                  {format(new Date(lastMaintenance.completedAt), 'dd MMMM yyyy', { locale: ru })}
                </span>
              </div>
              <p className="text-sm text-gray-700">{lastMaintenance.description}</p>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm text-gray-600">
                    Напитки: <strong>{lastMaintenance.drinksCount}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Droplet className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">
                    Очистки: <strong>{lastMaintenance.cleaningCount}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Maintenance History */}
        {equipmentMaintenance.length > 0 && (
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-gray-600" />
              История ТО
            </h3>
            <div className="space-y-3">
              {equipmentMaintenance.slice(1, 5).map((record, idx) => (
                <div
                  key={record.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg',
                    idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                  )}
                >
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(record.completedAt), 'dd.MM.yyyy', { locale: ru })}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{record.description}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Gauge className="h-3 w-3" /> {record.drinksCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Droplet className="h-3 w-3" /> {record.cleaningCount}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tickets */}
        {equipmentTickets.length > 0 && (
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-indigo-600" />
              Заявки
            </h3>
            <div className="space-y-2">
              {equipmentTickets.slice(0, 5).map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">#{ticket.id}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(ticket.createdAt), 'dd.MM.yyyy', { locale: ru })}
                    </p>
                  </div>
                  <span className={cn(
                    "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium",
                    ticket.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  )}>
                    {ticket.status === 'completed' ? 'Выполнена' : 'В работе'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Engineer Action Button */}
        {isEngineer && (
          <div className="fixed bottom-20 left-0 right-0 px-4 sm:hidden">
            <Button
              onClick={() => setIsMaintenanceModalOpen(true)}
              className="w-full shadow-lg"
              size="lg"
            >
              <Wrench className="h-5 w-5 mr-2" />
              Провести ТО
            </Button>
          </div>
        )}

        {/* Desktop Action */}
        {isEngineer && (
          <div className="hidden sm:block">
            <Button
              onClick={() => setIsMaintenanceModalOpen(true)}
              className="w-full"
              size="lg"
            >
              <Wrench className="h-5 w-5 mr-2" />
              Провести ТО
            </Button>
          </div>
        )}

        {/* Maintenance Modal */}
        <Modal
          isOpen={isMaintenanceModalOpen}
          onClose={() => setIsMaintenanceModalOpen(false)}
          title="Проведение ТО"
          description="Внесите показания счётчиков"
          confirmText="Завершить ТО"
          cancelText="Отмена"
          onConfirm={handleMaintenanceSubmit}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Gauge className="h-4 w-4 inline mr-1" />
                Счётчик напитков
              </label>
              <input
                type="number"
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5"
                placeholder="0"
                value={drinksCount}
                onChange={(e) => setDrinksCount(e.target.value)}
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
                value={cleaningCount}
                onChange={(e) => setCleaningCount(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание работ
              </label>
              <textarea
                rows={3}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5"
                placeholder="Замена прокладок, чистка бойлера..."
                value={maintenanceDescription}
                onChange={(e) => setMaintenanceDescription(e.target.value)}
              />
            </div>
          </div>
        </Modal>
      </div>
    </FadeIn>
  );
};

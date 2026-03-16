import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Building } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

export const Clients = () => {
  const { currentUser, locations, addLocation, equipments, tickets, rolePermissions } = useAppContext();
  const [isLocModalOpen, setIsLocModalOpen] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [newLocLegal, setNewLocLegal] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const currentPerms = currentUser ? rolePermissions[currentUser.role] || [] : [];

  if (!currentUser || !currentPerms.includes('view_clients')) {
    return <div>Доступ запрещен</div>;
  }

  const canManage = currentPerms.includes('manage_clients');

  const handleAddLocation = () => {
    if (newLocName && newLocAddress && newLocLegal) {
      addLocation({
        name: newLocName,
        address: newLocAddress,
        legalEntity: newLocLegal,
        lat: 55.75 + Math.random() * 0.1, // Mock coordinates
        lng: 37.61 + Math.random() * 0.1
      });
      setIsLocModalOpen(false);
      setNewLocName('');
      setNewLocAddress('');
      setNewLocLegal('');
    }
  };

  const selectedLocDetails = locations.find(l => l.id === selectedLocation);
  const locEquipments = equipments.filter(e => e.locationId === selectedLocation);
  const locTickets = tickets.filter(t => t.equipmentDetails.locationId === selectedLocation);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Клиенты (Точки)</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg overflow-hidden h-fit">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <Building className="h-5 w-5 mr-2 text-gray-400" />
              Список точек
            </h3>
            {canManage && (
              <button 
                onClick={() => setIsLocModalOpen(true)}
                className="text-sm text-indigo-600 hover:text-indigo-900 font-medium"
              >
                Добавить
              </button>
            )}
          </div>
          <ul className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {locations.map(loc => (
              <li 
                key={loc.id} 
                className={`px-4 py-4 sm:px-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 ${selectedLocation === loc.id ? 'bg-indigo-50' : ''}`}
                onClick={() => setSelectedLocation(loc.id)}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate">{loc.name}</p>
                  <p className="text-xs text-gray-500">{loc.address}</p>
                </div>
                <div className="text-sm text-gray-500 text-right">
                  <p className="text-xs">{loc.legalEntity}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {selectedLocDetails && (
          <div className="bg-white shadow rounded-lg overflow-hidden h-fit">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Детали: {selectedLocDetails.name}
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Оборудование ({locEquipments.length})</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {locEquipments.map(eq => (
                    <li key={eq.id}>• {eq.model} (S/N: {eq.serialNumber})</li>
                  ))}
                  {locEquipments.length === 0 && <li>Нет оборудования</li>}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Заявки ({locTickets.length})</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {locTickets.map(t => (
                    <li key={t.id}>• {t.description} ({t.status})</li>
                  ))}
                  {locTickets.length === 0 && <li>Нет заявок</li>}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isLocModalOpen}
        onClose={() => setIsLocModalOpen(false)}
        title="Добавить точку клиента"
        onConfirm={handleAddLocation}
        confirmText="Добавить"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название точки</label>
            <Input value={newLocName} onChange={e => setNewLocName(e.target.value)} placeholder="Кофейня на Ленина" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Адрес</label>
            <Input value={newLocAddress} onChange={e => setNewLocAddress(e.target.value)} placeholder="ул. Ленина, 1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Юр. лицо</label>
            <Input value={newLocLegal} onChange={e => setNewLocLegal(e.target.value)} placeholder="ООО Ромашка" />
          </div>
        </div>
      </Modal>
    </div>
  );
};

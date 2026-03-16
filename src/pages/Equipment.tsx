import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { Building } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

export const Equipment = () => {
  const { currentUser, equipments, locations, addEquipment, rolePermissions } = useAppContext();
  const [isEqModalOpen, setIsEqModalOpen] = useState(false);
  const [newEqModel, setNewEqModel] = useState('');
  const [newEqSerial, setNewEqSerial] = useState('');
  const [newEqLocationId, setNewEqLocationId] = useState('');

  const currentPerms = currentUser ? rolePermissions[currentUser.role] || [] : [];

  if (!currentUser || !currentPerms.includes('view_equipment')) {
    return <div>Доступ запрещен</div>;
  }

  const canManage = currentPerms.includes('manage_equipment');

  const handleAddEquipment = () => {
    if (newEqModel && newEqSerial && newEqLocationId) {
      const loc = locations.find(l => l.id === newEqLocationId);
      if (loc) {
        addEquipment({
          model: newEqModel,
          serialNumber: newEqSerial,
          locationId: loc.id,
          locationName: loc.name,
          legalEntity: loc.legalEntity
        });
        setIsEqModalOpen(false);
        setNewEqModel('');
        setNewEqSerial('');
        setNewEqLocationId('');
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Оборудование</h2>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <Building className="h-5 w-5 mr-2 text-gray-400" />
            Оборудование
          </h3>
          {canManage && (
            <button 
              onClick={() => setIsEqModalOpen(true)}
              className="text-sm text-indigo-600 hover:text-indigo-900 font-medium"
            >
              Добавить
            </button>
          )}
        </div>
        <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {equipments.map(eq => (
            <li key={eq.id} className="px-4 py-4 sm:px-6 flex items-center justify-between">
              <div>
                <Link to={`/equipment/${eq.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-900 truncate block">{eq.model}</Link>
                <p className="text-xs text-gray-500">S/N: {eq.serialNumber}</p>
              </div>
              <div className="text-sm text-gray-500 text-right">
                <p>{eq.locationName}</p>
                <p className="text-xs">{eq.legalEntity}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Modal
        isOpen={isEqModalOpen}
        onClose={() => setIsEqModalOpen(false)}
        title="Добавить оборудование"
        onConfirm={handleAddEquipment}
        confirmText="Добавить"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Модель</label>
            <Input value={newEqModel} onChange={e => setNewEqModel(e.target.value)} placeholder="La Marzocco..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Серийный номер</label>
            <Input value={newEqSerial} onChange={e => setNewEqSerial(e.target.value)} placeholder="SN-12345" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Точка (Локация)</label>
            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              value={newEqLocationId}
              onChange={e => setNewEqLocationId(e.target.value)}
            >
              <option value="">Выберите точку...</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name} ({loc.address})</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

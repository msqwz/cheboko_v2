import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { ROLE_LABELS } from '../utils';
import { Users } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Role } from '../types';

export const Employees = () => {
  const { currentUser, users, addUser, rolePermissions } = useAppContext();
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('specialist');
  const [newUserLocation, setNewUserLocation] = useState('');

  const currentPerms = currentUser ? rolePermissions[currentUser.role] || [] : [];

  if (!currentUser || !currentPerms.includes('view_employees')) {
    return <div>Доступ запрещен</div>;
  }

  const canManage = currentPerms.includes('manage_employees');

  const handleAddUser = () => {
    if (newUserName) {
      addUser({
        name: newUserName,
        role: newUserRole,
        locationId: newUserLocation || undefined,
        networkId: currentUser.role === 'network_manager' ? currentUser.networkId : undefined
      });
      setIsUserModalOpen(false);
      setNewUserName('');
    }
  };

  const visibleUsers = currentUser.role === 'network_manager' 
    ? users.filter(u => u.networkId === currentUser.networkId)
    : users;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Сотрудники</h2>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2 text-gray-400" />
            Пользователи
          </h3>
          {canManage && (
            <button 
              onClick={() => setIsUserModalOpen(true)}
              className="text-sm text-indigo-600 hover:text-indigo-900 font-medium"
            >
              Добавить
            </button>
          )}
        </div>
        <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {visibleUsers.map(user => (
            <li key={user.id} className="px-4 py-4 sm:px-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600 truncate">{user.name}</p>
                <p className="text-sm text-gray-500">{ROLE_LABELS[user.role]}</p>
              </div>
              <div className="text-sm text-gray-500">
                {user.locationId ? 'Точка' : user.networkId ? 'Сеть' : 'Сервис'}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title="Добавить пользователя"
        onConfirm={handleAddUser}
        confirmText="Добавить"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
            <Input value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Иван Иванов" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
            <select 
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              value={newUserRole}
              onChange={e => setNewUserRole(e.target.value as Role)}
            >
              {Object.entries(ROLE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Локация (опционально)</label>
            <Input value={newUserLocation} onChange={e => setNewUserLocation(e.target.value)} placeholder="ID локации" />
          </div>
        </div>
      </Modal>
    </div>
  );
};

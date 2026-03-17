import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { ROLE_LABELS } from '../utils';
import { Users, Edit2 } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Role, User } from '../types';

export const Employees = () => {
  const { currentUser, users, addUser, rolePermissions } = useAppContext();
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('specialist');
  const [newUserLocation, setNewUserLocation] = useState('');

  const currentPerms = currentUser ? rolePermissions[currentUser.role] || [] : [];

  if (!currentUser || !currentPerms.includes('view_employees')) {
    return <div>Доступ запрещен</div>;
  }

  const canManage = currentPerms.includes('manage_employees');

  const handleAddUser = () => {
    if (newUserName && newUserEmail) {
      addUser({
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        locationId: newUserLocation || undefined,
        networkId: currentUser.role === 'network_manager' ? currentUser.networkId : undefined
      });
      setIsUserModalOpen(false);
      setNewUserName('');
      setNewUserEmail('');
    }
  };

  const handleEditUser = () => {
    if (editingUser && editFirstName && editLastName) {
      // В реальном приложении здесь был бы вызов API
      console.log('Обновление пользователя:', {
        id: editingUser.id,
        name: `${editFirstName} ${editLastName}`
      });
      setIsEditModalOpen(false);
      setEditingUser(null);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    const nameParts = user.name.split(' ');
    setEditFirstName(nameParts[0] || '');
    setEditLastName(nameParts.slice(1).join(' ') || '');
    setIsEditModalOpen(true);
  };

  // Показываем всех пользователей: зарегистрированных, приглашённых и администраторов
  const visibleUsers = currentUser.role === 'network_manager'
    ? users.filter(u => u.networkId === currentUser.networkId)
    : users;

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Сотрудники</h2>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2 text-gray-400" />
            Пользователи ({visibleUsers.length})
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
        <ul className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
          {visibleUsers.map(user => (
            <li key={user.id} className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-gray-50">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-indigo-600 truncate">{user.name}</p>
                  {user.role === 'admin' && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                      Админ
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-gray-500">{ROLE_LABELS[user.role]}</p>
                  {user.email && (
                    <>
                      <span className="text-gray-300">•</span>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </>
                  )}
                </div>
              </div>
              {canManage && user.role !== 'admin' && (
                <button
                  onClick={() => openEditModal(user)}
                  className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setNewUserName('');
          setNewUserEmail('');
        }}
        title="Добавить сотрудника"
        onConfirm={handleAddUser}
        confirmText="Добавить"
        isConfirmDisabled={!newUserName || !newUserEmail}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ФИО</label>
            <Input value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Иванов Иван" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input 
              type="email" 
              value={newUserEmail} 
              onChange={e => setNewUserEmail(e.target.value)} 
              placeholder="ivan@example.com" 
            />
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

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        title="Редактирование сотрудника"
        description="Изменение имени и фамилии"
        confirmText="Сохранить"
        cancelText="Отмена"
        onConfirm={handleEditUser}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
            <Input 
              value={editFirstName} 
              onChange={e => setEditFirstName(e.target.value)} 
              placeholder="Иван" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
            <Input 
              value={editLastName} 
              onChange={e => setEditLastName(e.target.value)} 
              placeholder="Иванов" 
            />
          </div>
          {editingUser && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Роль</p>
              <p className="text-sm font-medium text-gray-900">{ROLE_LABELS[editingUser.role]}</p>
              {editingUser.email && (
                <p className="text-xs text-gray-500 mt-1">{editingUser.email}</p>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

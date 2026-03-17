import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Settings as SettingsIcon, Shield, CheckCircle } from 'lucide-react';
import { Role, Permission } from '../types';
import { ROLE_LABELS } from '../utils';
import { FadeIn } from '../components/AnimatedComponents';
import { Button } from '../components/ui/Button';

const AVAILABLE_PERMISSIONS: { id: Permission; label: string }[] = [
  { id: 'view_dashboard', label: 'Просмотр дашборда' },
  { id: 'view_tickets', label: 'Просмотр заявок' },
  { id: 'create_ticket', label: 'Создание заявок' },
  { id: 'edit_ticket', label: 'Редактирование заявок' },
  { id: 'delete_ticket', label: 'Удаление заявок' },
  { id: 'view_equipment', label: 'Просмотр оборудования' },
  { id: 'manage_equipment', label: 'Управление оборудованием' },
  { id: 'view_clients', label: 'Просмотр клиентов' },
  { id: 'manage_clients', label: 'Управление клиентами' },
  { id: 'view_employees', label: 'Просмотр сотрудников' },
  { id: 'manage_employees', label: 'Управление сотрудниками' },
  { id: 'view_statistics', label: 'Просмотр статистики' },
  { id: 'manage_settings', label: 'Управление настройками' },
  { id: 'view_map', label: 'Просмотр карты' },
  { id: 'manage_invites', label: 'Управление приглашениями' },
  { id: 'view_maintenance', label: 'Просмотр ТО' },
  { id: 'scan_qr', label: 'Сканирование QR' },
];

export const Settings = () => {
  const { currentUser, rolePermissions, updateRolePermissions } = useAppContext();
  const [selectedRole, setSelectedRole] = useState<Role>('specialist');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const currentPerms = currentUser ? rolePermissions[currentUser.role] || [] : [];

  if (!currentUser || !currentPerms.includes('manage_settings')) {
    return <div>Доступ запрещен</div>;
  }

  const handlePermissionToggle = (permission: Permission) => {
    const currentPerms = rolePermissions[selectedRole] || [];
    const newPerms = currentPerms.includes(permission)
      ? currentPerms.filter(p => p !== permission)
      : [...currentPerms, permission];

    updateRolePermissions(selectedRole, newPerms);
    setHasUnsavedChanges(true);
  };

  const handleSavePermissions = () => {
    // В реальном приложении здесь была бы отправка на сервер
    setHasUnsavedChanges(false);
  };

  return (
    <FadeIn>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Настройки</h2>

        <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
          <div className="flex items-center mb-4">
            <Shield className="h-6 w-6 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Права доступа ролей</h3>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Выберите роль для настройки</label>
            <select
              className="block w-full max-w-md rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as Role)}
            >
              {Object.entries(ROLE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Разрешения для роли: {ROLE_LABELS[selectedRole]}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {AVAILABLE_PERMISSIONS.map((perm) => {
                const isGranted = rolePermissions[selectedRole]?.includes(perm.id);
                return (
                  <div key={perm.id} className="relative flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        id={`perm-${perm.id}`}
                        name={`perm-${perm.id}`}
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={isGranted}
                        onChange={() => handlePermissionToggle(perm.id)}
                        disabled={selectedRole === 'admin'}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor={`perm-${perm.id}`} className="font-medium text-gray-700 cursor-pointer">
                        {perm.label}
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
            {selectedRole === 'admin' && (
              <p className="mt-4 text-sm text-amber-600">
                * Права администратора не могут быть изменены.
              </p>
            )}
            {hasUnsavedChanges && selectedRole !== 'admin' && (
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Есть несохранённые изменения
                </p>
                <Button onClick={handleSavePermissions} size="sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Сохранить изменения
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </FadeIn>
  );
};

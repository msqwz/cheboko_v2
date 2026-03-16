import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { ROLE_LABELS } from '../utils';
import { Role } from '../types';
import { Button } from '../components/ui/Button';
import { FadeIn, SlideUp } from '../components/AnimatedComponents';
import { Link2, Plus, Trash2, Copy, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const INVITABLE_ROLES: Role[] = ['specialist', 'location_manager', 'engineer'];

export const InviteManagement = () => {
  const { currentUser, invites, createInvite, revokeInvite, users, rolePermissions } = useAppContext();
  const [selectedRole, setSelectedRole] = useState<Role>('specialist');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const currentPerms = currentUser ? rolePermissions[currentUser.role] || [] : [];

  if (!currentUser || !currentPerms.includes('manage_invites')) {
    return <div className="text-center py-8 text-gray-500">Доступ запрещен</div>;
  }

  const handleCreate = () => {
    createInvite(selectedRole);
  };

  const handleCopy = (token: string, id: string) => {
    const url = `${window.location.origin}/invite?token=${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const sortedInvites = [...invites].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <FadeIn>
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Link2 className="h-6 w-6 text-indigo-500" />
              Приглашения
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Создавайте одноразовые ссылки для регистрации Специалистов, Управляющих и Инженеров
            </p>
          </div>
        </div>

        {/* Create invite */}
        <div className="bg-white shadow rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Создать приглашение</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              className="block w-full sm:w-64 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5"
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value as Role)}
            >
              {INVITABLE_ROLES.map(role => (
                <option key={role} value={role}>{ROLE_LABELS[role]}</option>
              ))}
            </select>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Создать приглашение
            </Button>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            Ссылка действительна 24 часа и сгорает после первого использования.
          </p>
        </div>

        {/* Invites list */}
        <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">
              Все приглашения ({invites.length})
            </h3>
          </div>

          {sortedInvites.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              Приглашения ещё не создавались
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {sortedInvites.map((invite) => {
                const creator = users.find(u => u.id === invite.createdBy);
                const usedByUser = invite.usedBy ? users.find(u => u.id === invite.usedBy) : null;
                const isExpired = new Date(invite.expiresAt) < new Date();
                const isUsed = !!invite.usedBy;
                const isActive = invite.isActive && !isExpired && !isUsed;

                return (
                  <SlideUp key={invite.id}>
                    <li className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {ROLE_LABELS[invite.role]}
                            </span>
                            {isActive && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 border border-green-200">
                                <CheckCircle className="h-3 w-3" /> Активна
                              </span>
                            )}
                            {isUsed && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
                                <CheckCircle className="h-3 w-3" /> Использована
                              </span>
                            )}
                            {isExpired && !isUsed && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 border border-gray-200">
                                <Clock className="h-3 w-3" /> Истекла
                              </span>
                            )}
                            {!invite.isActive && !isUsed && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 border border-red-200">
                                <XCircle className="h-3 w-3" /> Отозвана
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 font-mono truncate">
                            {invite.token}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Создано: {creator?.name || 'Неизвестно'} • {format(new Date(invite.createdAt), 'd MMM HH:mm', { locale: ru })}
                            {' • '}Истекает: {format(new Date(invite.expiresAt), 'd MMM HH:mm', { locale: ru })}
                          </p>
                          {usedByUser && (
                            <p className="text-xs text-blue-600 mt-1">
                              Использовано: {usedByUser.name}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isActive && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopy(invite.token, invite.id)}
                              >
                                {copiedId === invite.id ? (
                                  <><CheckCircle className="h-3.5 w-3.5 mr-1 text-green-500" /> Скопировано</>
                                ) : (
                                  <><Copy className="h-3.5 w-3.5 mr-1" /> Копировать</>
                                )}
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => revokeInvite(invite.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </li>
                  </SlideUp>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </FadeIn>
  );
};

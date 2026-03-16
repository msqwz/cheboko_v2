import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { ROLE_LABELS } from '../utils';
import { User, Mail, MapPin, Shield, Building, Phone, Edit3, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FadeIn } from '../components/AnimatedComponents';
import { OnlineStatusBadge } from '../components/OfflineIndicator';

export const Profile = () => {
  const { currentUser, locations } = useAppContext();

  if (!currentUser) return <div className="p-4 text-center text-gray-500">Пожалуйста, войдите в систему</div>;

  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState('+7 (999) 123-45-67');
  const [editPhone, setEditPhone] = useState(phone);

  const userLocation = currentUser.locationId ? locations.find(l => l.id === currentUser.locationId) : null;

  const handleSave = () => {
    setPhone(editPhone);
    setIsEditing(false);
  };

  const infoItems = [
    { icon: User, label: 'ФИО', value: currentUser.name },
    { icon: Shield, label: 'Роль', value: ROLE_LABELS[currentUser.role] },
    { icon: Mail, label: 'Email', value: currentUser.email || 'Не указан' },
    { icon: Phone, label: 'Телефон', value: phone, editable: true },
    ...(userLocation ? [{ icon: MapPin, label: 'Точка', value: userLocation.name }] : []),
    ...(userLocation ? [{ icon: Building, label: 'Адрес', value: userLocation.address }] : []),
    ...(currentUser.networkId ? [{ icon: Building, label: 'Сеть', value: currentUser.networkId }] : []),
    ...(currentUser.regionId ? [{ icon: MapPin, label: 'Регион', value: currentUser.regionId }] : []),
  ];

  return (
    <FadeIn>
      <div className="space-y-6 max-w-2xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Профиль</h2>

        {/* Avatar + name card */}
        <FadeIn delay={0.1}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{currentUser.name}</h3>
                <p className="text-sm text-gray-500">{ROLE_LABELS[currentUser.role]}</p>
                <div className="mt-1">
                  <OnlineStatusBadge />
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Personal info */}
        <FadeIn delay={0.2}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Персональная информация</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              >
                {isEditing ? <><Check className="h-3.5 w-3.5 mr-1" />Сохранить</> : <><Edit3 className="h-3.5 w-3.5 mr-1" />Редактировать</>}
              </Button>
            </div>
            <dl className="divide-y divide-gray-100">
              {infoItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="px-6 py-4 flex items-center justify-between">
                    <dt className="flex items-center gap-2 text-sm text-gray-500">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {isEditing && (item as any).editable ? (
                        <Input
                          type="tel"
                          value={editPhone}
                          onChange={e => setEditPhone(e.target.value)}
                          className="w-48 text-right"
                        />
                      ) : (
                        item.value
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        </FadeIn>

        {/* Security */}
        <FadeIn delay={0.3}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-medium text-gray-900 mb-4">Безопасность</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Пароль</span>
                <Button variant="outline" size="sm">Изменить пароль</Button>
              </div>
              <div className="flex items-center justify-between">
                <span>Двухфакторная аутентификация</span>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Не активна</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Последний вход</span>
                <span className="text-gray-900 font-medium">Сейчас</span>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </FadeIn>
  );
};

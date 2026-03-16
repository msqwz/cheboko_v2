import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { QrCode, Camera, Upload } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AudioRecorder } from '../components/AudioRecorder';

export const CreateTicket = () => {
  const { equipments, locations, addTicket, currentUser, rolePermissions } = useAppContext();
  const navigate = useNavigate();

  const currentPerms = currentUser ? rolePermissions[currentUser.role] || [] : [];

  // ALL hooks before conditional returns
  const [scanned, setScanned] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState(equipments[0]);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');

  if (!currentUser || !currentPerms.includes('create_ticket')) {
    return <div>Доступ запрещен</div>;
  }

  const handleSimulateScan = () => {
    // Simulate a 1 second scan delay
    setTimeout(() => {
      setScanned(true);
      setIsManual(false);
    }, 1000);
  };

  const handleManualEntry = () => {
    setScanned(true);
    setIsManual(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    addTicket({
      equipmentId: selectedEquipment.id,
      equipmentDetails: selectedEquipment,
      description,
      photos: [], // Mock photos
      status: 'created',
      priority,
      createdBy: currentUser.id,
    });

    navigate('/tickets');
  };

  if (!scanned) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Сканирование QR-кода</h2>
          <p className="text-gray-500">Наведите камеру на QR-код оборудования</p>
        </div>
        
        <div className="relative w-64 h-64 border-4 border-dashed border-indigo-300 rounded-2xl flex items-center justify-center bg-indigo-50">
          <QrCode className="w-24 h-24 text-indigo-400" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-400/20 to-transparent animate-scan" />
        </div>

        <div className="flex flex-col gap-4 w-64">
          <Button onClick={handleSimulateScan} size="lg" className="w-full">
            <Camera className="w-5 h-5 mr-2" />
            Симулировать скан
          </Button>
          <Button onClick={handleManualEntry} variant="outline" size="lg" className="w-full">
            Ввести вручную
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Новая заявка</h2>
        <p className="mt-1 text-sm text-gray-500">
          {isManual ? 'Выберите оборудование из списка.' : 'Данные об оборудовании заполнены автоматически.'}
        </p>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {isManual ? (
            <div className="mb-6 space-y-4">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Выберите точку клиента
                </label>
                <select
                  id="location"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  value={selectedLocationId}
                  onChange={(e) => {
                    setSelectedLocationId(e.target.value);
                    const eqForLoc = equipments.find(eq => eq.locationId === e.target.value);
                    if (eqForLoc) setSelectedEquipment(eqForLoc);
                  }}
                >
                  <option value="">Все точки</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.address})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="equipment" className="block text-sm font-medium text-gray-700 mb-2">
                  Выберите оборудование
                </label>
                <select
                  id="equipment"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  value={selectedEquipment?.id || ''}
                  onChange={(e) => setSelectedEquipment(equipments.find(eq => eq.id === e.target.value) || equipments[0])}
                >
                  {equipments
                    .filter(eq => !selectedLocationId || eq.locationId === selectedLocationId)
                    .map(eq => (
                      <option key={eq.id} value={eq.id}>
                        {eq.model} (S/N: {eq.serialNumber}) - {eq.locationName}
                      </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-md mb-6 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Оборудование</h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Модель</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedEquipment.model}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Серийный номер</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedEquipment.serialNumber}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Адрес</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedEquipment.locationName}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Юр. лицо</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedEquipment.legalEntity}</dd>
                </div>
              </dl>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                Приоритет (влияние на работу)
              </label>
              <select
                id="priority"
                name="priority"
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm border"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
              >
                <option value="high">Высокий (Оборудование стоит)</option>
                <option value="medium">Средний (Работает с перебоями)</option>
                <option value="low">Низкий (Плановое обслуживание)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Описание проблемы
                </label>
                <AudioRecorder onTranscription={(text) => setDescription(prev => prev ? `${prev} ${text}` : text)} />
              </div>
              <div className="mt-1">
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-3"
                  placeholder="Опишите, что случилось..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Фотографии (до 3 шт.)</label>
              <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500"
                    >
                      <span>Загрузить файлы</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*" />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF до 10MB</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" type="button" onClick={() => setScanned(false)}>
                Отмена
              </Button>
              <Button type="submit">
                Отправить заявку
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

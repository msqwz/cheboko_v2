import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { QrCode, Camera, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { QRScanner } from '../components/QRScanner';
import { cn } from '../utils';

const SYMPTOMS = [
  'Не греет воду',
  'Плохой пролив',
  'Течет вода',
  'Шумит при работе',
  'Не включается',
  'Ошибка на дисплее',
  'Плохое качество напитка',
  'Другое',
];

export const CreateTicket = () => {
  const { equipments, locations, addTicket, currentUser, rolePermissions } = useAppContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const currentPerms = currentUser ? rolePermissions[currentUser.role] || [] : [];

  // QR Scanner state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  // Form state
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [selectedSymptom, setSelectedSymptom] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  // Pre-fill from URL parameter
  useEffect(() => {
    const equipmentId = searchParams.get('id');
    if (equipmentId) {
      const equipment = equipments.find(eq => eq.id === equipmentId);
      if (equipment) {
        setSelectedEquipment(equipment.id);
        setSelectedLocationId(equipment.locationId);
      }
    }
  }, [searchParams, equipments]);

  if (!currentUser || !currentPerms.includes('create_ticket')) {
    return <div>Доступ запрещен</div>;
  }

  const handleScanComplete = (equipmentId: string) => {
    const equipment = equipments.find(eq => eq.id === equipmentId);
    if (equipment) {
      setSelectedEquipment(equipment.id);
      setSelectedLocationId(equipment.locationId);
      setIsScannerOpen(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedEquipment) return;

    const equipment = equipments.find(eq => eq.id === selectedEquipment);
    if (!equipment) return;

    const finalDescription = selectedSymptom === 'Другое' 
      ? customDescription 
      : selectedSymptom || description;

    addTicket({
      equipmentId: equipment.id,
      equipmentDetails: equipment,
      description: finalDescription,
      photos: [],
      status: 'created',
      priority,
      createdBy: currentUser.id,
    });

    navigate('/tickets');
  };

  const isFormValid = selectedEquipment && (selectedSymptom || customDescription || description);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Новая заявка</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedEquipment 
              ? 'Оборудование выбрано' 
              : 'Отсканируйте QR-код или выберите оборудование'}
          </p>
        </div>
        {!selectedEquipment && (
          <Button onClick={() => setIsScannerOpen(true)} size="sm">
            <Camera className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Сканировать QR</span>
          </Button>
        )}
      </div>

      {/* Equipment Info Banner */}
      {selectedEquipment && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">
                {equipments.find(eq => eq.id === selectedEquipment)?.model}
              </p>
              <p className="text-sm text-white/80 mt-1">
                S/N: {equipments.find(eq => eq.id === selectedEquipment)?.serialNumber}
              </p>
              <p className="text-xs text-white/70 mt-1">
                {equipments.find(eq => eq.id === selectedEquipment)?.locationName}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedEquipment('');
                setSelectedLocationId('');
              }}
              className="text-white/80 hover:text-white text-sm"
            >
              Изменить
            </button>
          </div>
        </div>
      )}

      {/* Scanner Button (if not selected) */}
      {!selectedEquipment && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <QrCode className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Сканируйте QR-код</h3>
          <p className="text-sm text-gray-500 mb-4">
            Наведите камеру на QR-код оборудования для автоматического заполнения
          </p>
          <Button onClick={() => setIsScannerOpen(true)} size="lg" className="w-full sm:w-auto">
            <Camera className="h-5 w-5 mr-2" />
            Открыть сканер
          </Button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-xl p-4 sm:p-6 border border-gray-100 space-y-4">
        {/* Manual equipment selection */}
        {!selectedEquipment && (
          <div>
            <label htmlFor="equipment" className="block text-sm font-medium text-gray-700 mb-2">
              Выберите оборудование
            </label>
            <select
              id="equipment"
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5"
              value={selectedEquipment}
              onChange={(e) => {
                const eq = equipments.find(eq => eq.id === e.target.value);
                setSelectedEquipment(e.target.value);
                if (eq) setSelectedLocationId(eq.locationId);
              }}
            >
              <option value="">Выберите оборудование</option>
              {equipments.map(eq => (
                <option key={eq.id} value={eq.id}>
                  {eq.model} ({eq.serialNumber})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Symptom selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Выберите симптом
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SYMPTOMS.map(symptom => (
              <button
                key={symptom}
                type="button"
                onClick={() => setSelectedSymptom(symptom)}
                className={
                  `px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                    selectedSymptom === symptom
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`
                }
              >
                {symptom}
              </button>
            ))}
          </div>
        </div>

        {/* Custom description */}
        {selectedSymptom === 'Другое' && (
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Опишите проблему
            </label>
            <textarea
              id="description"
              rows={3}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5"
              placeholder="Подробно опишите проблему..."
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
            />
          </div>
        )}

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Приоритет
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'low', label: 'Низкий', color: 'bg-blue-100 text-blue-800 border-blue-200' },
              { value: 'medium', label: 'Средний', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
              { value: 'high', label: 'Высокий', color: 'bg-red-100 text-red-800 border-red-200' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPriority(opt.value as 'low' | 'medium' | 'high')}
                className={cn(
                  "px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border",
                  priority === opt.value
                    ? opt.color.replace('100', '600').replace('800', 'white').replace('border-200', '600')
                    : 'bg-white ' + opt.color
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex-1"
          >
            Отмена
          </Button>
          <Button
            type="submit"
            disabled={!isFormValid}
            className="flex-1"
          >
            Создать заявку
          </Button>
        </div>
      </form>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScanComplete}
      />
    </div>
  );
};

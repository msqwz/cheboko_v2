import React, { useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, CheckCircle, AlertCircle, Camera, Upload, Keyboard, Image } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

type ScanMode = 'camera' | 'photo' | 'manual';

export const QRScanner: React.FC<QRScannerProps> = ({ isOpen, onClose, onScan }) => {
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean>(true);
  const [scanMode, setScanMode] = useState<ScanMode>('camera');
  const [manualId, setManualId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerId = 'qr-reader-element';

  // Сброс состояния при открытии
  React.useEffect(() => {
    if (isOpen) {
      setScanError(null);
      setCameraPermission(true);
      setScanMode('camera');
      setManualId('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Инициализация камеры
  React.useEffect(() => {
    if (isOpen && scanMode === 'camera') {
      initCamera();
    }
    return () => {
      stopScanner();
    };
  }, [isOpen, scanMode]);

  const initCamera = async () => {
    try {
      scannerRef.current = new Html5Qrcode(containerId);
      const cameras = await Html5Qrcode.getCameras();
      
      if (cameras && cameras.length > 0) {
        const backCamera = cameras.find(cam => 
          cam.label.toLowerCase().includes('back') || 
          cam.label.toLowerCase().includes('environment')
        ) || cameras[0];

        await scannerRef.current.start(
          backCamera.id,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          onScanSuccess,
          onScanError
        );
      } else {
        setScanError('Камера не найдена');
        setCameraPermission(false);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setScanError('Ошибка доступа к камере. Проверьте разрешения.');
      setCameraPermission(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.log('Scanner stop error:', err);
      }
      scannerRef.current = null;
    }
  };

  const onScanSuccess = (decodedText: string) => {
    processScanResult(decodedText);
  };

  const onScanError = (error: string) => {
    if (error.includes('NotFoundException')) {
      return;
    }
    console.log('Scan error:', error);
  };

  const processScanResult = (data: string) => {
    setIsProcessing(true);
    try {
      const url = new URL(data);
      const equipmentId = url.searchParams.get('id');
      
      if (equipmentId) {
        onScan(equipmentId);
        handleClose();
      } else {
        onScan(data);
        handleClose();
      }
    } catch {
      onScan(data);
      handleClose();
    }
    setIsProcessing(false);
  };

  // Обработка загрузки фото
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !scannerRef.current) return;

    setScanError(null);
    setIsProcessing(true);

    try {
      // Используем scanFile для распознавания QR из изображения
      const result = await scannerRef.current.scanFile(file, true);
      processScanResult(result);
    } catch (err) {
      console.error('Photo scan error:', err);
      setScanError('Не удалось распознать QR-код на фото. Попробуйте другое изображение.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Ручной ввод
  const handleManualSubmit = () => {
    if (manualId.trim()) {
      processScanResult(manualId.trim());
    } else {
      setScanError('Введите ID оборудования');
    }
  };

  const handleClose = () => {
    stopScanner().then(() => {
      onClose();
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Сканирование QR-кода"
      description="Выберите способ считывания"
    >
      <div className="space-y-4">
        {/* Переключатель режимов */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setScanMode('camera')}
            className={
              `flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${
                scanMode === 'camera'
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <Camera className="h-5 w-5" />
            <span className="text-xs font-medium">Камера</span>
          </button>
          <button
            type="button"
            onClick={() => setScanMode('photo')}
            className={
              `flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${
                scanMode === 'photo'
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <Image className="h-5 w-5" />
            <span className="text-xs font-medium">Фото</span>
          </button>
          <button
            type="button"
            onClick={() => setScanMode('manual')}
            className={
              `flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${
                scanMode === 'manual'
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <Keyboard className="h-5 w-5" />
            <span className="text-xs font-medium">Ввод</span>
          </button>
        </div>

        {/* Режим камеры */}
        {scanMode === 'camera' && (
          <div className="space-y-3">
            {!cameraPermission ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Camera className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-gray-500 text-center">
                  Нет доступа к камере.<br/>
                  Проверьте разрешения в настройках браузера.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setCameraPermission(true);
                    setScanError(null);
                  }}
                  className="mt-4"
                >
                  Попробовать снова
                </Button>
              </div>
            ) : (
              <div
                id={containerId}
                className="w-full flex justify-center rounded-xl overflow-hidden border border-gray-200"
                style={{ minHeight: '350px' }}
              />
            )}
          </div>
        )}

        {/* Режим фото */}
        {scanMode === 'photo' && (
          <div className="space-y-4 py-8">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors"
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700 mb-1">
                Загрузить фото QR-кода
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG до 5MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            {isProcessing && (
              <div className="text-center text-sm text-gray-500">
                Обработка фото...
              </div>
            )}
          </div>
        )}

        {/* Ручной ввод */}
        {scanMode === 'manual' && (
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID оборудования
              </label>
              <input
                type="text"
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5"
                placeholder="Например: eq1"
                value={manualId}
                onChange={(e) => {
                  setManualId(e.target.value);
                  setScanError(null);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleManualSubmit();
                  }
                }}
              />
            </div>
            <Button onClick={handleManualSubmit} className="w-full">
              Продолжить
            </Button>
          </div>
        )}

        {/* Сообщение об ошибке */}
        {scanError && scanMode !== 'manual' && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {scanError}
          </div>
        )}

        {/* Инструкция */}
        {scanMode !== 'manual' && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
            <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">
                {scanMode === 'camera' ? 'Как сканировать камерой:' : 'Как загрузить фото:'}
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                {scanMode === 'camera' ? (
                  <>
                    <li>Разрешите доступ к камере</li>
                    <li>Наведите QR-код в центр рамки</li>
                    <li>Дождитесь автоматического распознавания</li>
                  </>
                ) : (
                  <>
                    <li>Сделайте скриншот QR-кода</li>
                    <li>Нажмите на область загрузки</li>
                    <li>Выберите фото из галереи</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Кнопка закрытия */}
        {scanMode !== 'manual' && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Закрыть
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

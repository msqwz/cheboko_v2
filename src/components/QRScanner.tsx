import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ isOpen, onClose, onScan }) => {
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean>(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'qr-reader-element';

  useEffect(() => {
    if (isOpen) {
      setScanError(null);
      setCameraPermission(true);
      
      // Создаем сканер
      scannerRef.current = new Html5Qrcode(containerId);

      // Запускаем камеру
      const startScanner = async () => {
        try {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            // Используем заднюю камеру
            const backCamera = cameras.find(cam => 
              cam.label.toLowerCase().includes('back') || 
              cam.label.toLowerCase().includes('environment')
            ) || cameras[0];

            await scannerRef.current?.start(
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

      startScanner();
    }

    // Очистка при закрытии
    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const onScanSuccess = (decodedText: string) => {
    try {
      const url = new URL(decodedText);
      const equipmentId = url.searchParams.get('id');
      
      if (equipmentId) {
        onScan(equipmentId);
        stopScanner();
        onClose();
      } else {
        onScan(decodedText);
        stopScanner();
        onClose();
      }
    } catch {
      onScan(decodedText);
      stopScanner();
      onClose();
    }
  };

  const onScanError = (error: string) => {
    // Игнорируем NotFoundException - это нормально
    if (error.includes('NotFoundException')) {
      return;
    }
    console.log('Scan error:', error);
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
    setScanError(null);
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
      description="Наведите камеру на QR-код оборудования"
    >
      <div className="space-y-4">
        {/* Контейнер для сканера */}
        {!cameraPermission ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Camera className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">
              Нет доступа к камере.<br/>
              Проверьте разрешения в настройках браузера.
            </p>
          </div>
        ) : (
          <div
            id={containerId}
            className="w-full flex justify-center"
            style={{ minHeight: '350px' }}
          />
        )}

        {/* Сообщение об ошибке */}
        {scanError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {scanError}
          </div>
        )}

        {/* Инструкция */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
          <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium mb-1">Как сканировать:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Разрешите доступ к камере</li>
              <li>Наведите QR-код в центр рамки</li>
              <li>Дождитесь автоматического распознавания</li>
            </ul>
          </div>
        </div>

        {/* Кнопка закрытия */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Закрыть
          </Button>
        </div>
      </div>
    </Modal>
  );
};

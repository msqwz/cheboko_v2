import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ isOpen, onClose, onScan }) => {
  const [scanError, setScanError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      setScanError(null);
      
      // Создаем сканер
      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        /* verbose= */ false
      );

      // Обработка успешного сканирования
      const onScanSuccess = (decodedText: string) => {
        try {
          // Пытаемся распарсить как URL
          const url = new URL(decodedText);
          const equipmentId = url.searchParams.get('id');
          
          if (equipmentId) {
            onScan(equipmentId);
            scannerRef.current?.clear();
          } else {
            // Если это просто ID оборудования
            onScan(decodedText);
            scannerRef.current?.clear();
          }
        } catch {
          // Если это не URL, передаем как есть
          onScan(decodedText);
          scannerRef.current?.clear();
        }
      };

      // Обработка ошибок сканирования
      const onScanError = (error: string) => {
        // Игнорируем большинство ошибок - это нормально при сканировании
        if (error.includes('NotFoundException')) {
          return;
        }
        setScanError('Не удалось распознать QR-код. Попробуйте еще раз.');
      };

      // Запускаем сканер
      scannerRef.current
        .render(onScanSuccess, onScanError)
        .catch((err) => {
          setScanError('Ошибка доступа к камере. Проверьте разрешения.');
          console.error('QR Scanner Error:', err);
        });
    }

    // Очистка при закрытии
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isOpen, onScan]);

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setScanError(null);
    onClose();
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
        <div 
          ref={containerRef}
          id="qr-reader" 
          className="w-full flex justify-center"
          style={{ minHeight: '350px' }}
        />

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

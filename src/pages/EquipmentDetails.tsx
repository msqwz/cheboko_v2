import React, { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { ArrowLeft, MapPin, Building, Coffee, Calendar, Ticket as TicketIcon, QrCode, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { STATUS_LABELS, STATUS_COLORS, cn } from '../utils';
import { LocationInfo } from '../components/LocationInfo';
import { QRCodeSVG } from 'qrcode.react';

export const EquipmentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { equipments, tickets, currentUser, rolePermissions } = useAppContext();
  const qrRef = useRef<SVGSVGElement>(null);

  const currentPerms = currentUser ? rolePermissions[currentUser.role] || [] : [];

  if (!currentUser || !currentPerms.includes('view_equipment')) {
    return <div>Доступ запрещен</div>;
  }

  const equipment = equipments.find(e => e.id === id);
  const equipmentTickets = tickets.filter(t => t.equipmentId === id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (!equipment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">Оборудование не найдено</h2>
        <button onClick={() => navigate(-1)} className="mt-4 text-indigo-600 hover:text-indigo-900">
          Вернуться назад
        </button>
      </div>
    );
  }

  const handlePrintQR = () => {
    if (qrRef.current) {
      const svgData = new XMLSerializer().serializeToString(qrRef.current);
      const printWindow = window.open('', '', 'width=600,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Печать QR-кода</title>
              <style>
                body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
                .qr-container { text-align: center; }
                h2 { margin-bottom: 10px; }
                p { margin-top: 10px; color: #666; }
              </style>
            </head>
            <body>
              <div class="qr-container">
                <h2>${equipment.model}</h2>
                ${svgData}
                <p>S/N: ${equipment.serialNumber}</p>
              </div>
              <script>
                window.onload = () => {
                  window.print();
                  setTimeout(() => window.close(), 500);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-500 shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Оборудование: {equipment.model}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Информация</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Coffee className="h-4 w-4 mr-2" /> Модель
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{equipment.model}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <span className="font-mono text-xs mr-2 border rounded px-1">SN</span> Серийный номер
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{equipment.serialNumber}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" /> Локация
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{equipment.locationName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Building className="h-4 w-4 mr-2" /> Юр. лицо
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{equipment.legalEntity}</dd>
              </div>
            </dl>
            <LocationInfo locationName={equipment.locationName} />
          </div>

          <div className="bg-white shadow rounded-lg p-6 flex flex-col items-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4 w-full flex items-center justify-between">
              <span className="flex items-center"><QrCode className="h-5 w-5 mr-2 text-gray-400" /> QR-код</span>
              <button 
                onClick={handlePrintQR}
                className="text-indigo-600 hover:text-indigo-800 p-1 rounded-md hover:bg-indigo-50 transition-colors"
                title="Распечатать QR-код"
              >
                <Printer className="h-5 w-5" />
              </button>
            </h3>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <QRCodeSVG 
                value={equipment.id} 
                size={180}
                level="H"
                includeMargin={true}
                ref={qrRef}
              />
            </div>
            <p className="mt-4 text-xs text-gray-500 text-center">
              Отсканируйте для быстрого создания заявки
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <TicketIcon className="h-5 w-5 mr-2 text-gray-400" />
              История заявок ({equipmentTickets.length})
            </h3>
            
            {equipmentTickets.length > 0 ? (
              <div className="flow-root">
                <ul className="-mb-8">
                  {equipmentTickets.map((ticket, ticketIdx) => (
                    <li key={ticket.id}>
                      <div className="relative pb-8">
                        {ticketIdx !== equipmentTickets.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={cn("h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white", STATUS_COLORS[ticket.status].split(' ')[0])}>
                              <Calendar className={cn("h-4 w-4", STATUS_COLORS[ticket.status].split(' ')[1])} />
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                            <div>
                              <p className="text-sm text-gray-900 font-medium">
                                <button onClick={() => navigate(`/tickets/${ticket.id}`)} className="hover:underline">
                                  Заявка #{ticket.id}
                                </button>
                              </p>
                              <p className="mt-1 text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
                              <div className="mt-2">
                                <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_COLORS[ticket.status])}>
                                  {STATUS_LABELS[ticket.status]}
                                </span>
                              </div>
                            </div>
                            <div className="whitespace-nowrap text-right text-sm text-gray-500">
                              {format(new Date(ticket.createdAt), 'd MMM yyyy', { locale: ru })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Нет истории заявок для этого оборудования</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

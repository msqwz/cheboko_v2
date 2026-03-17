import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, ROLE_LABELS, cn, openNavigator } from '../utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ArrowLeft, Clock, User, MapPin, Wrench, CheckCircle, Coffee, MessageSquare, Navigation, WifiOff, XCircle, Lock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { TicketProgressBar } from '../components/TicketProgressBar';
import { FadeIn } from '../components/AnimatedComponents';

export const TicketDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tickets, users, currentUser, updateTicketStatus, assignEngineer, addPartsUsed, addComment, rolePermissions, locations, online, saveReportOffline } = useAppContext();

  const currentPerms = currentUser ? rolePermissions[currentUser.role] || [] : [];

  // ALL hooks before conditional returns
  const [newComment, setNewComment] = useState('');
  const [selectedEngineer, setSelectedEngineer] = useState('');
  const [resolution, setResolution] = useState('');
  const [parts, setParts] = useState([{ name: '', quantity: 1 }]);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [closeReason, setCloseReason] = useState('');

  const ticket = tickets.find(t => t.id === id);

  if (!currentUser || !currentPerms.includes('view_tickets')) {
    return <div>Доступ запрещен</div>;
  }

  if (!ticket) {
    return <div>Заявка не найдена</div>;
  }

  const creator = users.find(u => u.id === ticket.createdBy);
  const assignee = users.find(u => u.id === ticket.assignedTo);
  const engineersList = users.filter(u => u.role === 'engineer');
  const ticketLocation = locations.find(l => l.id === ticket.equipmentDetails.locationId);

  const handleAssign = () => {
    if (selectedEngineer) {
      assignEngineer(ticket.id, selectedEngineer);
    }
  };

  const handleCompleteConfirm = () => {
    if (resolution) {
      const filteredParts = parts.filter(p => p.name.trim() !== '');
      if (online) {
        addPartsUsed(ticket.id, filteredParts, resolution);
      } else {
        // Save offline
        saveReportOffline(ticket.id, resolution, filteredParts);
      }
      setIsCompleteModalOpen(false);
    }
  };

  const handleCancelConfirm = () => {
    if (currentUser.role === 'operator' && !cancelReason.trim()) return;
    const reason = cancelReason.trim() || 'Отменена клиентом';
    const note = currentUser.role === 'operator'
      ? `Отменена оператором ${currentUser.name}. Причина: ${reason}`
      : reason;
    updateTicketStatus(ticket.id, 'canceled', note);
    setIsCancelModalOpen(false);
    setCancelReason('');
  };

  const handleCloseConfirm = () => {
    if (!closeReason.trim()) return;
    const note = `Закрыта оператором ${currentUser.name}. Причина: ${closeReason.trim()}`;
    // Use 'completed' status instead of 'closed' when operator closes the ticket
    updateTicketStatus(ticket.id, 'completed', note);
    setIsCloseModalOpen(false);
    setCloseReason('');
  };

  const handleAddComment = () => {
    if (newComment.trim() && ticket) {
      addComment(ticket.id, newComment.trim());
      setNewComment('');
    }
  };

  const handleOpenNavigator = () => {
    if (!ticketLocation?.lat || !ticketLocation?.lng) return;
    openNavigator(ticketLocation.lat, ticketLocation.lng);
  };

  return (
    <FadeIn>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2 sm:space-x-4 flex-wrap gap-y-2">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-500 shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Заявка #{ticket.id}</h2>
            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm font-medium", STATUS_COLORS[ticket.status])}>
              {STATUS_LABELS[ticket.status]}
            </span>
            <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm font-medium", PRIORITY_COLORS[ticket.priority])}>
              {PRIORITY_LABELS[ticket.priority]}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 sm:space-x-3">
            {currentUser.role === 'operator' && ticket.status === 'created' && (
              <Button onClick={() => updateTicketStatus(ticket.id, 'opened')}>Принять в работу</Button>
            )}
            {(currentUser.role === 'operator' || currentUser.role === 'region_manager') && ticket.status === 'opened' && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <select
                  className="block w-full sm:w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border"
                  value={selectedEngineer}
                  onChange={(e) => setSelectedEngineer(e.target.value)}
                >
                  <option value="">Выберите инженера</option>
                  {engineersList.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                <Button onClick={handleAssign} disabled={!selectedEngineer}>Назначить</Button>
              </div>
            )}
            {currentUser.role === 'engineer' && ticket.assignedTo === currentUser.id && ticket.status === 'assigned' && (
              <Button onClick={() => updateTicketStatus(ticket.id, 'enroute')}>Выехать на объект</Button>
            )}
            {currentUser.role === 'engineer' && ticket.assignedTo === currentUser.id && ticket.status === 'enroute' && (
              <Button onClick={() => updateTicketStatus(ticket.id, 'in_work')}>Начать работу</Button>
            )}
            {/* Navigator button for engineers */}
            {currentUser.role === 'engineer' && ticket.assignedTo === currentUser.id && ticketLocation?.lat && (
              <Button variant="outline" onClick={handleOpenNavigator}>
                <Navigation className="h-4 w-4 mr-2" />
                Навигатор
              </Button>
            )}
            {/* Operator can close or cancel tickets in 'created' or 'opened' status (before engineer assignment) */}
            {currentUser.role === 'operator' && ['created', 'opened'].includes(ticket.status) && !ticket.assignedTo && (
              <>
                <Button variant="outline" onClick={() => setIsCloseModalOpen(true)}>
                  <Lock className="h-4 w-4 mr-2" />
                  Закрыть заявку
                </Button>
                <Button variant="danger" onClick={() => setIsCancelModalOpen(true)}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Отменить заявку
                </Button>
              </>
            )}
            {(currentUser.role === 'location_manager' || currentUser.role === 'specialist') && !['completed', 'canceled'].includes(ticket.status) && (
              <Button variant="danger" onClick={() => setIsCancelModalOpen(true)}>Отменить заявку</Button>
            )}
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-xl p-4 sm:p-6 border border-gray-100">
          <TicketProgressBar status={ticket.status} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Описание проблемы</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
            </div>

            {/* Engineer Completion Form */}
            {currentUser.role === 'engineer' && ticket.assignedTo === currentUser.id && ticket.status === 'in_work' && (
              <div className="bg-white shadow-sm rounded-xl p-6 border-l-4 border-indigo-500 border border-gray-100">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Wrench className="h-5 w-5 mr-2 text-indigo-500" />
                  Завершение работ
                </h3>
                {!online && (
                  <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                    <WifiOff className="h-4 w-4 shrink-0" />
                    Офлайн-режим. Отчёт будет сохранён локально и отправлен при восстановлении связи.
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Описание выполненных работ</label>
                    <textarea
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                      rows={3}
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      placeholder="Что было сделано..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Использованные запчасти</label>
                    {parts.map((part, idx) => (
                      <div key={idx} className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          placeholder="Название детали"
                          className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                          value={part.name}
                          onChange={(e) => {
                            const newParts = [...parts];
                            newParts[idx].name = e.target.value;
                            setParts(newParts);
                          }}
                        />
                        <input
                          type="number"
                          min="1"
                          className="w-20 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                          value={part.quantity}
                          onChange={(e) => {
                            const newParts = [...parts];
                            newParts[idx].quantity = parseInt(e.target.value) || 1;
                            setParts(newParts);
                          }}
                        />
                        {idx === parts.length - 1 && (
                          <Button type="button" variant="outline" size="sm" onClick={() => setParts([...parts, { name: '', quantity: 1 }])}>+</Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button onClick={() => setIsCompleteModalOpen(true)} disabled={!resolution} className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {online ? 'Завершить заявку' : 'Сохранить офлайн'}
                  </Button>
                </div>
              </div>
            )}

            {ticket.status === 'completed' && ticket.resolution && (
              <div className="bg-green-50 shadow-sm rounded-xl p-6 border border-green-200">
                <h3 className="text-lg font-medium text-green-900 mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Отчет о выполнении
                </h3>
                <p className="text-green-800 mb-4">{ticket.resolution}</p>
                {ticket.partsUsed && ticket.partsUsed.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-green-900 mb-2">Запчасти:</h4>
                    <ul className="list-disc pl-5 text-sm text-green-800">
                      {ticket.partsUsed.map((p, i) => (
                        <li key={i}>{p.name} — {p.quantity} шт.</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">История</h3>
              <div className="flow-root">
                <ul className="-mb-8">
                  {ticket.history.map((event, eventIdx) => {
                    const user = users.find(u => u.id === event.userId);
                    return (
                      <li key={eventIdx}>
                        <div className="relative pb-8">
                          {eventIdx !== ticket.history.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={cn("h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white", STATUS_COLORS[event.status].split(' ')[0])}>
                                <Clock className={cn("h-4 w-4", STATUS_COLORS[event.status].split(' ')[1])} />
                              </span>
                            </div>
                            <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                              <div>
                                <p className="text-sm text-gray-500">
                                  Статус изменен на <span className="font-medium text-gray-900">{STATUS_LABELS[event.status]}</span>
                                  {user && ` пользователем ${user.name}`}
                                </p>
                                {event.note && <p className="mt-1 text-sm text-gray-600">{event.note}</p>}
                              </div>
                              <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                {format(new Date(event.timestamp), 'd MMM HH:mm', { locale: ru })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-gray-400" />
                Комментарии
              </h3>
              <div className="space-y-4 mb-4">
                {ticket.comments && ticket.comments.length > 0 ? (
                  ticket.comments.map(comment => {
                    const commentUser = users.find(u => u.id === comment.userId);
                    return (
                      <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-sm text-gray-900">{commentUser?.name || 'Неизвестно'}</span>
                          <span className="text-xs text-gray-500">{format(new Date(comment.timestamp), 'd MMM HH:mm', { locale: ru })}</span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.text}</p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500 italic">Нет комментариев</p>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <textarea
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  rows={2}
                  placeholder="Добавить комментарий..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                />
                <Button onClick={handleAddComment} disabled={!newComment.trim()} className="self-end">
                  Отправить
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Информация</h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" /> Адрес
                  </dt>
                  <dd className="mt-1">
                    <button
                      onClick={handleOpenNavigator}
                      className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                      disabled={!ticketLocation?.lat}
                    >
                      {ticket.equipmentDetails.locationName}
                      {ticketLocation?.lat && <Navigation className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                  </dd>
                  <dd className="text-xs text-gray-500">{ticket.equipmentDetails.legalEntity}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Coffee className="h-4 w-4 mr-2" /> Оборудование
                  </dt>
                  <dd className="mt-1 text-sm text-indigo-600 hover:text-indigo-900 font-medium cursor-pointer" onClick={() => navigate(`/equipment/${ticket.equipmentId}`)}>
                    {ticket.equipmentDetails.model}
                  </dd>
                  <dd className="text-xs text-gray-500">S/N: {ticket.equipmentDetails.serialNumber}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <User className="h-4 w-4 mr-2" /> Создатель
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{creator?.name || 'Неизвестно'}</dd>
                </div>
                {assignee && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Wrench className="h-4 w-4 mr-2" /> Исполнитель
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{assignee.name}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>

        {/* Cancel Modal — operator must provide reason */}
        <Modal
          isOpen={isCancelModalOpen}
          onClose={() => { setIsCancelModalOpen(false); setCancelReason(''); }}
          title="Отмена заявки"
          description={currentUser?.role === 'operator'
            ? 'Укажите причину отмены заявки. Действие будет записано в историю заявки с указанием вашего ФИО и времени.'
            : 'Вы уверены, что хотите отменить эту заявку? Это действие нельзя будет отменить.'
          }
          confirmText="Да, отменить"
          cancelText="Оставить как есть"
          confirmVariant="danger"
          onConfirm={handleCancelConfirm}
        >
          {currentUser?.role === 'operator' && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Причина отмены <span className="text-red-500">*</span>
              </label>
              <textarea
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                rows={3}
                placeholder="Опишите причину отмены заявки..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
              />
              {!cancelReason.trim() && (
                <p className="mt-1 text-xs text-red-500">Обязательное поле</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Оператор: <strong>{currentUser.name}</strong>
              </p>
            </div>
          )}
        </Modal>

        {/* Close Modal — operator closes ticket with reason */}
        <Modal
          isOpen={isCloseModalOpen}
          onClose={() => { setIsCloseModalOpen(false); setCloseReason(''); }}
          title="Закрытие заявки"
          description="Укажите причину закрытия заявки. Заявка получит статус «Выполнена». Действие будет записано в историю заявки с указанием вашего ФИО и времени."
          confirmText="Закрыть заявку"
          cancelText="Отмена"
          confirmVariant="primary"
          onConfirm={handleCloseConfirm}
        >
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Причина закрытия <span className="text-red-500">*</span>
            </label>
            <textarea
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              rows={3}
              placeholder="Опишите причину закрытия заявки..."
              value={closeReason}
              onChange={e => setCloseReason(e.target.value)}
            />
            {!closeReason.trim() && (
              <p className="mt-1 text-xs text-red-500">Обязательное поле</p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Оператор: <strong>{currentUser?.name}</strong>
            </p>
          </div>
        </Modal>

        <Modal
          isOpen={isCompleteModalOpen}
          onClose={() => setIsCompleteModalOpen(false)}
          title={online ? 'Завершение работ' : 'Сохранение офлайн'}
          description={online
            ? 'Вы уверены, что хотите завершить заявку? Убедитесь, что все выполненные работы и использованные запчасти указаны верно.'
            : 'Отчёт будет сохранён локально и автоматически отправлен при восстановлении соединения.'
          }
          confirmText={online ? 'Завершить' : 'Сохранить офлайн'}
          cancelText="Отмена"
          confirmVariant="primary"
          onConfirm={handleCompleteConfirm}
        />
      </div>
    </FadeIn>
  );
};

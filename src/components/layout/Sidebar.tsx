import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../store/AppContext';
import { ROLE_LABELS } from '../../utils';
import { Logo } from '../Logo';
import { LayoutDashboard, Ticket, PlusCircle, Settings, LogOut, X, Users, MapPin, BarChart3, Briefcase, Server, Link2, Wifi, WifiOff, UserCircle, Wrench } from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { currentUser, logoutUser, rolePermissions, online } = useAppContext();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  const currentPerms = rolePermissions[currentUser.role] || [];

  const navItems: { to: string; label: string; icon: React.FC<any> }[] = [];

  if (currentPerms.includes('view_dashboard')) {
    navItems.push({ to: '/dashboard', label: 'Дашборд', icon: LayoutDashboard });
  }
  if (currentPerms.includes('view_tickets')) {
    navItems.push({ to: '/tickets', label: 'Заявки', icon: Ticket });
  }
  if (currentPerms.includes('create_ticket')) {
    navItems.push({ to: '/create-ticket', label: 'Новая заявка (QR)', icon: PlusCircle });
  }
  if (currentPerms.includes('view_statistics')) {
    navItems.push({ to: '/statistics', label: 'Статистика', icon: BarChart3 });
  }
  if (currentPerms.includes('view_map')) {
    navItems.push({ to: '/map', label: 'Карта', icon: MapPin });
  }
  if (currentPerms.includes('view_maintenance')) {
    navItems.push({ to: '/maintenance', label: 'Т/О', icon: Wrench });
  }
  if (currentPerms.includes('view_clients')) {
    navItems.push({ to: '/clients', label: 'Клиенты', icon: Briefcase });
  }
  if (currentPerms.includes('view_equipment')) {
    navItems.push({ to: '/equipment', label: 'Оборудование', icon: Server });
  }
  if (currentPerms.includes('view_employees')) {
    navItems.push({ to: '/employees', label: 'Сотрудники', icon: Users });
  }
  if (currentPerms.includes('manage_invites')) {
    navItems.push({ to: '/invites', label: 'Приглашения', icon: Link2 });
  }
  if (currentPerms.includes('manage_settings')) {
    navItems.push({ to: '/settings', label: 'Настройки', icon: Settings });
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
        <Logo size="sm" />
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-gray-200 p-4 space-y-3">
        {/* Online status indicator */}
        <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium ${online ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
          {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {online ? 'Онлайн' : 'Офлайн'}
        </div>

        <NavLink
          to="/profile"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center px-2 py-2 rounded-lg transition-colors cursor-pointer ${
              isActive ? 'bg-indigo-50' : 'hover:bg-gray-50'
            }`
          }
        >
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
            {currentUser.name.charAt(0)}
          </div>
          <div className="ml-3 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{currentUser.name}</p>
            <p className="text-xs text-gray-500">{ROLE_LABELS[currentUser.role]}</p>
          </div>
          <UserCircle className="ml-auto h-4 w-4 text-gray-400 shrink-0" />
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Выйти
        </button>
      </div>
    </div>
  );
};

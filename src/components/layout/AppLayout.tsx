import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAppContext } from '../../store/AppContext';
import { OfflineIndicator } from '../OfflineIndicator';
import { Menu } from 'lucide-react';
import { Logo } from '../Logo';
import { NotificationCenter } from '../NotificationCenter';

export const AppLayout = () => {
  const { currentUser } = useAppContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <OfflineIndicator />

      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-gray-600/50 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden w-full">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 shadow-sm">
          <div className="flex items-center">
            <button
              type="button"
              className="mr-4 text-gray-500 hover:text-gray-700 focus:outline-none lg:hidden transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <span className="sr-only">Открыть меню</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="lg:hidden">
              <Logo size="sm" />
            </div>
            <h1 className="hidden lg:block text-lg font-semibold text-gray-900 truncate">
              Рабочее место
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
              {currentUser.name.charAt(0)}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { ROLE_LABELS, getDefaultRouteForRole } from '../utils';
import { User as UserIcon, Mail, ArrowRight } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { motion } from 'motion/react';
import { FadeIn, StaggerList, StaggerItem } from '../components/AnimatedComponents';

export const RoleSelector = () => {
  const { users, loginUser } = useAppContext();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'select' | 'email'>('select');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSelectUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      loginUser(user);
      navigate(getDefaultRouteForRole(user.role));
    }
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email === email);
    if (user) {
      loginUser(user);
      navigate(getDefaultRouteForRole(user.role));
    } else {
      setError('Пользователь с таким email не найден');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <FadeIn>
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Logo size="lg" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              Вход в систему
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {mode === 'select' ? 'Выберите пользователя для демонстрации' : 'Войдите с помощью email'}
            </p>
          </div>

          {/* Mode switcher */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => { setMode('select'); setError(''); }}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${mode === 'select' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Демо-вход
            </button>
            <button
              onClick={() => { setMode('email'); setError(''); }}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${mode === 'email' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Mail className="inline h-4 w-4 mr-1" />
              Email
            </button>
          </div>

          {mode === 'email' ? (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleEmailLogin}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="example@email.com"
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              <Button type="submit" className="w-full" size="lg">
                <ArrowRight className="mr-2 h-4 w-4" />
                Войти
              </Button>
              <div className="text-center space-y-2">
                <Link to="/register" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                  Регистрация (Руководитель сети)
                </Link>
              </div>
            </motion.form>
          ) : (
            <StaggerList className="space-y-3">
              {users.map((user, index) => (
                <StaggerItem key={user.id}>
                  <button
                    onClick={() => handleSelectUser(user.id)}
                    className="group relative flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-4 text-left shadow-sm hover:border-indigo-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                  >
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 group-hover:from-indigo-200 group-hover:to-purple-200 transition-colors">
                        <UserIcon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{ROLE_LABELS[user.role]}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                  </button>
                </StaggerItem>
              ))}
            </StaggerList>
          )}

          <div className="text-center">
            <p className="text-xs text-gray-400">
              Есть ссылка-приглашение?{' '}
              <Link to="/invite" className="text-indigo-500 hover:text-indigo-700 font-medium">
                Зарегистрироваться по приглашению
              </Link>
            </p>
          </div>
        </div>
      </FadeIn>
    </div>
  );
};

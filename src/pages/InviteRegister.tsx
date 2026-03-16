import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FadeIn } from '../components/AnimatedComponents';
import { ROLE_LABELS } from '../utils';
import { ArrowLeft, Link2, CheckCircle, XCircle } from 'lucide-react';

export const InviteRegister = () => {
  const { invites, useInvite, loginUser } = useAppContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tokenFromUrl = searchParams.get('token') || '';
  const [token, setToken] = useState(tokenFromUrl);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);

  // Check invite validity
  const invite = invites.find(inv =>
    inv.token === token &&
    inv.isActive &&
    !inv.usedBy &&
    new Date(inv.expiresAt) > new Date()
  );

  const handleVerifyToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (invite) {
      setVerified(true);
      setError('');
    } else {
      setError('Ссылка-приглашение недействительна, истекла или уже использована');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const newUser = useInvite(token, { name, email });
    if (newUser) {
      loginUser(newUser);
      navigate('/dashboard');
    } else {
      setError('Не удалось зарегистрироваться. Приглашение могло быть использовано.');
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
              Регистрация по приглашению
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Введите код приглашения для создания аккаунта
            </p>
          </div>

          {!verified ? (
            <form onSubmit={handleVerifyToken} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Link2 className="inline h-4 w-4 mr-1" />
                  Код приглашения
                </label>
                <Input
                  type="text"
                  value={token}
                  onChange={e => { setToken(e.target.value); setError(''); }}
                  placeholder="Вставьте код из приглашения"
                  required
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  <XCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" size="lg">
                Проверить приглашение
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <div>
                  Приглашение действительно!
                  {invite && (
                    <span className="block text-xs text-green-600 mt-0.5">
                      Роль: {ROLE_LABELS[invite.role]}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ваше имя</label>
                <Input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Иван Иванов"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" size="lg">
                Зарегистрироваться
              </Button>
            </form>
          )}

          <div className="text-center">
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Назад к входу
            </Link>
          </div>
        </div>
      </FadeIn>
    </div>
  );
};

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FadeIn } from '../components/AnimatedComponents';
import { generateVerificationCode, verifyCode } from '../lib/auth';
import { ArrowLeft, Mail, Shield } from 'lucide-react';

export const Register = () => {
  const { addUser, loginUser } = useAppContext();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<'email' | 'code' | 'info'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [networkName, setNetworkName] = useState('');
  const [error, setError] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const validatePassword = (pw: string): string[] => {
    const errors: string[] = [];
    if (pw.length < 8) errors.push('Минимум 8 символов');
    if (!/[A-Za-zА-Яа-яЁё]/.test(pw)) errors.push('Должна быть хотя бы одна буква');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) errors.push('Должен быть хотя бы один спецсимвол');
    return errors;
  };

  const handlePasswordChange = (pw: string) => {
    setPassword(pw);
    setPasswordErrors(validatePassword(pw));
  };

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const c = generateVerificationCode(email);
    setGeneratedCode(c);
    setStep('code');
    setError('');
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyCode(email, code)) {
      setStep('info');
      setError('');
    } else {
      setError('Неверный код подтверждения');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newUser = addUser({
      name,
      email,
      role: 'network_manager',
      networkId: `net${Date.now()}`,
    });

    if (newUser) {
      loginUser(newUser as any);
      navigate('/dashboard');
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
              Регистрация
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Только для роли «Руководитель сети»
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2">
            {['email', 'code', 'info'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s ? 'bg-indigo-600 text-white' : 
                  ['email', 'code', 'info'].indexOf(step) > i ? 'bg-green-500 text-white' : 
                  'bg-gray-200 text-gray-500'
                }`}>
                  {i + 1}
                </div>
                {i < 2 && <div className="w-8 h-0.5 bg-gray-200" />}
              </div>
            ))}
          </div>

          {step === 'email' && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <Button type="submit" className="w-full" size="lg">
                Отправить код
              </Button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                <Shield className="inline h-4 w-4 mr-1" />
                Код подтверждения отправлен на {email}.
                <br />
                <span className="text-xs text-blue-500">(Демо: код — {generatedCode} или 000000)</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Код подтверждения</label>
                <Input
                  type="text"
                  value={code}
                  onChange={e => { setCode(e.target.value); setError(''); }}
                  placeholder="123456"
                  maxLength={6}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" size="lg">
                Подтвердить
              </Button>
              <button type="button" onClick={() => setStep('email')} className="text-sm text-gray-500 hover:text-gray-700 w-full text-center">
                Назад
              </button>
            </form>
          )}

          {step === 'info' && (
            <form onSubmit={handleRegister} className="space-y-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => handlePasswordChange(e.target.value)}
                  placeholder="Минимум 8 символов, спецсимвол, буква"
                  required
                />
                {password && (
                  <div className="mt-2 space-y-1">
                    {[
                      { check: password.length >= 8, label: 'Минимум 8 символов' },
                      { check: /[A-Za-zА-Яа-яЁё]/.test(password), label: 'Хотя бы одна буква' },
                      { check: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), label: 'Хотя бы один спецсимвол (!@#$...)' },
                    ].map((rule, i) => (
                      <div key={i} className={`flex items-center gap-1.5 text-xs ${rule.check ? 'text-green-600' : 'text-red-500'}`}>
                        <span>{rule.check ? '✓' : '✗'}</span>
                        <span>{rule.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название сети</label>
                <Input
                  type="text"
                  value={networkName}
                  onChange={e => setNetworkName(e.target.value)}
                  placeholder="Моя кофейня"
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={passwordErrors.length > 0 || !password}>
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

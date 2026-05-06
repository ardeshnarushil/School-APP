import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Lock, User, ShieldCheck, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'gu' : 'en';
    i18n.changeLanguage(newLang);
  };
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/token/', {
        username,
        password,
      });
      localStorage.setItem('token', response.data.access);
      localStorage.setItem('role', response.data.role);
      localStorage.setItem('username', response.data.username);

      const role = response.data.role;
      if (role === 'ADMIN') navigate('/admin-dashboard');
      else if (role === 'TEACHER') navigate('/teacher-dashboard');
      else if (role === 'PARENT') navigate('/parent-dashboard');
    } catch (err) {
      setError(t('invalid_credentials'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-container text-primary rounded-full mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-bold text-primary">SchoolSync</h1>
          <button 
            onClick={toggleLanguage}
            className="mt-4 inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-xl transition-all text-xs font-bold text-slate-700 border border-slate-100 mx-auto"
          >
            <Languages size={16} className="text-primary" />
            {i18n.language === 'en' ? 'ગુજરાતી' : 'English'}
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">{t('username')}</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input
                type="text"
                className="input-field pl-10 disabled:opacity-50"
                placeholder={t('username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">{t('password')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input
                type="password"
                className="input-field pl-10 disabled:opacity-50"
                placeholder={t('password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 text-lg font-bold flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden relative group"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {t('authenticating')}
              </>
            ) : (
              <>
                {t('login')}
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
            {t('academic_slogan')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

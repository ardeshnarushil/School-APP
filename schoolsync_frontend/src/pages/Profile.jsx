import React, { useState } from 'react';
import api from '../api';
import { 
  User, Mail, Shield, Lock, 
  ArrowLeft, CheckCircle, AlertCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      await api.post('/api/change-password/', passwords);
      setMessage({ type: 'success', text: t('password_changed_success') });
      setPasswords({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const errorData = err.response?.data;
      const errorText = errorData?.old_password?.[0] || errorData?.non_field_errors?.[0] || t('error_updating_password');
      setMessage({ type: 'error', text: errorText });
    }
  };

  return (
    <div className="min-h-screen bg-surface p-8">
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-primary mb-8 transition-colors"
        >
          <ArrowLeft size={20} /> {t('back_to_dashboard')}
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden mb-8">
          <div className="bg-primary p-10 text-white flex flex-col items-center">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30 mb-4 shadow-2xl">
              <User size={48} />
            </div>
            <h2 className="text-3xl font-bold">{username}</h2>
            <div className="mt-2 bg-white/10 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-widest border border-white/20">
              {role}
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('email_address')}</p>
                <p className="font-semibold text-slate-700">{username}@schoolsync.com</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm">
                <Shield size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('account_permissions')}</p>
                <p className="font-semibold text-slate-700">{role}-level Access</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Lock className="text-primary" size={22} /> {t('change_password')}
          </h3>

          {message.text && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${
              message.type === 'success' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
            }`}>
              {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span className="font-semibold">{message.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">{t('current_password')}</label>
              <input 
                type="password" className="input-field" placeholder="••••••••"
                value={passwords.old_password} onChange={e => setPasswords({...passwords, old_password: e.target.value})}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t('new_password')}</label>
                <input 
                  type="password" className="input-field" placeholder="••••••••"
                  value={passwords.new_password} onChange={e => setPasswords({...passwords, new_password: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t('confirm_new_password')}</label>
                <input 
                  type="password" className="input-field" placeholder="••••••••"
                  value={passwords.confirm_password} onChange={e => setPasswords({...passwords, confirm_password: e.target.value})}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full py-4 mt-4 shadow-lg shadow-primary/20">
              {t('update_security_credentials')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, User as UserIcon, ArrowRight, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { PWAInstallButton } from './PWAInstallButton.js';

export const AuthScreen: React.FC = () => {
  const { login, register, error, clearError } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    if (mode === 'register' && password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setLocalError(null);
    clearError();
    setEmail('admin@pipeline.io');
    setPassword('password123');
    setIsSubmitting(true);
    try {
      await login('admin@pipeline.io', 'password123');
    } catch (err: any) {
      setLocalError(err.message || 'Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#09090B] text-slate-200 flex flex-col justify-center items-center p-4 sm:p-6 antialiased">
      {/* Background radial accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Top right mobile install action */}
      <div className="absolute top-4 right-4 z-20">
        <PWAInstallButton />
      </div>

      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">
            B2B Pipeline Security Gate
          </h1>
          <p className="text-xs text-slate-400">
            Protected endpoint workspace with JWT-secured telemetry &amp; persistence
          </p>
        </div>

        {/* Demo One-Click Access Button */}
        <div className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-200">Demo Admin Access</p>
              <p className="text-[11px] text-blue-400/80">admin@pipeline.io • password123</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isSubmitting}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
            id="quick-demo-login-btn"
          >
            {isSubmitting && email === 'admin@pipeline.io' ? 'Authenticating...' : '1-Click Login'}
          </button>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setLocalError(null);
            }}
            className={`py-1.5 rounded-md transition-all ${
              mode === 'login'
                ? 'bg-slate-800 text-slate-100 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="tab-login"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setLocalError(null);
            }}
            className={`py-1.5 rounded-md transition-all ${
              mode === 'register'
                ? 'bg-slate-800 text-slate-100 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="tab-register"
          >
            Create Account
          </button>
        </div>

        {/* Errors */}
        {(localError || error) && (
          <div className="p-3 bg-red-950/50 border border-red-800/50 rounded-lg text-xs text-red-300 flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
            <span>{localError || error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Full Name / Workspace Identifier</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500 transition-colors"
                  id="auth-name-input"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-slate-400 font-medium">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500 transition-colors"
                id="auth-email-input"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 font-medium">Password</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500 transition-colors"
                id="auth-password-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
            id="auth-submit-btn"
          >
            <span>
              {isSubmitting
                ? 'Processing...'
                : mode === 'login'
                ? 'Authenticate & Open Dashboard'
                : 'Create Account & Proceed'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Security Footer Note */}
        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Encrypted JWT Sessions • SQLite Isolated Multi-Tenant Storage</span>
        </div>
      </div>
    </div>
  );
};

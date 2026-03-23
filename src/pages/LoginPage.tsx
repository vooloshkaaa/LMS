import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Eye, EyeOff, GraduationCap, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@lms.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      toast.error('Invalid credentials. Try admin@lms.com / teacher@lms.com / student@lms.com with any 4+ char password.');
    }
  };

  const demoAccounts = [
    { label: 'Admin', email: 'admin@lms.com', color: 'text-teal-400' },
    { label: 'Teacher', email: 'teacher@lms.com', color: 'text-amber-400' },
    { label: 'Student', email: 'student@lms.com', color: 'text-blue-400' },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center relative overflow-hidden">
      {/* Animated background mesh */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute -bottom-40 left-1/3 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-pulse delay-500" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 shadow-lg shadow-teal-500/30 mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            LinguaFlow
          </h1>
          <p className="text-slate-400 mt-1 text-sm" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            English Language School CRM
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6" style={{ fontFamily: 'Syne, sans-serif' }}>
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-slate-900/50 border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                placeholder="you@example.com"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-900/50 border border-slate-600 text-white rounded-lg px-4 py-2.5 pr-11 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                  placeholder="••••••••"
                  style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-semibold rounded-lg py-2.5 text-sm transition-all duration-200 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-5 border-t border-slate-700/50">
            <p className="text-xs text-slate-500 mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Demo accounts (any 4+ char password):
            </p>
            <div className="flex gap-2">
              {demoAccounts.map(acc => (
                <button
                  key={acc.email}
                  onClick={() => { setEmail(acc.email); setPassword('demo1234'); }}
                  className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-2 py-1.5 text-xs transition-all hover:border-slate-500"
                  style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  <span className={`font-semibold ${acc.color}`}>{acc.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;

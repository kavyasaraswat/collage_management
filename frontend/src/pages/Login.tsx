import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cpu, Lock, Mail, ShieldAlert, Sparkles, ArrowRight, UserCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const loggedUser = await login(email, password);
      if (loggedUser.role === 'ADMIN') navigate('/admin/dashboard');
      else if (loggedUser.role === 'TEACHER') navigate('/teacher/dashboard');
      else navigate('/student/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const autofillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-xl shadow-brand-500/30 mb-4">
            <Cpu className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            AcademiaPro ERP
          </h1>
          <p className="text-sm text-slate-400 mt-1">Enterprise College Portal Sign In</p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-8 shadow-2xl border border-slate-800/80 backdrop-blur-xl">
          {/* Quick Demo Selectors */}
          <div className="mb-6">
            <label className="text-xs font-semibold text-brand-400 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Quick Demo Login Selector
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => autofillDemo('admin@demo.com')}
                className="px-3 py-2 text-xs font-medium bg-slate-900/90 hover:bg-brand-900/40 text-slate-200 border border-slate-700/60 rounded-xl transition duration-150 hover:border-brand-500/50 flex flex-col items-center gap-1"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => autofillDemo('teacher@demo.com')}
                className="px-3 py-2 text-xs font-medium bg-slate-900/90 hover:bg-brand-900/40 text-slate-200 border border-slate-700/60 rounded-xl transition duration-150 hover:border-brand-500/50 flex flex-col items-center gap-1"
              >
                <UserCheck className="w-4 h-4 text-indigo-400" />
                <span>Teacher</span>
              </button>
              <button
                type="button"
                onClick={() => autofillDemo('student@demo.com')}
                className="px-3 py-2 text-xs font-medium bg-slate-900/90 hover:bg-brand-900/40 text-slate-200 border border-slate-700/60 rounded-xl transition duration-150 hover:border-brand-500/50 flex flex-col items-center gap-1"
              >
                <UserCheck className="w-4 h-4 text-brand-400" />
                <span>Student</span>
              </button>
            </div>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900/90 px-3 text-slate-500 rounded-full border border-slate-800">
                Or Sign In With Email
              </span>
            </div>
          </div>

          {/* Alert Message */}
          {error && (
            <div className="mb-6 p-4 bg-rose-950/60 border border-rose-800/60 rounded-xl flex items-start space-x-3 text-rose-300 text-sm">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@college.edu"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-brand-600/30 transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 font-semibold hover:underline">
              Create User Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

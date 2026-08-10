import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';
import { Cpu, Lock, Mail, User, Phone, ShieldAlert, UserPlus } from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [studentId, setStudentId] = useState('');
  const [teacherId, setTeacherId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const newUser = await register({
        name,
        email,
        password,
        phone,
        role,
        ...(role === 'STUDENT' ? { studentId } : {}),
        ...(role === 'TEACHER' ? { teacherId } : {}),
      });

      if (newUser.role === 'ADMIN') navigate('/admin/dashboard');
      else if (newUser.role === 'TEACHER') navigate('/teacher/dashboard');
      else navigate('/student/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg z-10 my-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-xl shadow-brand-500/30 mb-3">
            <Cpu className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Create AcademiaPro Account</h1>
          <p className="text-xs text-slate-400 mt-1">Select your role and fill in your details</p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-8 shadow-2xl border border-slate-800/80 backdrop-blur-xl">
          {error && (
            <div className="mb-6 p-4 bg-rose-950/60 border border-rose-800/60 rounded-xl flex items-start space-x-3 text-rose-300 text-sm">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                Account Type / Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['STUDENT', 'TEACHER', 'ADMIN'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 text-xs font-semibold rounded-xl border transition ${
                      role === r
                        ? 'bg-brand-600 border-brand-500 text-white shadow-lg shadow-brand-600/30'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                Full Name
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                />
              </div>
            </div>

            {/* Email */}
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
                  placeholder="john@college.edu"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                />
              </div>
            </div>

            {/* Password */}
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
                  placeholder="Min 6 characters"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                />
              </div>
            </div>

            {/* Optional Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555-0123"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                />
              </div>
            </div>

            {/* Role specific ID */}
            {role === 'STUDENT' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                  Student ID Code (Optional)
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="STU-2026-999 (auto-generated if empty)"
                  className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                />
              </div>
            )}

            {role === 'TEACHER' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                  Teacher ID Code (Optional)
                </label>
                <input
                  type="text"
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  placeholder="TCH-999 (auto-generated if empty)"
                  className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-brand-600/30 transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Creating Account...' : 'Register Account'}</span>
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 font-semibold hover:underline">
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

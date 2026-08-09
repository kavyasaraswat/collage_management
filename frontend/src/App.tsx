import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Server, Database, ShieldCheck, Cpu, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import api from './services/api';

interface HealthData {
  status: string;
  system: string;
  timestamp: string;
  database: string;
  error?: string;
}

const HealthStatus: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<HealthData>('/health');
      setHealth(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 md:p-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              AcademiaPro ERP
            </h1>
            <p className="text-xs text-slate-400 font-medium">Enterprise College Management Platform</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-semibold text-brand-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Phase 1: Foundation Ready
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto w-full my-12 z-10">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-extrabold tracking-tight text-white mb-3">
            System Status & Architecture Diagnostics
          </h2>
          <p className="text-slate-400 text-base max-w-xl mx-auto">
            Phase 1 setup complete: Vite React TypeScript Frontend, Node Express Backend, and Prisma ORM Database layer are active.
          </p>
        </div>

        {/* Health Card */}
        <div className="glass-panel rounded-2xl p-8 shadow-2xl relative">
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <Server className="w-6 h-6 text-brand-400" />
              <h3 className="text-lg font-semibold text-white">Backend Health Check</h3>
            </div>
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition duration-150 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Status
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-brand-500" />
              <p className="text-sm">Pinging API endpoint /api/health...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-950/50 border border-rose-800/50 rounded-xl flex items-start space-x-3 text-rose-300">
              <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-rose-200">Connection Failed</h4>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          ) : health ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center space-x-4">
                <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase">API Server Status</p>
                  <p className="text-lg font-bold text-white mt-0.5">{health.status}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center space-x-4">
                <div className="p-3 bg-brand-500/10 rounded-lg text-brand-400">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase">Database Connection</p>
                  <p className="text-lg font-bold text-white mt-0.5">{health.database}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 col-span-1 md:col-span-2 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <span className="text-sm text-slate-300">Timestamp: {new Date(health.timestamp).toLocaleString()}</span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">Express + Prisma</span>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 z-10">
        AcademiaPro College ERP &copy; 2026 | Built for Production & Scaling
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HealthStatus />} />
      </Routes>
    </Router>
  );
};

export default App;

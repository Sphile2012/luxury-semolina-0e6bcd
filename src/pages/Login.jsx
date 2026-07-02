import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const { login, register, isAuthenticated, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, isLoadingAuth, navigate]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'register' && !form.full_name.trim()) { setError('Full name is required'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      if (mode === 'login') await login(form.email.trim().toLowerCase(), form.password);
      else await register(form.email.trim().toLowerCase(), form.password, form.full_name.trim());
      navigate('/');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--nt-bg)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#06b6d4", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: "var(--nt-bg)" }}>
      {/* Ambient glows */}
      <div className="nt-blob-blue" style={{ width: 500, height: 500, top: -150, left: -150 }} />
      <div className="nt-blob-cyan" style={{ width: 350, height: 350, bottom: -100, right: -100 }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: "linear-gradient(135deg, #dc2626, #ef4444)",
              boxShadow: "0 0 32px rgba(239,68,68,0.35), 0 8px 24px rgba(220,38,38,0.25)",
              border: "1px solid rgba(239,68,68,0.4)",
            }}
          >
            <Shield size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-black" style={{ color: "#f1f5f9" }}>Panic Ring</h1>
          <p className="text-sm mt-1" style={{ color: "#475569" }}>Personal safety, always on</p>
        </div>

        {/* Tab switcher */}
        <div
          className="flex p-1 rounded-2xl mb-6"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {['login', 'register'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setForm({ email: '', password: '', full_name: '' }); }}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-all"
              style={mode === m ? {
                background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                color: "#fff",
                boxShadow: "0 0 16px rgba(6,182,212,0.3), 0 4px 8px rgba(59,130,246,0.2)",
              } : { color: "#475569" }}
            >
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <NTInput label="Full Name" type="text" value={form.full_name} onChange={set('full_name')} placeholder="Your full name" />
          )}
          <NTInput label="Email" type="email" value={form.email} onChange={set('email')} placeholder="you@email.com" />

          {/* Password with show/hide */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#475569" }}>Password</label>
            <div
              className="flex items-center gap-2 px-4 py-3.5 rounded-[14px] transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)",
              }}
            >
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                placeholder="••••••••"
                required minLength={6}
                className="flex-1 bg-transparent text-sm focus:outline-none"
                style={{ color: "#f1f5f9" }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)} style={{ color: "#475569" }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl px-4 py-3 text-sm"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 mt-2 transition-all disabled:opacity-60"
            style={{
              background: loading ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
              boxShadow: loading ? "none" : "0 0 24px rgba(6,182,212,0.3), 0 4px 16px rgba(59,130,246,0.25)",
              border: "1px solid rgba(6,182,212,0.3)",
            }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-[10px] mt-6" style={{ color: "#334155" }}>
          By continuing you agree to our{' '}
          <Link to="/terms" style={{ color: "#475569", textDecoration: "underline" }}>Terms</Link>
          {' '}and{' '}
          <Link to="/privacy" style={{ color: "#475569", textDecoration: "underline" }}>Privacy Policy</Link>
        </p>
      </motion.div>
    </div>
  );
}

function NTInput({ label, type, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#475569" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        className="w-full px-4 py-3.5 rounded-[14px] text-sm transition-all focus:outline-none"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#f1f5f9",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)",
        }}
        onFocus={e => {
          e.target.style.borderColor = "rgba(6,182,212,0.5)";
          e.target.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.2), 0 0 0 3px rgba(6,182,212,0.1)";
        }}
        onBlur={e => {
          e.target.style.borderColor = "rgba(255,255,255,0.08)";
          e.target.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.2)";
        }}
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Shield, Eye, EyeOff, Loader2, HelpCircle, X,
         MessageSquare, Phone, BookOpen, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Help modal ────────────────────────────────────────────────── */
function HelpModal({ onClose }) {
  const steps = [
    { title: "Create an Account", desc: "Tap "Create Account", enter your full name, email and a password (min 6 characters), then tap the button to register." },
    { title: "Sign In", desc: "Already have an account? Tap "Sign In", enter your email and password, then tap Sign In." },
    { title: "Forgot Password?", desc: "Contact support via WhatsApp or email below and we'll reset it for you." },
    { title: "Email not working?", desc: "Check for typos. Use the email you registered with. Passwords are case-sensitive." },
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{ background: "#fff", boxShadow: "0 -4px 40px rgba(0,0,0,0.2)" }}
        onClick={e => e.stopPropagation()}>

        {/* Blue/gold header matching the image */}
        <div style={{
          background: "linear-gradient(135deg, #1a237e 0%, #283593 40%, #3949ab 70%, #1565c0 100%)",
          padding: "20px 20px 16px",
          position: "relative"
        }}>
          {/* Gold orbital accent */}
          <div style={{
            position: "absolute", top: 12, right: 60, width: 60, height: 60,
            borderRadius: "50%", border: "2px solid rgba(255,193,7,0.5)",
            boxShadow: "0 0 20px rgba(255,193,7,0.3)",
          }}/>
          <div style={{
            position: "absolute", top: 24, right: 72, width: 36, height: 36,
            borderRadius: "50%",
            background: "radial-gradient(circle at 38% 32%, #5c6bc0, #1a237e)",
            boxShadow: "0 0 12px rgba(92,107,192,0.8), inset 0 0 8px rgba(255,255,255,0.2)",
          }}/>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-black text-white text-lg">Need Help?</h2>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>
                Sign in & registration guide
              </p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)" }}>
              <X size={16} color="#fff"/>
            </button>
          </div>
        </div>

        {/* Steps */}
        <div style={{ padding: "16px 20px 8px" }}>
          {steps.map(({ title, desc }, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg,#1565c0,#283593)",
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 900
              }}>{i + 1}</div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1d23", marginBottom: 2 }}>{title}</p>
                <p style={{ fontSize: 12, color: "#5a6a7e", lineHeight: 1.5 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Contact support */}
        <div style={{ margin: "0 20px 20px", background: "#F0F4FF", borderRadius: 16, padding: 14,
          border: "1px solid #C5D0F0" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#283593", marginBottom: 10,
            textTransform: "uppercase", letterSpacing: 1 }}>Contact Support</p>
          <div style={{ display: "flex", gap: 8 }}>
            <a href="https://wa.me/27000000000"
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                gap: 6, padding: "10px 0", borderRadius: 12, background: "#25D366", color: "#fff",
                textDecoration: "none", fontSize: 12, fontWeight: 700 }}>
              <MessageSquare size={14}/> WhatsApp
            </a>
            <a href="mailto:poomeigh503@gmail.com"
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                gap: 6, padding: "10px 0", borderRadius: 12, background: "#283593", color: "#fff",
                textDecoration: "none", fontSize: 12, fontWeight: 700 }}>
              <Mail size={14}/> Email
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Input field ───────────────────────────────────────────────── */
function Field({ label, type, value, onChange, placeholder, required = true }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{
        display: "block", fontSize: 12, fontWeight: 700, color: "#374151",
        marginBottom: 6, letterSpacing: 0.3
      }}>{label}</label>
      <input
        type={type} value={value} onChange={onChange}
        placeholder={placeholder} required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          display: "block", width: "100%",
          padding: "13px 16px", borderRadius: 14, fontSize: 15,
          color: "#111827", background: "#fff",
          border: `1.5px solid ${focused ? "#1565c0" : "#D1D5DB"}`,
          boxShadow: focused ? "0 0 0 3px rgba(21,101,192,0.12)" : "0 1px 3px rgba(0,0,0,0.06)",
          outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

/* ── Main Login / Register page ────────────────────────────────── */
export default function Login() {
  const { login, register, isAuthenticated, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);

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
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#F0F4FF" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%",
          border: "2.5px solid #1565c0", borderTopColor: "transparent",
          animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      </AnimatePresence>

      <div style={{
        minHeight: "100dvh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "24px 20px",
        background: "linear-gradient(160deg, #EEF2FF 0%, #F0F4FF 50%, #E8F0FE 100%)",
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative orbital background */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 280, height: 280,
          borderRadius: "50%", border: "1px solid rgba(21,101,192,0.12)",
          background: "radial-gradient(circle, rgba(21,101,192,0.06) 0%, transparent 70%)" }}/>
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 220, height: 220,
          borderRadius: "50%", border: "1px solid rgba(255,193,7,0.15)",
          background: "radial-gradient(circle, rgba(255,193,7,0.06) 0%, transparent 70%)" }}/>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{ width: "100%", maxWidth: 380, position: "relative", zIndex: 1 }}>

          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{
              width: 68, height: 68, borderRadius: 20, margin: "0 auto 14px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg,#C01818,#E53030)",
              boxShadow: "0 6px 24px rgba(192,24,24,0.35)",
            }}>
              <Shield size={32} color="#fff"/>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "#111827", margin: "0 0 4px" }}>
              Panic Ring
            </h1>
            <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>
              Personal safety, always on
            </p>
          </div>

          {/* Card */}
          <div style={{
            background: "#fff", borderRadius: 24, padding: "24px 24px 20px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.09), 0 1px 3px rgba(0,0,0,0.06)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}>

            {/* Tab switcher */}
            <div style={{
              display: "flex", background: "#F3F4F6", borderRadius: 14,
              padding: 4, marginBottom: 22, gap: 4,
            }}>
              {['login', 'register'].map(m => (
                <button key={m}
                  onClick={() => { setMode(m); setError(''); setForm({ email: '', password: '', full_name: '' }); }}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 11, fontSize: 14,
                    fontWeight: 700, border: "none", cursor: "pointer",
                    transition: "all 0.2s",
                    background: mode === m ? "#fff" : "transparent",
                    color: mode === m ? "#111827" : "#6B7280",
                    boxShadow: mode === m ? "0 1px 6px rgba(0,0,0,0.12)" : "none",
                  }}>
                  {m === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {mode === 'register' && (
                <Field label="Full Name" type="text" value={form.full_name}
                  onChange={set('full_name')} placeholder="Your full name" />
              )}
              <Field label="Email Address" type="email" value={form.email}
                onChange={set('email')} placeholder="you@email.com" />

              {/* Password */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700,
                  color: "#374151", marginBottom: 6, letterSpacing: 0.3 }}>Password</label>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "0 16px", borderRadius: 14,
                  border: "1.5px solid #D1D5DB", background: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}>
                  <input type={showPw ? 'text' : 'password'}
                    value={form.password} onChange={set('password')}
                    placeholder="••••••••" required minLength={6}
                    style={{
                      flex: 1, padding: "13px 0", fontSize: 15, color: "#111827",
                      background: "transparent", border: "none", outline: "none",
                    }}/>
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{ background: "none", border: "none", cursor: "pointer",
                      color: "#9CA3AF", padding: 4, display: "flex" }}>
                    {showPw ? <EyeOff size={17}/> : <Eye size={17}/>}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <p style={{ fontSize: 11, color: "#9CA3AF", margin: "-6px 0 0" }}>
                  Password must be at least 6 characters.
                </p>
              )}

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ background: "#FEF2F2", border: "1px solid #FECACA",
                      borderRadius: 12, padding: "10px 14px", fontSize: 13,
                      color: "#B91C1C", fontWeight: 500 }}>
                    ⚠ {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button type="submit" disabled={loading}
                style={{
                  width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  background: loading ? "#D1D5DB"
                    : "linear-gradient(135deg,#C01818 0%,#E53030 100%)",
                  color: loading ? "#9CA3AF" : "#fff",
                  fontSize: 15, fontWeight: 800,
                  boxShadow: loading ? "none" : "0 4px 16px rgba(192,24,24,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.2s",
                }}>
                {loading && <Loader2 size={17} style={{ animation: "spin 0.8s linear infinite" }}/>}
                {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
          </div>

          {/* Terms */}
          <p style={{ textAlign: "center", fontSize: 11, color: "#9CA3AF", marginTop: 14 }}>
            By continuing you agree to our{' '}
            <Link to="/terms" style={{ color: "#6B7280", textDecoration: "underline" }}>Terms</Link>
            {' '}and{' '}
            <Link to="/privacy" style={{ color: "#6B7280", textDecoration: "underline" }}>Privacy Policy</Link>
          </p>

          {/* ── HELP BUTTON — blue/gold orbital style matching the image */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
              onClick={() => setShowHelp(true)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 22px", borderRadius: 999, border: "none",
                cursor: "pointer",
                background: "linear-gradient(135deg,#1a237e 0%,#283593 50%,#1565c0 100%)",
                boxShadow: "0 4px 20px rgba(26,35,126,0.45), 0 0 0 2px rgba(255,193,7,0.3)",
                color: "#fff",
              }}>
              {/* Gold orbital ring icon */}
              <div style={{ position: "relative", width: 28, height: 28, flexShrink: 0 }}>
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  border: "2px solid rgba(255,193,7,0.7)",
                  boxShadow: "0 0 8px rgba(255,193,7,0.5)",
                }}/>
                <div style={{
                  position: "absolute", top: "50%", left: "50%",
                  transform: "translate(-50%,-50%)",
                  width: 14, height: 14, borderRadius: "50%",
                  background: "radial-gradient(circle at 38% 32%, #7986cb, #1a237e)",
                  boxShadow: "0 0 6px rgba(121,134,203,0.8)",
                }}/>
              </div>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: 13, fontWeight: 800, margin: 0, color: "#fff" }}>
                  Need Help?
                </p>
                <p style={{ fontSize: 10, margin: 0, color: "rgba(255,255,255,0.7)" }}>
                  Sign in & registration guide
                </p>
              </div>
              <HelpCircle size={16} color="rgba(255,255,255,0.6)" style={{ flexShrink: 0 }}/>
            </motion.button>
          </div>

        </motion.div>
      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

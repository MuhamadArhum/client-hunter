import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, ArrowRight, Mail, Lock, XCircle, Shield, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const PARTICLES = [
  { left: '8%',  bottom: '12%', delay: '0s',   dur: '4.2s', size: 4, color: 'rgba(33,246,168,0.75)' },
  { left: '18%', bottom: '35%', delay: '1.4s', dur: '3.8s', size: 3, color: 'rgba(16,185,129,0.65)' },
  { left: '30%', bottom: '20%', delay: '2.8s', dur: '5s',   size: 2, color: 'rgba(33,246,168,0.5)'  },
  { left: '72%', bottom: '18%', delay: '0.6s', dur: '4.5s', size: 5, color: 'rgba(33,246,168,0.55)' },
  { left: '82%', bottom: '40%', delay: '3.2s', dur: '3.6s', size: 3, color: 'rgba(5,150,105,0.7)'   },
  { left: '90%', bottom: '60%', delay: '1s',   dur: '4.8s', size: 2, color: 'rgba(16,185,129,0.6)'  },
  { left: '50%', bottom: '8%',  delay: '2s',   dur: '4s',   size: 4, color: 'rgba(33,246,168,0.55)' },
  { left: '62%', bottom: '55%', delay: '4.5s', dur: '5.2s', size: 2, color: 'rgba(16,185,129,0.4)'  },
  { left: '42%', bottom: '72%', delay: '3.8s', dur: '3.5s', size: 3, color: 'rgba(5,150,105,0.45)'  },
  { left: '15%', bottom: '65%', delay: '1.8s', dur: '4.6s', size: 2, color: 'rgba(33,246,168,0.35)' },
];

const FEATURES = [
  { icon: Users,      text: 'AI-powered lead discovery' },
  { icon: Shield,     text: 'Smart outreach automation' },
  { icon: TrendingUp, text: 'Real-time pipeline analytics' },
];

export default function Login() {
  const navigate   = useNavigate();
  const { login }  = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setError('Email and password are required.'); return; }
    setLoading(true); setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Invalid email or password.');
    } finally { setLoading(false); }
  };

  const inputBase: React.CSSProperties = {
    width: '100%', height: 46, paddingLeft: 42, paddingRight: 16,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    color: 'rgba(226,232,240,0.95)',
    fontSize: 14, outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
  };

  const focusGreen = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(33,246,168,0.5)';
    e.target.style.boxShadow   = '0 0 0 3px rgba(33,246,168,0.1), 0 1px 4px rgba(33,246,168,0.15)';
    e.target.style.background  = 'rgba(33,246,168,0.05)';
  };
  const blurReset = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
    e.target.style.boxShadow   = 'none';
    e.target.style.background  = 'rgba(255,255,255,0.05)';
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#0a0f0a' }}
    >
      {/* ── Aurora blobs ── */}
      <div className="pointer-events-none absolute inset-0">
        <div style={{
          position: 'absolute', top: '-10%', left: '-5%',
          width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(33,246,168,0.18) 0%, transparent 65%)',
          filter: 'blur(60px)',
          animation: 'aurora-drift-1 18s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-15%', right: '-5%',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.16) 0%, transparent 65%)',
          filter: 'blur(60px)',
          animation: 'aurora-drift-2 22s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '55%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(5,150,105,0.1) 0%, transparent 65%)',
          filter: 'blur(80px)',
          animation: 'aurora-drift-3 26s ease-in-out infinite',
        }} />
      </div>

      {/* ── Floating particles ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {PARTICLES.map((p, i) => (
          <div key={i} style={{
            position: 'absolute', left: p.left, bottom: p.bottom,
            width: p.size, height: p.size, borderRadius: '50%',
            background: p.color, boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            animation: `particle-rise ${p.dur} ${p.delay} ease-in-out infinite`,
          }} />
        ))}
      </div>

      {/* ── Dot grid ── */}
      <div className="pointer-events-none absolute inset-0" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        animation: 'bg-drift 12s linear infinite',
      }} />

      {/* ── Glass card ── */}
      <div
        className="auth-card relative z-10 w-full overflow-hidden"
        style={{
          maxWidth: 420,
          background: 'rgba(10, 18, 12, 0.85)',
          border: '1px solid rgba(33,246,168,0.12)',
          borderRadius: 20,
          backdropFilter: 'blur(48px)',
          WebkitBackdropFilter: 'blur(48px)',
          boxShadow: '0 0 0 1px rgba(33,246,168,0.08), 0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Top shimmer line */}
        <div style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent 0%, #21F6A8 35%, #10B981 65%, transparent 100%)',
          backgroundSize: '200% 100%',
          borderRadius: '20px 20px 0 0',
          animation: 'shimmer-sweep 3s linear infinite',
        }} />

        {/* Scan line */}
        <div className="scan-line pointer-events-none absolute left-0 right-0" style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent 10%, rgba(33,246,168,0.25) 50%, transparent 90%)',
          zIndex: 2,
        }} />

        <div className="px-7 pt-7 pb-6 relative z-10">

          {/* ── Logo ── */}
          <div className="auth-logo flex flex-col items-center text-center mb-7">
            <div className="relative mb-4">
              <div className="halo-pulse" style={{
                position: 'absolute', inset: -10, borderRadius: 28,
                background: 'linear-gradient(135deg, rgba(33,246,168,0.3), rgba(16,185,129,0.3))',
                filter: 'blur(20px)', opacity: 0.7,
              }} />
              <div
                className="logo-float relative flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: 'linear-gradient(135deg, #21F6A8 0%, #10B981 100%)' }}
              >
                <Zap className="h-8 w-8 text-gray-900" fill="currentColor" />
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%)',
                }} />
              </div>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight" style={{
              background: 'linear-gradient(135deg, #21F6A8 0%, #A7F3D0 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Abyte Hunt
            </h1>
            <p className="text-xs font-medium mt-1" style={{ color: 'rgba(148,163,184,0.45)' }}>
              by Abyte Sol
            </p>

            {/* Features list */}
            <div className="mt-4 space-y-1.5 w-full">
              {FEATURES.map((f) => (
                <div key={f.text} className="flex items-center gap-2 text-left" style={{ color: 'rgba(148,163,184,0.6)' }}>
                  <f.icon className="h-3.5 w-3.5 shrink-0" style={{ color: '#21F6A8' }} />
                  <span className="text-xs">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="auth-divider flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(148,163,184,0.4)' }}>
              Sign in
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="auth-form space-y-4">
            {error && (
              <div
                className="flex items-center gap-2.5 text-sm rounded-xl p-3"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#FCA5A5',
                  animation: 'badge-pop 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                }}
              >
                <XCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Email */}
            <div className="field-1 space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(148,163,184,0.5)' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'rgba(148,163,184,0.35)' }} />
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                  style={inputBase}
                  onFocus={focusGreen}
                  onBlur={blurReset}
                />
              </div>
            </div>

            {/* Password */}
            <div className="field-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(148,163,184,0.5)' }}>
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold"
                  style={{ color: 'rgba(13,156,106,0.8)', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#0D9C6A'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(13,156,106,0.8)'; }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'rgba(148,163,184,0.35)' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  style={{ ...inputBase, paddingRight: 44 }}
                  onFocus={focusGreen}
                  onBlur={blurReset}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'rgba(148,163,184,0.4)', cursor: 'pointer', background: 'none', border: 'none', padding: 0,
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(33,246,168,0.8)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(148,163,184,0.4)'; }}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 font-bold text-sm text-gray-900 ${!loading ? 'btn-breathe-green' : ''}`}
              style={{
                height: 46, marginTop: 4,
                borderRadius: 10,
                background: loading
                  ? 'rgba(33,246,168,0.35)'
                  : 'linear-gradient(135deg, #21F6A8 0%, #10B981 100%)',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'transform 0.15s',
              }}
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Sign up link */}
          <div
            className="auth-footer mt-5 pt-5 text-center"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-sm" style={{ color: 'rgba(148,163,184,0.45)' }}>
              Don't have an account?{' '}
              <Link
                to="/sign-up"
                className="font-semibold"
                style={{ color: '#0D9C6A', transition: 'opacity 0.2s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.8'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1'; }}
              >
                Create account
              </Link>
            </p>
          </div>

          {/* Tech pills */}
          <div className="auth-pills flex items-center justify-center gap-2 mt-4 flex-wrap">
            {['⚡ Groq AI', '🔒 Secure JWT', '🚀 Real-time'].map((t) => (
              <span
                key={t}
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(148,163,184,0.45)',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, ArrowRight, Mail, Lock, XCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const PARTICLES = [
  { left: '8%',  bottom: '12%', delay: '0s',   dur: '4.2s', size: 4, color: 'rgba(29,210,215,0.75)' },
  { left: '18%', bottom: '35%', delay: '1.4s', dur: '3.8s', size: 3, color: 'rgba(159,141,212,0.65)' },
  { left: '30%', bottom: '20%', delay: '2.8s', dur: '5s',   size: 2, color: 'rgba(29,210,215,0.5)'  },
  { left: '72%', bottom: '18%', delay: '0.6s', dur: '4.5s', size: 5, color: 'rgba(29,210,215,0.55)' },
  { left: '82%', bottom: '40%', delay: '3.2s', dur: '3.6s', size: 3, color: 'rgba(159,141,212,0.7)' },
  { left: '90%', bottom: '60%', delay: '1s',   dur: '4.8s', size: 2, color: 'rgba(99,102,241,0.6)'  },
  { left: '50%', bottom: '8%',  delay: '2s',   dur: '4s',   size: 4, color: 'rgba(99,102,241,0.55)' },
  { left: '62%', bottom: '55%', delay: '4.5s', dur: '5.2s', size: 2, color: 'rgba(29,210,215,0.4)'  },
  { left: '42%', bottom: '72%', delay: '3.8s', dur: '3.5s', size: 3, color: 'rgba(159,141,212,0.45)'},
  { left: '15%', bottom: '65%', delay: '1.8s', dur: '4.6s', size: 2, color: 'rgba(29,210,215,0.35)' },
];

export default function Login() {
  const navigate    = useNavigate();
  const { login }   = useAuth();

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

  const focusTeal = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(29,210,215,0.5)';
    e.target.style.boxShadow   = '0 0 0 3px rgba(29,210,215,0.1), 0 1px 4px rgba(29,210,215,0.15)';
    e.target.style.background  = 'rgba(29,210,215,0.04)';
  };
  const blurReset = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(255,255,255,0.09)';
    e.target.style.boxShadow   = 'none';
    e.target.style.background  = 'rgba(255,255,255,0.05)';
  };

  const inputBase: React.CSSProperties = {
    width: '100%', height: 48, paddingLeft: 44, paddingRight: 16,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 14,
    color: 'rgba(220,235,255,0.9)',
    fontSize: 14, outline: 'none',
    transition: 'border-color 0.25s, box-shadow 0.25s, background 0.25s',
  };

  const btnPress = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!loading) e.currentTarget.style.transform = 'translateY(1px) scale(0.98)';
  };
  const btnRelHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!loading) e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
  };
  const btnLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'translateY(0) scale(1)';
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#060c17' }}
    >
      {/* ── Aurora blobs ── */}
      <div className="pointer-events-none absolute inset-0">
        <div style={{
          position: 'absolute', top: '-10%', left: '-5%',
          width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(29,210,215,0.18) 0%, transparent 65%)',
          filter: 'blur(60px)',
          animation: 'aurora-drift-1 18s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-15%', right: '-5%',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(159,141,212,0.18) 0%, transparent 65%)',
          filter: 'blur(60px)',
          animation: 'aurora-drift-2 22s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '55%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%)',
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
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            animation: `particle-rise ${p.dur} ${p.delay} ease-in-out infinite`,
          }} />
        ))}
      </div>

      {/* ── Dot grid (slow drift) ── */}
      <div className="pointer-events-none absolute inset-0" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        animation: 'bg-drift 12s linear infinite',
      }} />

      {/* ── Glass card ── */}
      <div
        className="auth-card relative z-10 w-full overflow-hidden"
        style={{
          maxWidth: 420,
          background: 'rgba(10, 18, 32, 0.78)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 28,
          backdropFilter: 'blur(44px)',
          WebkitBackdropFilter: 'blur(44px)',
          boxShadow: '0 0 0 1px rgba(29,210,215,0.08), 0 40px 100px rgba(0,0,0,0.72), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Top glow line — shimmer */}
        <div style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent 0%, #1DD2D7 35%, #9F8DD4 65%, transparent 100%)',
          backgroundSize: '200% 100%',
          borderRadius: '28px 28px 0 0',
          animation: 'shimmer-sweep 3s linear infinite',
        }} />

        {/* Scan line sweep */}
        <div className="scan-line pointer-events-none absolute left-0 right-0" style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent 10%, rgba(29,210,215,0.35) 50%, transparent 90%)',
          zIndex: 2,
        }} />

        <div className="px-8 pt-8 pb-7 relative z-10">

          {/* ── Logo block ── */}
          <div className="auth-logo flex flex-col items-center text-center mb-7">
            <div className="relative mb-4">
              <div className="halo-pulse" style={{
                position: 'absolute', inset: -10, borderRadius: 32,
                background: 'linear-gradient(135deg, rgba(29,210,215,0.35), rgba(159,141,212,0.35))',
                filter: 'blur(18px)', opacity: 0.75,
              }} />
              <div
                className="logo-float relative flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: 'linear-gradient(135deg, #1DD2D7 0%, #9F8DD4 100%)' }}
              >
                <Zap className="h-8 w-8 text-white" fill="white" />
                {/* inner shimmer */}
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 60%)',
                }} />
              </div>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight" style={{
              background: 'linear-gradient(135deg, #1DD7CE 0%, #e0d8ff 60%, #c4b8f0 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              ClientHunter
            </h1>
            <p className="text-xs font-medium mt-1" style={{ color: 'rgba(180,200,230,0.4)' }}>
              by Abyte Sol
            </p>

            {/* AI badge with ping dot */}
            <div
              className="auth-badge flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mt-3"
              style={{
                background: 'linear-gradient(135deg, rgba(29,210,215,0.12), rgba(159,141,212,0.1))',
                border: '1px solid rgba(29,210,215,0.22)',
                color: '#1DD2D7',
              }}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="dot-ping-ring absolute inline-flex h-full w-full rounded-full bg-current opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-current" style={{ boxShadow: '0 0 6px #1DD2D7' }} />
              </span>
              AI-Powered by LLaMA 3.3 70B
            </div>
          </div>

          {/* Divider */}
          <div className="auth-divider flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(180,200,230,0.3)' }}>
              Sign in
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="auth-form space-y-4">

            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2.5 text-sm rounded-2xl p-3"
                style={{
                  background: 'rgba(248,113,113,0.08)',
                  border: '1px solid rgba(248,113,113,0.22)',
                  color: '#fca5a5',
                  animation: 'badge-pop 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                }}
              >
                <XCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Email */}
            <div className="field-1 space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(180,200,230,0.45)' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'rgba(180,200,230,0.3)', transition: 'color 0.2s' }} />
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                  style={inputBase}
                  onFocus={focusTeal}
                  onBlur={blurReset}
                />
              </div>
            </div>

            {/* Password */}
            <div className="field-2 space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(180,200,230,0.45)' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'rgba(180,200,230,0.3)', transition: 'color 0.2s' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  style={{ ...inputBase, paddingRight: 48 }}
                  onFocus={focusTeal}
                  onBlur={blurReset}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    color: 'rgba(180,200,230,0.35)', cursor: 'pointer', background: 'none', border: 'none', padding: 0,
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(29,210,215,0.8)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(180,200,230,0.35)'; }}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 font-bold text-sm text-white ${!loading ? 'btn-breathe-teal' : ''}`}
              style={{
                height: 50, marginTop: 4,
                borderRadius: 14,
                background: loading
                  ? 'rgba(29,210,215,0.35)'
                  : 'linear-gradient(135deg, #1DD2D7 0%, #13a8b0 50%, #9F8DD4 100%)',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'transform 0.15s, background 0.2s',
              }}
              onMouseEnter={btnRelHover}
              onMouseLeave={btnLeave}
              onMouseDown={btnPress}
              onMouseUp={btnRelHover}
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
          <div className="auth-footer mt-5 pt-5 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-sm" style={{ color: 'rgba(180,200,230,0.4)' }}>
              Don't have an account?{' '}
              <Link
                to="/sign-up"
                className="font-semibold"
                style={{ color: '#1DD2D7', transition: 'opacity 0.2s, text-shadow 0.2s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.textShadow = '0 0 12px rgba(29,210,215,0.6)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.textShadow = 'none'; }}
              >
                Create one free
              </Link>
            </p>
          </div>

          {/* Bottom tech pills */}
          <div className="auth-pills flex items-center justify-center gap-2 mt-5 flex-wrap">
            {['⚡ Groq AI', '🔒 Secure', '🚀 Real-time'].map((t) => (
              <span
                key={t}
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(180,200,230,0.4)',
                  transition: 'border-color 0.2s, color 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLSpanElement).style.borderColor = 'rgba(29,210,215,0.25)';
                  (e.currentTarget as HTMLSpanElement).style.color = 'rgba(180,200,230,0.7)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLSpanElement).style.borderColor = 'rgba(255,255,255,0.07)';
                  (e.currentTarget as HTMLSpanElement).style.color = 'rgba(180,200,230,0.4)';
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

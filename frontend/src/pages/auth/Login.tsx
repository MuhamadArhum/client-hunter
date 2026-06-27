import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, ArrowRight, Mail, Lock, XCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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
        }} />
        <div style={{
          position: 'absolute', bottom: '-15%', right: '-5%',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(159,141,212,0.18) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '55%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%)',
          filter: 'blur(80px)',
        }} />
      </div>

      {/* ── Dot grid ── */}
      <div className="pointer-events-none absolute inset-0" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      {/* ── Glass card ── */}
      <div
        className="relative z-10 w-full"
        style={{
          maxWidth: 420,
          background: 'rgba(10, 18, 32, 0.75)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 28,
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          boxShadow: '0 0 0 1px rgba(29,210,215,0.07), 0 40px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Top glow line */}
        <div style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent 0%, #1DD2D7 35%, #9F8DD4 65%, transparent 100%)',
          borderRadius: '28px 28px 0 0',
        }} />

        <div className="px-8 pt-8 pb-7">

          {/* ── Logo block ── */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="relative mb-4">
              {/* Glow halo */}
              <div style={{
                position: 'absolute', inset: -8, borderRadius: 28,
                background: 'linear-gradient(135deg, rgba(29,210,215,0.3), rgba(159,141,212,0.3))',
                filter: 'blur(16px)', opacity: 0.7,
              }} />
              <div
                className="relative flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: 'linear-gradient(135deg, #1DD2D7 0%, #9F8DD4 100%)' }}
              >
                <Zap className="h-8 w-8 text-white" fill="white" />
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

            {/* AI badge */}
            <div
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mt-3"
              style={{
                background: 'linear-gradient(135deg, rgba(29,210,215,0.12), rgba(159,141,212,0.12))',
                border: '1px solid rgba(29,210,215,0.2)',
                color: '#1DD2D7',
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" style={{ boxShadow: '0 0 6px #1DD2D7' }} />
              AI-Powered by LLaMA 3.3 70B
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(180,200,230,0.3)' }}>
              Sign in
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2.5 text-sm rounded-2xl p-3"
                style={{
                  background: 'rgba(248,113,113,0.08)',
                  border: '1px solid rgba(248,113,113,0.2)',
                  color: '#fca5a5',
                }}
              >
                <XCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(180,200,230,0.45)' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'rgba(180,200,230,0.3)' }} />
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                  style={{
                    width: '100%', height: 48, paddingLeft: 44, paddingRight: 16,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: 14,
                    color: 'rgba(220,235,255,0.9)',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(29,210,215,0.45)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(29,210,215,0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.09)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(180,200,230,0.45)' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'rgba(180,200,230,0.3)' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  style={{
                    width: '100%', height: 48, paddingLeft: 44, paddingRight: 48,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: 14,
                    color: 'rgba(220,235,255,0.9)',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(29,210,215,0.45)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(29,210,215,0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.09)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    color: 'rgba(180,200,230,0.35)', cursor: 'pointer', background: 'none', border: 'none', padding: 0,
                  }}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 font-bold text-sm text-white transition-all duration-200"
              style={{
                height: 50,
                borderRadius: 14,
                background: loading
                  ? 'rgba(29,210,215,0.4)'
                  : 'linear-gradient(135deg, #1DD2D7 0%, #13a8b0 50%, #9F8DD4 100%)',
                boxShadow: loading ? 'none' : '0 4px 28px rgba(29,210,215,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                transform: 'translateY(0)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
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
          <div className="mt-5 pt-5 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-sm" style={{ color: 'rgba(180,200,230,0.4)' }}>
              Don't have an account?{' '}
              <Link
                to="/sign-up"
                className="font-semibold transition-opacity hover:opacity-75"
                style={{ color: '#1DD2D7' }}
              >
                Create one free
              </Link>
            </p>
          </div>

          {/* Bottom tech pills */}
          <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
            {['⚡ Groq AI', '🔒 Secure', '🚀 Real-time'].map((t) => (
              <span
                key={t}
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(180,200,230,0.4)',
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

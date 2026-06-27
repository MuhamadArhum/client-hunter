import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, ArrowRight, Mail, Lock, User, XCircle, CheckCircle } from 'lucide-react';
import api from '@/services/api';
import { cn } from '@/lib/utils';

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const s = password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const labels = ['', 'Weak', 'Good', 'Strong'];
  const colors = ['', '#f87171', '#fbbf24', '#34d399'];
  const bars   = ['', 'rgba(248,113,113,0.9)', 'rgba(251,191,36,0.9)', 'rgba(52,211,153,0.9)'];
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1.5">
        {[1, 2, 3].map((l) => (
          <div
            key={l}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: l <= s ? bars[s] : 'rgba(255,255,255,0.08)' }}
          />
        ))}
      </div>
      <p className="text-xs font-medium" style={{ color: colors[s] }}>{labels[s]} password</p>
    </div>
  );
}

export default function SignUp() {
  const navigate = useNavigate();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) { setError('All fields are required.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/register', { name, email, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 48,
    paddingLeft: 44, paddingRight: 16,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 14,
    color: 'rgba(220,235,255,0.9)',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const focusInput = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(159,141,212,0.5)';
    e.target.style.boxShadow = '0 0 0 3px rgba(159,141,212,0.1)';
  };
  const blurInput = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(255,255,255,0.09)';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#060c17' }}
    >
      {/* ── Aurora blobs ── */}
      <div className="pointer-events-none absolute inset-0">
        <div style={{
          position: 'absolute', top: '-5%', right: '-5%',
          width: 650, height: 650, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(159,141,212,0.18) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-5%',
          width: 580, height: 580, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(29,210,215,0.14) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', top: '35%', right: '55%',
          width: 360, height: 360, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%)',
          filter: 'blur(80px)',
        }} />
      </div>

      {/* ── Dot grid ── */}
      <div className="pointer-events-none absolute inset-0" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
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
          boxShadow: '0 0 0 1px rgba(159,141,212,0.07), 0 40px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Top glow line — purple variant */}
        <div style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent 0%, #9F8DD4 35%, #1DD2D7 65%, transparent 100%)',
          borderRadius: '28px 28px 0 0',
        }} />

        <div className="px-8 pt-8 pb-7">

          {/* ── Logo block ── */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-4">
              <div style={{
                position: 'absolute', inset: -8, borderRadius: 28,
                background: 'linear-gradient(135deg, rgba(159,141,212,0.3), rgba(29,210,215,0.3))',
                filter: 'blur(16px)', opacity: 0.7,
              }} />
              <div
                className="relative flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: 'linear-gradient(135deg, #9F8DD4 0%, #1DD2D7 100%)' }}
              >
                <Zap className="h-8 w-8 text-white" fill="white" />
              </div>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight" style={{
              background: 'linear-gradient(135deg, #c4b8f0 0%, #e0d8ff 50%, #1DD7CE 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              ClientHunter
            </h1>
            <p className="text-xs font-medium mt-1" style={{ color: 'rgba(180,200,230,0.4)' }}>
              by Abyte Sol
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(180,200,230,0.3)' }}>
              Create account
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          </div>

          {/* ── Success state ── */}
          {success ? (
            <div className="flex flex-col items-center text-center py-6 gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(29,210,215,0.2))' }}
              >
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              </div>
              <div>
                <p className="text-base font-bold text-white">Account created!</p>
                <p className="text-sm mt-1" style={{ color: 'rgba(180,200,230,0.45)' }}>
                  Redirecting to login...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* ── Form ── */}
              <form onSubmit={handleSubmit} className="space-y-4">

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

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(180,200,230,0.45)' }}>
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'rgba(180,200,230,0.3)' }} />
                    <input
                      type="text"
                      placeholder="John Smith"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      disabled={loading}
                      style={inputStyle}
                      onFocus={focusInput}
                      onBlur={blurInput}
                    />
                  </div>
                </div>

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
                      style={inputStyle}
                      onFocus={focusInput}
                      onBlur={blurInput}
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
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      disabled={loading}
                      style={{ ...inputStyle, paddingRight: 48 }}
                      onFocus={focusInput}
                      onBlur={blurInput}
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
                  <PasswordStrength password={password} />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 font-bold text-sm text-white"
                  style={{
                    height: 50, marginTop: 4,
                    borderRadius: 14,
                    background: loading
                      ? 'rgba(159,141,212,0.4)'
                      : 'linear-gradient(135deg, #9F8DD4 0%, #7c6fc4 50%, #1DD2D7 100%)',
                    boxShadow: loading ? 'none' : '0 4px 28px rgba(159,141,212,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
                    border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Sign in link */}
              <div className="mt-5 pt-5 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-sm" style={{ color: 'rgba(180,200,230,0.4)' }}>
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-semibold transition-opacity hover:opacity-75"
                    style={{ color: '#b8a8e4' }}
                  >
                    Sign in
                  </Link>
                </p>
              </div>

              {/* Bottom pills */}
              <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
                {['✦ Free to start', '🔒 Secure', '🤖 AI-Powered'].map((t) => (
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

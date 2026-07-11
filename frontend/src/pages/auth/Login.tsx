import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Mail, Lock, XCircle, Zap, TrendingUp, Users, Target, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const STATS = [
  { value: '10x', label: 'Faster Outreach' },
  { value: '3.2k', label: 'Leads Generated' },
  { value: '94%', label: 'Response Rate' },
];

const FEATURES = [
  { icon: Target,     title: 'AI Lead Scoring',        desc: 'Instantly qualify and rank leads by conversion potential.' },
  { icon: Mail,       title: 'Smart Email Outreach',   desc: 'Personalized cold emails written and sent automatically.' },
  { icon: TrendingUp, title: 'Pipeline Analytics',     desc: 'Real-time insights across your full sales pipeline.' },
];

export default function Login() {
  const navigate  = useNavigate();
  const { login } = useAuth();

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

  const focusGreen = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(33,246,168,0.5)';
    e.target.style.boxShadow   = '0 0 0 3px rgba(33,246,168,0.08)';
    e.target.style.background  = 'rgba(33,246,168,0.04)';
  };
  const blurReset = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(255,255,255,0.08)';
    e.target.style.boxShadow   = 'none';
    e.target.style.background  = 'rgba(255,255,255,0.04)';
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 48, paddingLeft: 44, paddingRight: 16,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    color: '#e2e8f0',
    fontSize: 14, outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#080e09' }}>

      {/* ════════════════════════════════
          LEFT PANEL — Branding
      ════════════════════════════════ */}
      <div
        className="hidden lg:flex lg:w-[58%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(145deg, #050c06 0%, #0a1a0c 50%, #071209 100%)' }}
      >
        {/* Background grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `
            linear-gradient(rgba(33,246,168,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(33,246,168,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }} />

        {/* Aurora blobs */}
        <div className="absolute pointer-events-none" style={{ top: '-20%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(33,246,168,0.12) 0%, transparent 65%)', filter: 'blur(80px)', animation: 'aurora-drift-1 20s ease-in-out infinite' }} />
        <div className="absolute pointer-events-none" style={{ bottom: '-10%', right: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 65%)', filter: 'blur(80px)', animation: 'aurora-drift-2 25s ease-in-out infinite' }} />
        <div className="absolute pointer-events-none" style={{ top: '40%', right: '-5%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(5,150,105,0.08) 0%, transparent 65%)', filter: 'blur(60px)', animation: 'aurora-drift-3 30s ease-in-out infinite' }} />

        {/* Top: Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}
            >
              <Zap className="h-5 w-5 text-gray-900" fill="currentColor" />
            </div>
            <div>
              <p className="text-base font-bold text-white leading-none">Abyte Hunt</p>
              <p className="text-[10px] font-medium mt-0.5" style={{ color: 'rgba(148,163,184,0.4)' }}>by Abyte Sol</p>
            </div>
          </div>
        </div>

        {/* Middle: Hero text + features */}
        <div className="relative z-10 space-y-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ background: 'rgba(33,246,168,0.08)', border: '1px solid rgba(33,246,168,0.15)' }}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold" style={{ color: '#21F6A8' }}>AI-Powered Sales Platform</span>
            </div>

            <h1 className="text-5xl font-black leading-[1.1] tracking-tight text-white mb-4">
              Hunt Clients.<br />
              <span style={{
                background: 'linear-gradient(135deg, #21F6A8 0%, #6EE7B7 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                Close Deals.
              </span><br />
              Grow Faster.
            </h1>
            <p className="text-base leading-relaxed" style={{ color: 'rgba(148,163,184,0.6)', maxWidth: 420 }}>
              Automate your entire client acquisition pipeline with AI. From lead discovery to signed contracts.
            </p>
          </div>

          {/* Feature cards */}
          <div className="space-y-3">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-2xl p-4 transition-all duration-300"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5"
                  style={{ background: 'rgba(33,246,168,0.1)', border: '1px solid rgba(33,246,168,0.15)' }}
                >
                  <f.icon className="h-4 w-4" style={{ color: '#21F6A8' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-0.5">{f.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(148,163,184,0.5)' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Stats */}
        <div className="relative z-10">
          <div className="grid grid-cols-3 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-black" style={{
                  background: 'linear-gradient(135deg, #21F6A8, #6EE7B7)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  {s.value}
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgba(148,163,184,0.45)' }}>{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {['MA', 'AH', 'SB', 'KR'].map((init) => (
                  <div
                    key={init}
                    className="h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold text-gray-900 ring-2"
                    style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)', ringColor: '#080e09' }}
                  >
                    {init}
                  </div>
                ))}
              </div>
              <p className="text-xs" style={{ color: 'rgba(148,163,184,0.45)' }}>
                Join agencies already using Abyte Hunt
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════
          RIGHT PANEL — Login Form
      ════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative overflow-hidden" style={{ background: '#0a1209' }}>

        {/* Subtle bg glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(33,246,168,0.06) 0%, transparent 60%)',
        }} />

        {/* Mobile logo */}
        <div className="absolute top-6 left-6 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}>
            <Zap className="h-4 w-4 text-gray-900" fill="currentColor" />
          </div>
          <span className="text-sm font-bold text-white">Abyte Hunt</span>
        </div>

        <div className="relative z-10 w-full" style={{ maxWidth: 400 }}>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-white mb-2">Welcome back</h2>
            <p className="text-sm" style={{ color: 'rgba(148,163,184,0.55)' }}>
              Sign in to your dashboard and start hunting clients.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2.5 text-sm rounded-xl p-3 mb-5"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.18)',
                color: '#FCA5A5',
                animation: 'badge-pop 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              }}
            >
              <XCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(148,163,184,0.45)' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'rgba(148,163,184,0.3)' }} />
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                  style={inputStyle}
                  onFocus={focusGreen}
                  onBlur={blurReset}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(148,163,184,0.45)' }}>
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold transition-colors"
                  style={{ color: 'rgba(33,246,168,0.6)', textDecoration: 'none' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#21F6A8'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(33,246,168,0.6)'; }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'rgba(148,163,184,0.3)' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  style={{ ...inputStyle, paddingRight: 46 }}
                  onFocus={focusGreen}
                  onBlur={blurReset}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    color: 'rgba(148,163,184,0.35)', cursor: 'pointer', background: 'none', border: 'none', padding: 0,
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(33,246,168,0.7)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(148,163,184,0.35)'; }}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2.5 font-bold text-sm text-gray-900 ${!loading ? 'btn-breathe-green' : ''}`}
              style={{
                height: 50,
                marginTop: 8,
                borderRadius: 12,
                background: loading
                  ? 'rgba(33,246,168,0.3)'
                  : 'linear-gradient(135deg, #21F6A8 0%, #10B981 100%)',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s, transform 0.15s',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(33,246,168,0.25)',
              }}
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span className="text-xs" style={{ color: 'rgba(148,163,184,0.3)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Sign up */}
          <p className="text-center text-sm" style={{ color: 'rgba(148,163,184,0.45)' }}>
            Don't have an account?{' '}
            <Link
              to="/sign-up"
              className="font-semibold transition-colors"
              style={{ color: '#21F6A8', textDecoration: 'none' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.75'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1'; }}
            >
              Create free account →
            </Link>
          </p>

          {/* Trust badges */}
          <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center justify-center gap-5">
              {[
                { icon: CheckCircle2, text: 'Secure JWT Auth' },
                { icon: Zap,          text: 'Groq AI Engine' },
                { icon: Users,        text: 'Real-time Sync' },
              ].map((b) => (
                <div key={b.text} className="flex items-center gap-1.5">
                  <b.icon className="h-3 w-3 shrink-0" style={{ color: 'rgba(33,246,168,0.5)' }} />
                  <span className="text-[10px] font-medium" style={{ color: 'rgba(148,163,184,0.35)' }}>{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Zap, ArrowLeft, XCircle, CheckCircle } from 'lucide-react';
import api from '@/services/api';

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Something went wrong. Please try again.');
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
    e.target.style.boxShadow   = '0 0 0 3px rgba(33,246,168,0.1)';
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
      {/* Aurora blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div style={{ position:'absolute', top:'-10%', left:'-5%', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle, rgba(33,246,168,0.18) 0%, transparent 65%)', filter:'blur(60px)', animation:'aurora-drift-1 18s ease-in-out infinite' }} />
        <div style={{ position:'absolute', bottom:'-15%', right:'-5%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(16,185,129,0.16) 0%, transparent 65%)', filter:'blur(60px)', animation:'aurora-drift-2 22s ease-in-out infinite' }} />
      </div>
      {/* Dot grid */}
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage:'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize:'32px 32px' }} />

      {/* Glass card */}
      <div
        className="auth-card relative z-10 w-full overflow-hidden"
        style={{
          maxWidth: 400,
          background: 'rgba(10, 18, 12, 0.85)',
          border: '1px solid rgba(33,246,168,0.12)',
          borderRadius: 20,
          backdropFilter: 'blur(48px)',
          WebkitBackdropFilter: 'blur(48px)',
          boxShadow: '0 0 0 1px rgba(33,246,168,0.08), 0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <div style={{ height:1, background:'linear-gradient(90deg, transparent 0%, #21F6A8 35%, #10B981 65%, transparent 100%)', borderRadius:'20px 20px 0 0', animation:'shimmer-sweep 3s linear infinite' }} />

        <div className="px-7 pt-7 pb-6 relative z-10">
          {/* Logo */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-4">
              <div style={{ position:'absolute', inset:-10, borderRadius:28, background:'linear-gradient(135deg, rgba(33,246,168,0.3), rgba(16,185,129,0.3))', filter:'blur(20px)', opacity:0.7 }} />
              <div className="logo-float relative flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background:'linear-gradient(135deg, #21F6A8 0%, #10B981 100%)' }}>
                <Zap className="h-7 w-7 text-gray-900" fill="currentColor" />
              </div>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight" style={{ background:'linear-gradient(135deg, #21F6A8 0%, #A7F3D0 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              Reset Password
            </h1>
            <p className="text-xs font-medium mt-1" style={{ color:'rgba(148,163,184,0.45)' }}>Abyte Hunt by Abyte Sol</p>
          </div>

          {success ? (
            <div className="space-y-5">
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background:'rgba(33,246,168,0.1)', border:'1px solid rgba(33,246,168,0.2)' }}>
                  <CheckCircle className="h-7 w-7" style={{ color: '#21F6A8' }} />
                </div>
                <p className="text-sm font-semibold" style={{ color:'rgba(226,232,240,0.9)' }}>Check your inbox</p>
                <p className="text-xs leading-relaxed" style={{ color:'rgba(148,163,184,0.55)' }}>
                  If an account exists for <span className="font-medium" style={{ color: '#21F6A8' }}>{email}</span>, a reset link has been sent. Check your spam folder too.
                </p>
              </div>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 w-full font-semibold text-sm"
                style={{ height:46, borderRadius:10, background:'rgba(33,246,168,0.1)', border:'1px solid rgba(33,246,168,0.2)', color:'#0D9C6A', textDecoration:'none' }}
              >
                <ArrowLeft className="h-4 w-4" /> Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <p className="text-xs text-center mb-5" style={{ color:'rgba(148,163,184,0.5)', lineHeight:1.7 }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {error && (
                <div className="flex items-center gap-2.5 text-sm rounded-xl p-3 mb-4" style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#FCA5A5', animation:'badge-pop 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
                  <XCircle className="h-4 w-4 shrink-0" />{error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color:'rgba(148,163,184,0.5)' }}>Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color:'rgba(148,163,184,0.35)' }} />
                    <input
                      type="email" placeholder="you@company.com"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email" disabled={loading}
                      style={inputBase} onFocus={focusGreen} onBlur={blurReset}
                    />
                  </div>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 font-bold text-sm text-gray-900 btn-breathe-green"
                  style={{ height:46, borderRadius:10, background: loading ? 'rgba(33,246,168,0.35)' : 'linear-gradient(135deg, #21F6A8 0%, #10B981 100%)', border:'none', cursor: loading ? 'not-allowed' : 'pointer', transition:'transform 0.15s' }}
                >
                  {loading
                    ? <><span className="h-4 w-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />Sending link...</>
                    : 'Send Reset Link'
                  }
                </button>
              </form>

              <div className="mt-5 pt-5 text-center" style={{ borderTop:'1px solid rgba(255,255,255,0.07)' }}>
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-1.5 text-sm font-semibold transition-colors"
                  style={{ color:'rgba(148,163,184,0.5)', textDecoration:'none' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#0D9C6A'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(148,163,184,0.5)'; }}
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

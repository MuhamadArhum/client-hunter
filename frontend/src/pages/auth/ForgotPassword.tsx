import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Zap, ArrowLeft, XCircle, CheckCircle } from 'lucide-react';
import api from '@/services/api';

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: '#060c17' }}>
      {/* Aurora blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div style={{ position:'absolute', top:'-10%', left:'-5%', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle, rgba(29,210,215,0.18) 0%, transparent 65%)', filter:'blur(60px)', animation:'aurora-drift-1 18s ease-in-out infinite' }} />
        <div style={{ position:'absolute', bottom:'-15%', right:'-5%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(159,141,212,0.18) 0%, transparent 65%)', filter:'blur(60px)', animation:'aurora-drift-2 22s ease-in-out infinite' }} />
      </div>
      {/* Dot grid */}
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage:'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize:'32px 32px' }} />

      {/* Glass card */}
      <div className="relative z-10 w-full overflow-hidden" style={{ maxWidth:420, background:'rgba(10,18,32,0.78)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:28, backdropFilter:'blur(44px)', WebkitBackdropFilter:'blur(44px)', boxShadow:'0 0 0 1px rgba(29,210,215,0.08), 0 40px 100px rgba(0,0,0,0.72), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
        {/* Top shimmer line */}
        <div style={{ height:1, background:'linear-gradient(90deg, transparent 0%, #1DD2D7 35%, #9F8DD4 65%, transparent 100%)', borderRadius:'28px 28px 0 0', animation:'shimmer-sweep 3s linear infinite' }} />

        <div className="px-8 pt-8 pb-7 relative z-10">
          {/* Logo */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="relative mb-4">
              <div style={{ position:'absolute', inset:-10, borderRadius:32, background:'linear-gradient(135deg, rgba(29,210,215,0.35), rgba(159,141,212,0.35))', filter:'blur(18px)', opacity:0.75 }} />
              <div className="logo-float relative flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background:'linear-gradient(135deg, #1DD2D7 0%, #9F8DD4 100%)' }}>
                <Zap className="h-8 w-8 text-white" fill="white" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ background:'linear-gradient(135deg, #1DD7CE 0%, #e0d8ff 60%, #c4b8f0 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              Forgot Password
            </h1>
            <p className="text-xs font-medium mt-1" style={{ color:'rgba(180,200,230,0.4)' }}>Abyte Hunt by Abyte Sol</p>
          </div>

          {success ? (
            <div className="space-y-5">
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background:'rgba(29,210,215,0.12)', border:'1px solid rgba(29,210,215,0.25)' }}>
                  <CheckCircle className="h-7 w-7" style={{ color:'#1DD2D7' }} />
                </div>
                <p className="text-sm font-semibold" style={{ color:'rgba(220,235,255,0.9)' }}>Check your inbox</p>
                <p className="text-xs leading-relaxed" style={{ color:'rgba(180,200,230,0.5)' }}>
                  If an account exists for <span style={{ color:'#1DD2D7' }}>{email}</span>, a reset link has been sent. Check your spam folder too.
                </p>
              </div>
              <Link to="/login" className="flex items-center justify-center gap-2 w-full font-semibold text-sm" style={{ height:46, borderRadius:14, background:'rgba(29,210,215,0.1)', border:'1px solid rgba(29,210,215,0.2)', color:'#1DD2D7', textDecoration:'none' }}>
                <ArrowLeft className="h-4 w-4" /> Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <p className="text-xs text-center mb-5" style={{ color:'rgba(180,200,230,0.45)', lineHeight:1.6 }}>
                Enter your email and we'll send you a link to reset your password.
              </p>

              {error && (
                <div className="flex items-center gap-2.5 text-sm rounded-2xl p-3 mb-4" style={{ background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.22)', color:'#fca5a5', animation:'badge-pop 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>
                  <XCircle className="h-4 w-4 shrink-0" />{error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color:'rgba(180,200,230,0.45)' }}>Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color:'rgba(180,200,230,0.3)' }} />
                    <input
                      type="email" placeholder="you@company.com"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email" disabled={loading}
                      style={inputBase} onFocus={focusTeal} onBlur={blurReset}
                    />
                  </div>
                </div>

                <button
                  type="submit" disabled={loading}
                  className={`w-full flex items-center justify-center gap-2 font-bold text-sm text-white ${!loading ? 'btn-breathe-teal' : ''}`}
                  style={{ height:50, borderRadius:14, background: loading ? 'rgba(29,210,215,0.35)' : 'linear-gradient(135deg, #1DD2D7 0%, #13a8b0 50%, #9F8DD4 100%)', border:'none', cursor: loading ? 'not-allowed' : 'pointer', transition:'transform 0.15s, background 0.2s' }}
                >
                  {loading ? (
                    <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending link...</>
                  ) : 'Send Reset Link'}
                </button>
              </form>

              <div className="mt-5 pt-5 text-center" style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm font-semibold" style={{ color:'rgba(180,200,230,0.5)', textDecoration:'none' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#1DD2D7'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(180,200,230,0.5)'; }}
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

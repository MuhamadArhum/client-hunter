import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Zap, ArrowRight, Star } from 'lucide-react';

const STARS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  top: Math.random() * 100,
  left: Math.random() * 100,
  size: Math.random() * 2 + 1,
  opacity: Math.random() * 0.6 + 0.1,
}));

export default function LoginV3() {
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #0f0a1e 0%, #1a0a2e 50%, #0d0820 100%)' }}>

      {/* Stars */}
      {STARS.map((s) => (
        <div key={s.id} className="absolute rounded-full" style={{ top: `${s.top}%`, left: `${s.left}%`, width: s.size, height: s.size, background: `rgba(255,255,255,${s.opacity})` }} />
      ))}

      {/* Blobs */}
      <div className="absolute pointer-events-none" style={{ top: '-15%', left: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 65%)', filter: 'blur(80px)' }} />
      <div className="absolute pointer-events-none" style={{ bottom: '-10%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 65%)', filter: 'blur(80px)' }} />
      <div className="absolute pointer-events-none" style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 65%)', filter: 'blur(60px)' }} />

      {/* Glass card */}
      <div
        className="relative z-10 w-full rounded-3xl overflow-hidden"
        style={{
          maxWidth: 440,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(168,85,247,0.2)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        {/* Purple top glow */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.6), transparent)' }} />

        <div className="p-10">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl relative"
              style={{ background: 'linear-gradient(135deg, #A855F7, #6366F1)', boxShadow: '0 8px 30px rgba(168,85,247,0.4)' }}
            >
              <Zap className="h-6 w-6 text-white" fill="currentColor" />
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-yellow-400 flex items-center justify-center">
                <Star className="h-2.5 w-2.5 text-yellow-900" fill="currentColor" />
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-white mb-2">Welcome Back</h1>
            <p className="text-sm" style={{ color: 'rgba(196,181,253,0.6)' }}>
              Enter the galaxy of AI-powered sales
            </p>
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: 'Google', bg: 'rgba(255,255,255,0.07)' },
              { label: 'GitHub', bg: 'rgba(255,255,255,0.07)' },
            ].map((btn) => (
              <button
                key={btn.label}
                type="button"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
                style={{ background: btn.bg, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(168,85,247,0.15)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = btn.bg; }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(168,85,247,0.2)' }} />
            <span className="text-xs" style={{ color: 'rgba(196,181,253,0.4)' }}>or sign in with email</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(168,85,247,0.2)' }} />
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(196,181,253,0.7)' }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'rgba(168,85,247,0.5)' }} />
                <input
                  type="email"
                  placeholder="you@company.com"
                  style={{
                    width: '100%', height: 46, paddingLeft: 42, paddingRight: 14,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(168,85,247,0.2)',
                    borderRadius: 12, color: '#e2e8f0', fontSize: 14, outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(168,85,247,0.6)'; e.target.style.background = 'rgba(168,85,247,0.08)'; e.target.style.boxShadow = '0 0 0 3px rgba(168,85,247,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(168,85,247,0.2)'; e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold" style={{ color: 'rgba(196,181,253,0.7)' }}>Password</label>
                <Link to="/login-preview" className="text-xs font-semibold" style={{ color: '#A855F7', textDecoration: 'none' }}>Forgot?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'rgba(168,85,247,0.5)' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  style={{
                    width: '100%', height: 46, paddingLeft: 42, paddingRight: 46,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(168,85,247,0.2)',
                    borderRadius: 12, color: '#e2e8f0', fontSize: 14, outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(168,85,247,0.6)'; e.target.style.background = 'rgba(168,85,247,0.08)'; e.target.style.boxShadow = '0 0 0 3px rgba(168,85,247,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(168,85,247,0.2)'; e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(196,181,253,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 font-bold text-sm text-white"
              style={{
                height: 48, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
                boxShadow: '0 8px 30px rgba(168,85,247,0.4)',
              }}
            >
              Enter Dashboard <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: 'rgba(196,181,253,0.4)' }}>
            New here?{' '}
            <Link to="/login-preview" className="font-semibold" style={{ color: '#A855F7', textDecoration: 'none' }}>Create account</Link>
          </p>

          <div className="mt-4 text-center">
            <Link to="/login-preview" className="text-xs" style={{ color: 'rgba(196,181,253,0.25)', textDecoration: 'none' }}>← Back to design selector</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

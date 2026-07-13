import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Cpu, Terminal, Wifi, ArrowRight } from 'lucide-react';

export default function LoginV5() {
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState('');

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#000000' }}
    >
      {/* Animated grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Corner glow top-left cyan */}
      <div className="absolute pointer-events-none" style={{ top: '-10%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,255,255,0.12) 0%, transparent 60%)', filter: 'blur(60px)' }} />
      {/* Corner glow bottom-right magenta */}
      <div className="absolute pointer-events-none" style={{ bottom: '-10%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,0,255,0.12) 0%, transparent 60%)', filter: 'blur(60px)' }} />

      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
          mixBlendMode: 'overlay',
        }}
      />

      {/* Main container */}
      <div className="relative z-10 w-full" style={{ maxWidth: 900, display: 'flex', gap: 0 }}>

        {/* LEFT terminal panel */}
        <div
          className="hidden lg:flex lg:flex-1 flex-col p-10 relative overflow-hidden"
          style={{
            background: 'rgba(0,255,255,0.02)',
            border: '1px solid rgba(0,255,255,0.15)',
            borderRight: 'none',
            borderRadius: '12px 0 0 12px',
          }}
        >
          {/* Top bar */}
          <div className="flex items-center gap-2 mb-6 pb-4" style={{ borderBottom: '1px solid rgba(0,255,255,0.1)' }}>
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: '#FF5F57' }} />
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: '#FEBC2E' }} />
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: '#28C840' }} />
            <span className="ml-3 text-[10px] font-mono" style={{ color: 'rgba(0,255,255,0.4)' }}>abyte-hunt v2.4.1 — terminal</span>
          </div>

          {/* Terminal text */}
          <div className="font-mono text-xs space-y-1.5 flex-1" style={{ color: 'rgba(0,255,255,0.6)', lineHeight: 1.8 }}>
            <p><span style={{ color: 'rgba(0,255,255,0.3)' }}>$</span> <span style={{ color: '#00FF41' }}>init</span> abyte-hunt-system</p>
            <p style={{ color: 'rgba(0,255,255,0.4)' }}>{'> Loading AI modules...'}</p>
            <p style={{ color: 'rgba(0,255,255,0.4)' }}>{'> Connecting to lead database...'}</p>
            <p><span style={{ color: '#00FF41' }}>✓</span> {'Groq LLM engine — ONLINE'}</p>
            <p><span style={{ color: '#00FF41' }}>✓</span> {'Apollo API — CONNECTED'}</p>
            <p><span style={{ color: '#00FF41' }}>✓</span> {'Email sequencer — READY'}</p>
            <p><span style={{ color: 'rgba(0,255,255,0.3)' }}>$</span> status --all</p>
            <div className="mt-3 p-3 rounded" style={{ background: 'rgba(0,255,65,0.05)', border: '1px solid rgba(0,255,65,0.15)' }}>
              <p style={{ color: '#00FF41' }}>SYSTEM STATUS: OPERATIONAL</p>
              <p style={{ color: 'rgba(0,255,65,0.6)' }}>LEADS QUEUED: 2,841</p>
              <p style={{ color: 'rgba(0,255,65,0.6)' }}>EMAILS SENT: 14,302</p>
              <p style={{ color: 'rgba(0,255,65,0.6)' }}>DEALS CLOSED: 94</p>
            </div>
            <p className="mt-3"><span style={{ color: 'rgba(0,255,255,0.3)' }}>$</span> <span className="animate-pulse">█</span></p>
          </div>

          {/* Bottom icons */}
          <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: '1px solid rgba(0,255,255,0.1)' }}>
            {[Cpu, Terminal, Wifi].map((Icon, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Icon className="h-3 w-3" style={{ color: 'rgba(0,255,255,0.5)' }} />
                <div className="h-1 w-8 rounded-full overflow-hidden" style={{ background: 'rgba(0,255,255,0.1)' }}>
                  <div className="h-full rounded-full" style={{ width: `${[85, 92, 99][i]}%`, background: '#00FFFF' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT form */}
        <div
          className="flex-1 flex flex-col justify-center p-8 lg:p-10 relative"
          style={{
            background: 'rgba(0,0,20,0.9)',
            border: '1px solid rgba(255,0,255,0.2)',
            borderRadius: '0 12px 12px 0',
          }}
        >
          {/* Right-side top glow */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, rgba(0,255,255,0.3), rgba(255,0,255,0.3))' }} />
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, rgba(255,0,255,0.3), rgba(0,255,255,0.3))' }} />

          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ background: 'transparent', border: '1px solid rgba(0,255,255,0.5)', boxShadow: '0 0 15px rgba(0,255,255,0.2), inset 0 0 15px rgba(0,255,255,0.05)' }}
            >
              <span className="text-xs font-black font-mono" style={{ color: '#00FFFF' }}>AH</span>
            </div>
            <div>
              <p className="font-black font-mono text-sm tracking-widest" style={{ color: '#00FFFF', textShadow: '0 0 10px rgba(0,255,255,0.5)' }}>ABYTE_HUNT</p>
              <p className="text-[9px] font-mono tracking-widest" style={{ color: 'rgba(255,0,255,0.5)' }}>NEURAL_SALES_OS</p>
            </div>
          </div>

          <div className="mb-7">
            <h2 className="text-xl font-black font-mono mb-1" style={{ color: '#00FFFF', textShadow: '0 0 20px rgba(0,255,255,0.4)' }}>
              AUTH_REQUIRED
            </h2>
            <p className="text-xs font-mono" style={{ color: 'rgba(255,0,255,0.5)' }}>
              {'> Enter credentials to access system'}
            </p>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono mb-1.5" style={{ color: 'rgba(0,255,255,0.5)' }}>
                {'// USER_IDENTIFIER'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'rgba(0,255,255,0.3)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@abytesol.io"
                  style={{
                    width: '100%', height: 46, paddingLeft: 42, paddingRight: 14,
                    background: 'rgba(0,255,255,0.03)',
                    border: '1px solid rgba(0,255,255,0.2)',
                    borderRadius: 4,
                    color: '#00FFFF', fontSize: 13, outline: 'none',
                    fontFamily: 'monospace',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#00FFFF'; e.target.style.boxShadow = '0 0 15px rgba(0,255,255,0.15)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(0,255,255,0.2)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-mono" style={{ color: 'rgba(0,255,255,0.5)' }}>{'// ACCESS_KEY'}</label>
                <Link to="/login-preview" className="text-[10px] font-mono" style={{ color: 'rgba(255,0,255,0.6)', textDecoration: 'none' }}>RESET_KEY?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'rgba(0,255,255,0.3)' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%', height: 46, paddingLeft: 42, paddingRight: 46,
                    background: 'rgba(0,255,255,0.03)',
                    border: '1px solid rgba(0,255,255,0.2)',
                    borderRadius: 4,
                    color: '#00FFFF', fontSize: 13, outline: 'none',
                    fontFamily: 'monospace',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#00FFFF'; e.target.style.boxShadow = '0 0 15px rgba(0,255,255,0.15)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(0,255,255,0.2)'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Progress bar decoration */}
            {email && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono" style={{ color: 'rgba(0,255,255,0.4)' }}>SIGNAL:</span>
                <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(0,255,255,0.1)' }}>
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(email.length * 5, 100)}%`, background: 'linear-gradient(90deg, #00FFFF, #FF00FF)' }} />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 font-black text-sm font-mono"
              style={{
                height: 48, borderRadius: 4, border: '1px solid rgba(0,255,255,0.5)', cursor: 'pointer',
                background: 'rgba(0,255,255,0.08)',
                color: '#00FFFF',
                letterSpacing: '0.1em',
                boxShadow: '0 0 20px rgba(0,255,255,0.15), inset 0 0 20px rgba(0,255,255,0.05)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.background = 'rgba(0,255,255,0.15)';
                btn.style.boxShadow = '0 0 30px rgba(0,255,255,0.3), inset 0 0 30px rgba(0,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.background = 'rgba(0,255,255,0.08)';
                btn.style.boxShadow = '0 0 20px rgba(0,255,255,0.15), inset 0 0 20px rgba(0,255,255,0.05)';
              }}
            >
              AUTHENTICATE <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="text-center text-[10px] font-mono mt-6" style={{ color: 'rgba(0,255,255,0.3)' }}>
            NO_ACCOUNT? <Link to="/login-preview" className="font-bold" style={{ color: 'rgba(255,0,255,0.6)', textDecoration: 'none' }}>REGISTER_NODE</Link>
          </p>

          <div className="mt-4 text-center">
            <Link to="/login-preview" className="text-[10px] font-mono" style={{ color: 'rgba(0,255,255,0.2)', textDecoration: 'none' }}>{'<< BACK_TO_SELECTOR'}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

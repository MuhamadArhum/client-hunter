import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Building2, Globe, Award, TrendingUp } from 'lucide-react';

const METRICS = [
  { value: '$2.4M', label: 'Revenue Generated', icon: TrendingUp },
  { value: '1,200+', label: 'Enterprise Clients', icon: Building2 },
  { value: '38', label: 'Countries Active', icon: Globe },
  { value: 'ISO 27001', label: 'Certified', icon: Award },
];

export default function LoginV4() {
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ background: '#0A1628' }}>

      {/* LEFT — Bold branding */}
      <div
        className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col"
        style={{ background: 'linear-gradient(160deg, #0A1628 0%, #0F2044 60%, #0C1A38 100%)' }}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #F59E0B, #EF4444, #F59E0B)' }} />

        <div className="flex-1 flex flex-col justify-between p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded" style={{ background: '#F59E0B' }}>
              <span className="text-xs font-black text-gray-900">AH</span>
            </div>
            <div>
              <p className="text-sm font-black text-white tracking-wider uppercase">Abyte Hunt</p>
              <p className="text-[9px] tracking-widest uppercase" style={{ color: '#F59E0B' }}>Enterprise Sales Platform</p>
            </div>
          </div>

          {/* Hero */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="h-px flex-1" style={{ background: 'rgba(245,158,11,0.3)' }} />
                <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#F59E0B' }}>Trusted by Fortune 500</span>
                <div className="h-px flex-1" style={{ background: 'rgba(245,158,11,0.3)' }} />
              </div>

              <h1 className="text-5xl font-black text-white leading-[1.05] tracking-tight">
                ENTERPRISE<br />
                <span style={{ color: '#F59E0B' }}>SALES</span><br />
                INTELLIGENCE
              </h1>
              <div className="mt-4 w-16 h-1" style={{ background: '#F59E0B' }} />
            </div>

            <p className="text-sm leading-relaxed" style={{ color: 'rgba(148,163,184,0.6)', maxWidth: 380 }}>
              The world's most powerful AI sales platform. Trusted by enterprise teams across 38 countries to accelerate revenue growth.
            </p>

            {/* Metric grid */}
            <div className="grid grid-cols-2 gap-4">
              {METRICS.map((m) => (
                <div
                  key={m.label}
                  className="p-4 rounded-lg relative overflow-hidden"
                  style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}
                >
                  <div className="absolute top-0 left-0 w-1 h-full" style={{ background: '#F59E0B' }} />
                  <m.icon className="h-4 w-4 mb-2" style={{ color: '#F59E0B' }} />
                  <p className="text-lg font-black text-white">{m.value}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(148,163,184,0.5)' }}>{m.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance badges */}
          <div className="flex items-center gap-4">
            {['SOC2', 'GDPR', 'HIPAA', 'ISO27001'].map((badge) => (
              <div
                key={badge}
                className="px-2.5 py-1 rounded text-[9px] font-black tracking-widest"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}
              >
                {badge}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 relative" style={{ background: '#06101E' }}>

        {/* Top gold line */}
        <div className="absolute top-0 left-0 right-0 h-1 lg:hidden" style={{ background: 'linear-gradient(90deg, #F59E0B, #EF4444, #F59E0B)' }} />

        <div className="w-full" style={{ maxWidth: 380 }}>
          {/* Mobile header */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded" style={{ background: '#F59E0B' }}>
              <span className="text-xs font-black text-gray-900">AH</span>
            </div>
            <span className="font-black text-white tracking-wider uppercase text-sm">Abyte Hunt</span>
          </div>

          <div className="mb-8">
            <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: '#F59E0B' }}>Secure Access</p>
            <h2 className="text-2xl font-black text-white">Sign In</h2>
            <p className="text-sm mt-1" style={{ color: 'rgba(148,163,184,0.5)' }}>Access your enterprise dashboard</p>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(148,163,184,0.5)' }}>Corporate Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'rgba(245,158,11,0.4)' }} />
                <input
                  type="email"
                  placeholder="name@enterprise.com"
                  style={{
                    width: '100%', height: 48, paddingLeft: 42, paddingRight: 14,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 4,
                    color: '#e2e8f0', fontSize: 14, outline: 'none',
                    transition: 'border-color 0.2s',
                    fontFamily: 'monospace',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#F59E0B'; e.target.style.boxShadow = '0 0 0 2px rgba(245,158,11,0.15)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(148,163,184,0.5)' }}>Password</label>
                <Link to="/login-preview" className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#F59E0B', textDecoration: 'none' }}>Reset Access</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'rgba(245,158,11,0.4)' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%', height: 48, paddingLeft: 42, paddingRight: 46,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 4,
                    color: '#e2e8f0', fontSize: 14, outline: 'none',
                    transition: 'border-color 0.2s',
                    fontFamily: 'monospace',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#F59E0B'; e.target.style.boxShadow = '0 0 0 2px rgba(245,158,11,0.15)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(148,163,184,0.35)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="sso" style={{ accentColor: '#F59E0B' }} />
              <label htmlFor="sso" className="text-xs" style={{ color: 'rgba(148,163,184,0.5)' }}>Use Single Sign-On (SSO)</label>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 font-black text-sm text-gray-900"
              style={{
                height: 50, borderRadius: 4, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                boxShadow: '0 4px 20px rgba(245,158,11,0.3)',
              }}
            >
              Authenticate <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] text-center uppercase tracking-widest" style={{ color: 'rgba(148,163,184,0.3)' }}>
              Enterprise Support: support@abytesol.com
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link to="/login-preview" className="text-xs" style={{ color: 'rgba(148,163,184,0.3)', textDecoration: 'none' }}>← Back to design selector</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Mail, Lock, Zap, TrendingUp, Users, Target, CheckCircle2 } from 'lucide-react';

const STATS = [
  { value: '10x', label: 'Faster Outreach' },
  { value: '3.2k', label: 'Leads Generated' },
  { value: '94%', label: 'Response Rate' },
];

const FEATURES = [
  { icon: Target,     title: 'AI Lead Scoring',      desc: 'Instantly qualify and rank leads by conversion potential.' },
  { icon: Mail,       title: 'Smart Email Outreach',  desc: 'Personalized cold emails written and sent automatically.' },
  { icon: TrendingUp, title: 'Pipeline Analytics',    desc: 'Real-time insights across your full sales pipeline.' },
];

export default function LoginV1() {
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ background: '#080e09' }}>

      {/* LEFT PANEL */}
      <div
        className="hidden lg:flex lg:w-[58%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(145deg, #050c06 0%, #0a1a0c 50%, #071209 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(33,246,168,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(33,246,168,0.03) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }} />
        <div className="absolute pointer-events-none" style={{ top: '-20%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(33,246,168,0.14) 0%, transparent 65%)', filter: 'blur(80px)' }} />
        <div className="absolute pointer-events-none" style={{ bottom: '-10%', right: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 65%)', filter: 'blur(80px)' }} />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}>
            <Zap className="h-5 w-5 text-gray-900" fill="currentColor" />
          </div>
          <div>
            <p className="text-base font-bold text-white leading-none">Abyte Hunt</p>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: 'rgba(148,163,184,0.4)' }}>by Abyte Sol</p>
          </div>
        </div>

        <div className="relative z-10 space-y-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ background: 'rgba(33,246,168,0.08)', border: '1px solid rgba(33,246,168,0.15)' }}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold" style={{ color: '#21F6A8' }}>AI-Powered Sales Platform</span>
            </div>
            <h1 className="text-5xl font-black leading-[1.1] tracking-tight text-white mb-4">
              Hunt Clients.<br />
              <span style={{ background: 'linear-gradient(135deg, #21F6A8 0%, #6EE7B7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Close Deals.
              </span><br />
              Grow Faster.
            </h1>
            <p className="text-base leading-relaxed" style={{ color: 'rgba(148,163,184,0.6)', maxWidth: 420 }}>
              Automate your entire client acquisition pipeline with AI.
            </p>
          </div>

          <div className="space-y-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-start gap-4 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: 'rgba(33,246,168,0.1)', border: '1px solid rgba(33,246,168,0.15)' }}>
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

        <div className="relative z-10">
          <div className="grid grid-cols-3 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-black" style={{ background: 'linear-gradient(135deg, #21F6A8, #6EE7B7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(148,163,184,0.45)' }}>{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {['MA', 'AH', 'SB', 'KR'].map((init) => (
                  <div key={init} className="h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold text-gray-900" style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)', outline: '2px solid #080e09' }}>{init}</div>
                ))}
              </div>
              <p className="text-xs" style={{ color: 'rgba(148,163,184,0.45)' }}>Join agencies already using Abyte Hunt</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative" style={{ background: '#0a1209' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(33,246,168,0.06) 0%, transparent 60%)' }} />

        <div className="relative z-10 w-full" style={{ maxWidth: 400 }}>
          <div className="mb-8">
            <h2 className="text-2xl font-black text-white mb-2">Welcome back</h2>
            <p className="text-sm" style={{ color: 'rgba(148,163,184,0.55)' }}>Sign in to your dashboard and start hunting clients.</p>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(148,163,184,0.45)' }}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'rgba(148,163,184,0.3)' }} />
                <input type="email" placeholder="you@company.com" style={{ width: '100%', height: 48, paddingLeft: 44, paddingRight: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#e2e8f0', fontSize: 14, outline: 'none' }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(148,163,184,0.45)' }}>Password</label>
                <Link to="/login-preview" className="text-xs font-semibold" style={{ color: 'rgba(33,246,168,0.6)', textDecoration: 'none' }}>Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'rgba(148,163,184,0.3)' }} />
                <input type={showPass ? 'text' : 'password'} placeholder="••••••••" style={{ width: '100%', height: 48, paddingLeft: 44, paddingRight: 46, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#e2e8f0', fontSize: 14, outline: 'none' }} />
                <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(148,163,184,0.35)', cursor: 'pointer', background: 'none', border: 'none' }}>
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" className="w-full flex items-center justify-center gap-2.5 font-bold text-sm text-gray-900" style={{ height: 50, marginTop: 8, borderRadius: 12, background: 'linear-gradient(135deg, #21F6A8 0%, #10B981 100%)', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(33,246,168,0.25)' }}>
              Sign In to Dashboard <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span className="text-xs" style={{ color: 'rgba(148,163,184,0.3)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <p className="text-center text-sm" style={{ color: 'rgba(148,163,184,0.45)' }}>
            Don't have an account?{' '}
            <Link to="/login-preview" className="font-semibold" style={{ color: '#21F6A8', textDecoration: 'none' }}>Create free account →</Link>
          </p>

          <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center justify-center gap-5">
              {[{ icon: CheckCircle2, text: 'Secure JWT Auth' }, { icon: Zap, text: 'Groq AI Engine' }, { icon: Users, text: 'Real-time Sync' }].map((b) => (
                <div key={b.text} className="flex items-center gap-1.5">
                  <b.icon className="h-3 w-3 shrink-0" style={{ color: 'rgba(33,246,168,0.5)' }} />
                  <span className="text-[10px] font-medium" style={{ color: 'rgba(148,163,184,0.35)' }}>{b.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 text-center">
            <Link to="/login-preview" className="text-xs" style={{ color: 'rgba(148,163,184,0.3)', textDecoration: 'none' }}>← Back to design selector</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

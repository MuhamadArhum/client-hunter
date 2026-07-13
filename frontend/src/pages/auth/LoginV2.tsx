import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Zap, ArrowRight, Shield, Sparkles, BarChart3 } from 'lucide-react';

export default function LoginV2() {
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f1f5f9' }}>

      {/* Card */}
      <div className="w-full flex overflow-hidden rounded-3xl" style={{ maxWidth: 920, background: '#ffffff', boxShadow: '0 25px 80px rgba(0,0,0,0.12)' }}>

        {/* LEFT — Illustration panel */}
        <div
          className="hidden lg:flex lg:w-[45%] flex-col justify-between p-10 relative overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #EFF6FF 0%, #DBEAFE 60%, #EDE9FE 100%)' }}
        >
          {/* Decorative circles */}
          <div className="absolute" style={{ top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(59,130,246,0.1)' }} />
          <div className="absolute" style={{ bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(139,92,246,0.08)' }} />
          <div className="absolute" style={{ top: '40%', left: '60%', width: 100, height: 100, borderRadius: '50%', background: 'rgba(59,130,246,0.06)' }} />

          {/* Logo */}
          <div className="relative z-10 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
              <Zap className="h-4 w-4 text-white" fill="currentColor" />
            </div>
            <span className="font-bold text-gray-800">Abyte Hunt</span>
          </div>

          {/* Center content */}
          <div className="relative z-10 space-y-6">
            <div>
              <h2 className="text-3xl font-black text-gray-900 leading-tight mb-3">
                Your AI-Powered<br />
                <span style={{ color: '#3B82F6' }}>Sales Co-Pilot</span>
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Find, qualify, and close clients 10x faster with intelligent automation.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { icon: Sparkles, label: 'AI Lead Discovery', color: '#3B82F6' },
                { icon: BarChart3, label: 'Smart Analytics', color: '#6366F1' },
                { icon: Shield,    label: 'Secure & Reliable', color: '#8B5CF6' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${item.color}15` }}>
                    <item.icon className="h-4 w-4" style={{ color: item.color }} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="relative z-10">
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-semibold text-gray-600">System Live</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[{ v: '2.4k', l: 'Active Leads' }, { v: '98%', l: 'Uptime' }, { v: '4.9★', l: 'Rating' }].map((s) => (
                  <div key={s.l} className="text-center">
                    <p className="text-base font-black text-gray-900">{s.v}</p>
                    <p className="text-[10px] text-gray-400">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Form */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
          <div className="w-full" style={{ maxWidth: 360 }}>

            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
                <Zap className="h-4 w-4 text-white" fill="currentColor" />
              </div>
              <span className="font-bold text-gray-800">Abyte Hunt</span>
            </div>

            <div className="mb-8">
              <h1 className="text-2xl font-black text-gray-900 mb-1.5">Sign in</h1>
              <p className="text-sm text-gray-500">Welcome back! Enter your credentials below.</p>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="you@company.com"
                    style={{
                      width: '100%', height: 46, paddingLeft: 42, paddingRight: 14,
                      background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 10,
                      color: '#1E293B', fontSize: 14, outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#3B82F6'; e.target.style.background = '#EFF6FF'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC'; }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-700">Password</label>
                  <Link to="/login-preview" className="text-xs font-semibold" style={{ color: '#3B82F6', textDecoration: 'none' }}>Forgot?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Enter your password"
                    style={{
                      width: '100%', height: 46, paddingLeft: 42, paddingRight: 46,
                      background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 10,
                      color: '#1E293B', fontSize: 14, outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#3B82F6'; e.target.style.background = '#EFF6FF'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC'; }}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="remember" className="rounded" style={{ accentColor: '#3B82F6' }} />
                <label htmlFor="remember" className="text-xs text-gray-600">Keep me signed in</label>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 font-bold text-sm text-white"
                style={{ height: 46, borderRadius: 10, background: 'linear-gradient(135deg, #3B82F6, #6366F1)', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(59,130,246,0.35)' }}
              >
                Sign In <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or continue with</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-gray-700"
              style={{ height: 44, borderRadius: 10, background: '#F8FAFC', border: '1.5px solid #E2E8F0', cursor: 'pointer' }}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Sign in with Google
            </button>

            <p className="text-center text-xs text-gray-500 mt-6">
              No account?{' '}
              <Link to="/login-preview" className="font-semibold" style={{ color: '#3B82F6', textDecoration: 'none' }}>Sign up free</Link>
            </p>

            <div className="mt-4 text-center">
              <Link to="/login-preview" className="text-xs text-gray-400" style={{ textDecoration: 'none' }}>← Back to design selector</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

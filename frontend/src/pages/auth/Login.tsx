import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1a2233 0%, #2d3748 50%, #1e2a3a 100%)' }}
    >
      {/* Background orbs */}
      <div
        className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #1DD2D7 0%, transparent 70%)', transform: 'translate(-30%, -30%)' }}
      />
      <div
        className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #9F8DD4 0%, transparent 70%)', transform: 'translate(30%, 30%)' }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo area */}
        <div className="flex flex-col items-center text-center mb-8">
          <div
            className="relative flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #1DD2D7 0%, #9F8DD4 100%)' }}
          >
            <Zap className="h-7 w-7 text-white" fill="white" />
            <div
              className="absolute inset-0 rounded-2xl blur-lg opacity-50"
              style={{ background: 'linear-gradient(135deg, #1DD2D7, #9F8DD4)' }}
            />
          </div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #1DD7CE 0%, #c4b8f0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            ClientHunter
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(210,225,240,0.5)' }}>
            by Abyte Sol
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 space-y-5"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          <div>
            <h2 className="text-lg font-semibold text-white">Welcome back</h2>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(210,225,240,0.5)' }}>
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                className="text-sm rounded-xl p-3"
                style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5' }}
              >
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium" style={{ color: 'rgba(210,225,240,0.7)' }}>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
                className="h-10 rounded-xl text-sm"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(230,240,255,0.9)',
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium" style={{ color: 'rgba(210,225,240,0.7)' }}>
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 rounded-xl text-sm pr-10"
                  autoComplete="current-password"
                  disabled={loading}
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(230,240,255,0.9)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'rgba(210,225,240,0.4)' }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-10 rounded-xl font-semibold text-sm gap-2 text-white shadow-glow-teal transition-all duration-200 hover:opacity-90 hover:scale-[1.01]"
              disabled={loading}
              style={{ background: 'linear-gradient(135deg, #1DD2D7 0%, #1DD7CE 100%)', border: 'none' }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm" style={{ color: 'rgba(210,225,240,0.4)' }}>
            Don't have an account?{' '}
            <Link
              to="/sign-up"
              className="font-semibold transition-colors hover:opacity-80"
              style={{ color: '#1DD7CE' }}
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

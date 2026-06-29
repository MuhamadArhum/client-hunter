import { useState } from 'react';
import { Eye, EyeOff, Lock, Info, CheckCircle, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/services/api';
import { cn } from '@/lib/utils';

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const passwordStrength = newPassword.length === 0 ? 0
    : newPassword.length < 6 ? 1
    : newPassword.length < 10 ? 2
    : 3;

  const strengthLabel = ['', 'Weak', 'Good', 'Strong'];
  const strengthColor = ['', 'bg-rose-400', 'bg-amber-400', 'bg-emerald-400'];

  const handleChangePassword = async () => {
    setAlert(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setAlert({ type: 'error', msg: 'All fields are required.' }); return;
    }
    if (newPassword !== confirmPassword) {
      setAlert({ type: 'error', msg: 'New passwords do not match.' }); return;
    }
    if (newPassword.length < 6) {
      setAlert({ type: 'error', msg: 'Password must be at least 6 characters.' }); return;
    }
    setLoading(true);
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      setAlert({ type: 'success', msg: 'Password changed successfully!' });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setAlert({ type: 'error', msg: err?.response?.data?.message || 'Failed to change password.' });
    } finally { setLoading(false); }
  };

  const appInfo = [
    { label: 'Application', value: 'Abyte Hunt' },
    { label: 'Version', value: '1.0.0' },
    { label: 'Built by', value: 'Abyte Sol' },
    { label: 'Frontend', value: 'React 18 + TypeScript + Vite + Shadcn UI' },
    { label: 'Backend', value: 'Node.js + Express + MongoDB' },
    { label: 'AI Engine', value: 'Groq — LLaMA 3.3 70B Versatile' },
    { label: 'Purpose', value: 'AI-powered Lead Generation & Outreach Automation' },
  ];

  return (
    <div className="space-y-5 p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account and application preferences</p>
      </div>

      {/* Change Password */}
      <div className="rounded-2xl border border-border/60 bg-white shadow-card overflow-hidden">
        {/* Card top */}
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #1DD2D7, #9F8DD4)' }} />
        <div className="px-5 py-4 border-b border-border/60 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(29,210,215,0.1)' }}>
            <Lock className="h-4 w-4" style={{ color: '#1DD2D7' }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Change Password</h2>
            <p className="text-xs text-muted-foreground">Update your account password</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {alert && (
            <div className={cn(
              'flex items-center gap-2.5 text-sm rounded-xl p-3 border',
              alert.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200',
            )}>
              {alert.type === 'success' && <CheckCircle className="h-4 w-4 shrink-0" />}
              {alert.msg}
            </div>
          )}

          <PasswordField label="Current Password" value={currentPassword} onChange={setCurrentPassword} show={showCurrent} onToggleShow={() => setShowCurrent(v => !v)} />

          <div className="space-y-2">
            <PasswordField label="New Password" value={newPassword} onChange={setNewPassword} show={showNew} onToggleShow={() => setShowNew(v => !v)} />
            {newPassword.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={cn('h-1 flex-1 rounded-full transition-all duration-300', level <= passwordStrength ? strengthColor[passwordStrength] : 'bg-muted')}
                    />
                  ))}
                </div>
                <p className={cn('text-xs', passwordStrength === 1 ? 'text-rose-500' : passwordStrength === 2 ? 'text-amber-500' : 'text-emerald-500')}>
                  {strengthLabel[passwordStrength]} password
                </p>
              </div>
            )}
          </div>

          <PasswordField label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} onToggleShow={() => setShowConfirm(v => !v)} />

          <div className="pt-1">
            <Button
              className="h-10 rounded-xl text-sm font-semibold text-white gap-2"
              style={{ background: 'linear-gradient(135deg, #1DD2D7, #1DD7CE)' }}
              onClick={handleChangePassword}
              disabled={loading}
            >
              {loading
                ? <><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                : <><Shield className="h-3.5 w-3.5" /> Save Password</>}
            </Button>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="rounded-2xl border border-border/60 bg-white shadow-card overflow-hidden">
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #9F8DD4, #1DD2D7)' }} />
        <div className="px-5 py-4 border-b border-border/60 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(159,141,212,0.1)' }}>
            <Info className="h-4 w-4" style={{ color: '#9F8DD4' }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Application Info</h2>
            <p className="text-xs text-muted-foreground">Details about this system</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" style={{ color: '#1DD7CE' }} />
            <span className="text-xs font-semibold" style={{ color: '#1DD7CE' }}>Powered by AI</span>
          </div>
        </div>

        <div className="p-5 space-y-0">
          {appInfo.map((row, idx) => (
            <div
              key={row.label}
              className="flex flex-col gap-0.5 sm:flex-row sm:items-center py-3"
              style={{ borderBottom: idx < appInfo.length - 1 ? '1px solid hsl(var(--border) / 0.5)' : 'none' }}
            >
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide sm:min-w-32">{row.label}</span>
              <span className="text-sm font-medium text-foreground">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PasswordField({
  label, value, onChange, show, onToggleShow,
}: {
  label: string; value: string; onChange: (v: string) => void; show: boolean; onToggleShow: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</Label>
      <div className="relative">
        <Input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 rounded-xl border-border/60 text-sm pr-10"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Eye, EyeOff, Lock, Info, CheckCircle, Shield, Zap, Server, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/services/api';
import { cn } from '@/lib/utils';

const appInfo = [
  { label: 'Application', value: 'Abyte Hunt' },
  { label: 'Version',     value: '1.0.0' },
  { label: 'Built by',    value: 'Abyte Sol' },
  { label: 'Frontend',    value: 'React 18 + TypeScript + Vite + Shadcn UI' },
  { label: 'Backend',     value: 'Node.js + Express + MongoDB' },
  { label: 'AI Engine',   value: 'Groq — LLaMA 3.3 70B Versatile' },
  { label: 'Purpose',     value: 'AI-powered Lead Generation & Outreach Automation' },
];

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
          className="h-10 rounded-lg border-border/70 text-sm pr-10 focus-visible:ring-emerald-500/30"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert]     = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const passwordStrength = newPassword.length === 0 ? 0
    : newPassword.length < 6 ? 1
    : newPassword.length < 10 ? 2 : 3;

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

  return (
    <div className="space-y-5 p-5 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account and application preferences</p>
      </div>

      {/* Security section */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'rgba(33,246,168,0.08)' }}>
            <Lock className="h-4 w-4" style={{ color: '#0D9C6A' }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Security</h3>
            <p className="text-xs text-muted-foreground">Update your account password</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {alert && (
            <div className={cn(
              'flex items-center gap-2.5 text-sm rounded-lg p-3 border',
              alert.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300',
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
                    <div key={level} className={cn('h-1 flex-1 rounded-full transition-all duration-300', level <= passwordStrength ? strengthColor[passwordStrength] : 'bg-muted')} />
                  ))}
                </div>
                <p className={cn('text-xs font-medium', passwordStrength === 1 ? 'text-rose-500' : passwordStrength === 2 ? 'text-amber-500' : 'text-emerald-500')}>
                  {strengthLabel[passwordStrength]} password
                </p>
              </div>
            )}
          </div>

          <PasswordField label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} onToggleShow={() => setShowConfirm(v => !v)} />

          <div className="pt-1">
            <Button
              className="h-10 rounded-lg text-sm font-semibold text-gray-900 gap-2"
              style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}
              onClick={handleChangePassword}
              disabled={loading}
            >
              {loading
                ? <><span className="h-3.5 w-3.5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" /> Saving...</>
                : <><Shield className="h-3.5 w-3.5" /> Update Password</>
              }
            </Button>
          </div>
        </div>
      </div>

      {/* App info */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Application Info</h3>
              <p className="text-xs text-muted-foreground">Details about this system</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border" style={{ background: 'rgba(33,246,168,0.06)', borderColor: 'rgba(33,246,168,0.2)' }}>
            <Zap className="h-3 w-3" style={{ color: '#0D9C6A' }} />
            <span className="text-xs font-medium" style={{ color: '#0D9C6A' }}>AI Powered</span>
          </div>
        </div>

        <div className="p-5">
          {/* Tech stack visual */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { icon: Server, label: 'Backend',  value: 'Node.js + Express', color: '#059669', bg: '#ECFDF5' },
              { icon: Brain,  label: 'AI',       value: 'Groq LLaMA 3.3',   color: '#0D9C6A', bg: 'rgba(33,246,168,0.08)' },
              { icon: Zap,    label: 'Frontend', value: 'React + Vite',     color: '#7C3AED', bg: '#F5F3FF' },
            ].map((tech) => (
              <div key={tech.label} className="rounded-lg border border-border/60 p-3 text-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg mx-auto mb-1.5" style={{ background: tech.bg }}>
                  <tech.icon className="h-4 w-4" style={{ color: tech.color }} />
                </div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{tech.label}</p>
                <p className="text-xs font-medium text-foreground mt-0.5">{tech.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-0 border border-border/60 rounded-lg overflow-hidden">
            {appInfo.map((row, idx) => (
              <div
                key={row.label}
                className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 px-4 py-3 hover:bg-muted/30 transition-colors"
                style={{ borderBottom: idx < appInfo.length - 1 ? '1px solid hsl(var(--border) / 0.5)' : 'none' }}
              >
                <span className="text-xs font-semibold text-muted-foreground sm:min-w-28 shrink-0">{row.label}</span>
                <span className="text-sm text-foreground">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

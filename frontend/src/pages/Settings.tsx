import { useState } from 'react';
import { Eye, EyeOff, Lock, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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

  const handleChangePassword = async () => {
    setAlert(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setAlert({ type: 'error', msg: 'All fields are required.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setAlert({ type: 'error', msg: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setAlert({ type: 'error', msg: 'New password must be at least 6 characters.' });
      return;
    }
    setLoading(true);
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      setAlert({ type: 'success', msg: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setAlert({ type: 'error', msg: err?.response?.data?.message || 'Failed to change password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Change Password</CardTitle>
          </div>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {alert && (
            <p className={cn(
              'text-sm rounded p-3',
              alert.type === 'success'
                ? 'text-green-700 bg-green-50 border border-green-200'
                : 'text-destructive bg-destructive/10 border border-destructive/20',
            )}>
              {alert.msg}
            </p>
          )}

          <PasswordField
            label="Current Password"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            onToggleShow={() => setShowCurrent((v) => !v)}
          />
          <PasswordField
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            onToggleShow={() => setShowNew((v) => !v)}
          />
          <PasswordField
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirm}
            onToggleShow={() => setShowConfirm((v) => !v)}
          />

          <div className="pt-2">
            <Button onClick={handleChangePassword} disabled={loading}>
              {loading ? 'Saving...' : 'Save Password'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* App Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <CardTitle>App Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Application" value="ClientHunter" />
          <InfoRow label="Version" value="1.0.0" />
          <InfoRow label="Built by" value="Abyte Sol" />
          <InfoRow label="Frontend Stack" value="React 18 + TypeScript + Vite + Shadcn UI + Tailwind CSS" />
          <InfoRow label="Backend Stack" value="Node.js + Express + MongoDB" />
          <InfoRow label="Purpose" value="AI-powered Lead Generation & Outreach Automation" />
        </CardContent>
      </Card>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggleShow,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-4">
      <span className="text-sm text-muted-foreground min-w-32">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

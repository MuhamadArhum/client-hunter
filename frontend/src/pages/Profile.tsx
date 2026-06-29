import { useEffect, useRef, useState } from 'react';
import { User, Mail, Shield, FileText, Send, CheckCircle, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface Stats {
  leads: number;
  proposals: number;
  outreach: number;
}

export default function Profile() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ leads: 0, proposals: 0, outreach: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saveLoading, setSaveLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Avatar
  const [avatar, setAvatar] = useState<string | null>((user as unknown as Record<string, unknown>)?.avatar as string | null ?? null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setAvatar((user as unknown as Record<string, unknown>)?.avatar as string | null ?? null);
    }
  }, [user]);

  useEffect(() => {
    Promise.all([
      api.get('/leads', { params: { limit: 1 } }),
      api.get('/proposals', { params: { limit: 1 } }),
      api.get('/outreach', { params: { limit: 1 } }),
    ])
      .then(([leadsRes, proposalsRes, outreachRes]) => {
        setStats({
          leads: leadsRes.data?.pagination?.total ?? 0,
          proposals: proposalsRes.data?.pagination?.total ?? 0,
          outreach: outreachRes.data?.pagination?.total ?? 0,
        });
      })
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  }, []);

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      setAlert({ type: 'error', msg: 'Name and email are required.' }); return;
    }
    setSaveLoading(true); setAlert(null);
    try {
      await api.put('/auth/profile', { name, email });
      setAlert({ type: 'success', msg: 'Profile updated successfully!' });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setAlert({ type: 'error', msg: err?.response?.data?.message || 'Failed to update profile.' });
    } finally { setSaveLoading(false); }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      setAlert({ type: 'error', msg: 'Image must be under 1.5MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64 = evt.target?.result as string;
      setAvatarLoading(true);
      setAlert(null);
      try {
        await api.put('/auth/avatar', { avatar: base64 });
        setAvatar(base64);
        setAlert({ type: 'success', msg: 'Avatar updated successfully!' });
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } };
        setAlert({ type: 'error', msg: e?.response?.data?.message || 'Failed to update avatar.' });
      } finally {
        setAvatarLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const statItems = [
    { icon: User, label: 'Total Leads', value: stats.leads, gradient: 'linear-gradient(135deg, #1DD2D7, #1DD7CE)', lightBg: 'rgba(29,210,215,0.08)' },
    { icon: Send, label: 'Outreach Sent', value: stats.outreach, gradient: 'linear-gradient(135deg, #9F8DD4, #b8a8e4)', lightBg: 'rgba(159,141,212,0.08)' },
    { icon: FileText, label: 'Proposals', value: stats.proposals, gradient: 'linear-gradient(135deg, #3F4D67, #4d5f80)', lightBg: 'rgba(63,77,103,0.08)' },
  ];

  return (
    <div className="space-y-5 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account information</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left: Profile card */}
        <div className="lg:col-span-1 space-y-4">
          {/* Avatar card */}
          <div className="rounded-2xl border border-border/60 bg-white shadow-card overflow-hidden">
            <div className="h-24 w-full" style={{ background: 'linear-gradient(135deg, #3F4D67 0%, #4d5f80 50%, #3a4660 100%)' }} />
            <div className="px-5 pb-5 -mt-10 text-center">
              {/* Clickable avatar with edit overlay */}
              <div className="relative inline-block mx-auto">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <button
                  className="relative h-20 w-20 rounded-2xl ring-4 ring-white shadow-lg overflow-hidden group focus:outline-none"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarLoading}
                  title="Click to change avatar"
                >
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="h-full w-full flex items-center justify-center text-xl font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #1DD2D7, #9F8DD4)' }}
                    >
                      {avatarLoading ? (
                        <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        initials
                      )}
                    </div>
                  )}
                  {/* Edit overlay */}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {avatarLoading ? (
                      <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5 text-white" />
                    )}
                  </div>
                </button>
              </div>
              <h2 className="text-base font-bold text-foreground mt-3">{user?.name || '—'}</h2>
              <p className="text-sm text-muted-foreground">{user?.email || '—'}</p>
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mt-2"
                style={{ background: 'rgba(29,210,215,0.1)', color: '#1DD7CE' }}
              >
                <Shield className="h-3 w-3" />
                {user?.role || 'agent'}
              </span>
              <p className="text-xs text-muted-foreground mt-2">Click avatar to change photo</p>
            </div>
          </div>

          {/* Stats card */}
          <div className="rounded-2xl border border-border/60 bg-white shadow-card p-4 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Activity Stats</h3>
            {statsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
              </div>
            ) : (
              statItems.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: stat.lightBg }}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: stat.gradient }}
                  >
                    <stat.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Edit form */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border/60 bg-white shadow-card overflow-hidden h-full">
            <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #1DD2D7, #9F8DD4)' }} />
            <div className="px-5 py-4 border-b border-border/60 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(29,210,215,0.1)' }}>
                <User className="h-4 w-4" style={{ color: '#1DD2D7' }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Edit Profile</h2>
                <p className="text-xs text-muted-foreground">Update your personal information</p>
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

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    className="h-10 rounded-xl border-border/60 text-sm pl-9"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    type="email"
                    className="h-10 rounded-xl border-border/60 text-sm pl-9"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-xl p-3 border border-border/40 bg-muted/30 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Account Details</p>
                <p className="text-xs text-muted-foreground">Role: <span className="font-medium text-foreground capitalize">{user?.role || 'agent'}</span></p>
              </div>

              <div className="pt-1">
                <Button
                  className="h-10 rounded-xl text-sm font-semibold text-white gap-2"
                  style={{ background: 'linear-gradient(135deg, #1DD2D7, #1DD7CE)' }}
                  onClick={handleSave}
                  disabled={saveLoading}
                >
                  {saveLoading
                    ? <><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                    : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

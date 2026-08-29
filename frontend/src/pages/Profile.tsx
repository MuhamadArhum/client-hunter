import { useEffect, useRef, useState } from 'react';
import { User, Mail, Shield, FileText, Send, CheckCircle, Camera, Edit3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface Stats { leads: number; proposals: number; outreach: number; }

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState<Stats>({ leads: 0, proposals: 0, outreach: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [name, setName]   = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saveLoading, setSaveLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
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
          leads:     leadsRes.data?.pagination?.total ?? 0,
          proposals: proposalsRes.data?.pagination?.total ?? 0,
          outreach:  outreachRes.data?.pagination?.total ?? 0,
        });
      })
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  }, []);

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) { setAlert({ type: 'error', msg: 'Name and email are required.' }); return; }
    setSaveLoading(true); setAlert(null);
    try {
      await api.put('/auth/profile', { name, email });
      setAlert({ type: 'success', msg: 'Profile updated successfully!' });
      refreshUser();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setAlert({ type: 'error', msg: err?.response?.data?.message || 'Failed to update profile.' });
    } finally { setSaveLoading(false); }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) { setAlert({ type: 'error', msg: 'Image must be under 1.5MB.' }); return; }
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64 = evt.target?.result as string;
      setAvatarLoading(true); setAlert(null);
      try {
        await api.put('/auth/avatar', { avatar: base64 });
        setAvatar(base64);
        setAlert({ type: 'success', msg: 'Avatar updated!' });
        refreshUser();
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } };
        setAlert({ type: 'error', msg: e?.response?.data?.message || 'Failed to update avatar.' });
      } finally { setAvatarLoading(false); }
    };
    reader.readAsDataURL(file);
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const statItems = [
    { icon: User,     label: 'Total Leads',   value: stats.leads,     color: '#1FB2A6', bg: 'rgba(31,178,166,0.1)'  },
    { icon: Send,     label: 'Outreach Sent', value: stats.outreach,  color: '#C98A1E', bg: 'rgba(201,138,30,0.1)' },
    { icon: FileText, label: 'Proposals',      value: stats.proposals, color: '#3E8E5A', bg: 'rgba(62,142,90,0.1)'  },
  ];

  const labelSt: React.CSSProperties = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 10.5,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#6E7D79',
    display: 'block',
    marginBottom: 6,
  };

  const inputSt: React.CSSProperties = {
    borderRadius: 4,
    border: '1px solid #CBD3CF',
    background: '#fff',
    fontSize: 13,
    color: '#1B1F2B',
  };

  return (
    <div className="space-y-5 p-6" style={{ background: '#E6E9E5', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, borderTop: '3px solid #1FB2A6', padding: '20px 24px' }}>
        <div className="flex items-center gap-2 mb-1">
          <User className="h-4 w-4" style={{ color: '#1FB2A6' }} />
          <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1FB2A6' }}>Account</span>
        </div>
        <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1B1F2B', marginBottom: 4 }}>Profile</h1>
        <p style={{ fontSize: 13, color: '#6E7D79' }}>Manage your account information</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">

        {/* Left: Profile card */}
        <div className="lg:col-span-1 space-y-4">
          {/* Avatar & identity */}
          <div style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, overflow: 'hidden' }}>
            {/* Cover */}
            <div style={{ height: 80, width: '100%', background: '#1FB2A6' }} />
            <div style={{ padding: '0 20px 20px', marginTop: -40, textAlign: 'center' }}>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <button
                style={{ position: 'relative', width: 80, height: 80, borderRadius: 4, border: '4px solid #F1F4F0', overflow: 'hidden', cursor: 'pointer', display: 'inline-block', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarLoading}
                title="Click to change avatar"
                className="group focus:outline-none"
              >
                {avatar ? (
                  <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1FB2A6' }}>
                    {avatarLoading
                      ? <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 20, fontWeight: 700, color: '#fff' }}>{initials}</span>
                    }
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {avatarLoading
                    ? <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Camera style={{ width: 18, height: 18, color: '#fff' }} />
                  }
                </div>
              </button>

              <h3 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 16, fontWeight: 600, textTransform: 'uppercase', color: '#1B1F2B', marginTop: 12, marginBottom: 4 }}>{user?.name || '—'}</h3>
              <p style={{ fontSize: 12, color: '#6E7D79', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || '—'}</p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  padding: '3px 9px', borderRadius: 10,
                  background: 'rgba(31,178,166,0.12)', color: '#1FB2A6',
                }}>
                  <Shield style={{ width: 10, height: 10 }} />
                  {user?.role || 'agent'}
                </span>
              </div>

              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#9CADB0', marginTop: 10 }}>Click avatar to change photo</p>
            </div>
          </div>

          {/* Activity stats */}
          <div style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, padding: '16px 20px' }}>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6E7D79', marginBottom: 12 }}>Activity Stats</p>
            {statsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" style={{ borderRadius: 4 }} />)}
              </div>
            ) : (
              <div className="space-y-2">
                {statItems.map((stat) => (
                  <div
                    key={stat.label}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 4, border: '1px solid #CBD3CF', background: '#fff', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(154,198,232,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 4, background: stat.bg, flexShrink: 0 }}>
                      <stat.icon style={{ width: 15, height: 15, color: stat.color }} />
                    </div>
                    <div>
                      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#6E7D79', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
                      <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: 20, fontWeight: 700, color: stat.color, lineHeight: 1.1 }}>{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Edit form */}
        <div className="lg:col-span-2">
          <div style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid #CBD3CF' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 4, background: 'rgba(31,178,166,0.1)', flexShrink: 0 }}>
                <Edit3 style={{ width: 15, height: 15, color: '#1FB2A6' }} />
              </div>
              <div>
                <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1B1F2B' }}>Edit Profile</p>
                <p style={{ fontSize: 12, color: '#6E7D79' }}>Update your personal information</p>
              </div>
            </div>

            <div style={{ padding: '20px 24px' }} className="space-y-4">
              {alert && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 4,
                  border: `1px solid ${alert.type === 'success' ? 'rgba(62,142,90,0.3)' : 'rgba(194,59,46,0.3)'}`,
                  background: alert.type === 'success' ? 'rgba(62,142,90,0.08)' : 'rgba(194,59,46,0.08)',
                  color: alert.type === 'success' ? '#3E8E5A' : '#C23B2E',
                  fontSize: 13,
                }}>
                  {alert.type === 'success' && <CheckCircle style={{ width: 15, height: 15, flexShrink: 0 }} />}
                  {alert.msg}
                </div>
              )}

              <div>
                <Label style={labelSt}>Full Name</Label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#9CADB0' }} />
                  <Input
                    style={{ ...inputSt, paddingLeft: 32 }}
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

              <div>
                <Label style={labelSt}>Email Address</Label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#9CADB0' }} />
                  <Input
                    type="email"
                    style={{ ...inputSt, paddingLeft: 32 }}
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 4, background: 'rgba(203,211,207,0.3)', border: '1px solid #CBD3CF' }}>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6E7D79', marginBottom: 4 }}>Account Details</p>
                <p style={{ fontSize: 12, color: '#6E7D79' }}>
                  Role: <span style={{ fontWeight: 600, color: '#1B1F2B', textTransform: 'capitalize' }}>{user?.role || 'agent'}</span>
                </p>
              </div>

              <div style={{ paddingTop: 4 }}>
                <button
                  style={{
                    background: '#1FB2A6', color: '#fff', border: 'none', borderRadius: 4,
                    padding: '0 20px', height: 38, fontSize: 13, fontWeight: 600,
                    fontFamily: "'IBM Plex Mono', monospace", cursor: saveLoading ? 'not-allowed' : 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    opacity: saveLoading ? 0.7 : 1,
                  }}
                  onClick={handleSave}
                  disabled={saveLoading}
                >
                  {saveLoading
                    ? <><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                    : 'Save Changes'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

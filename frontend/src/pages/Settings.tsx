import { useEffect, useState, useCallback } from 'react';
import {
  Eye, EyeOff, Lock, Info, CheckCircle, Shield, Zap, Server, Brain,
  Bell, Mail, MessageSquare, GitBranch, Plug, RefreshCw, Save,
  AlertCircle, ExternalLink,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/services/api';

// ─── App Info ────────────────────────────────────────────────────────────────
const appInfo = [
  { label: 'Application', value: 'Abyte Hunt' },
  { label: 'Version',     value: '1.0.0' },
  { label: 'Built by',    value: 'Abyte Sol' },
  { label: 'Frontend',    value: 'React 18 + TypeScript + Vite + Shadcn UI' },
  { label: 'Backend',     value: 'Node.js + Express + MongoDB' },
  { label: 'AI Engine',   value: 'Groq — LLaMA 3.3 70B Versatile' },
  { label: 'Purpose',     value: 'AI-powered Lead Generation & Outreach Automation' },
];

// ─── Integration config ───────────────────────────────────────────────────────
interface IntegrationMeta {
  key: string;
  label: string;
  group: string;
  configured: boolean;
  displayValue: string;
}

interface IntegrationGroup {
  id: string;
  title: string;
  description: string;
  color: string;
  bg: string;
  icon: React.ElementType;
  docUrl: string;
  fields: { key: string; label: string; placeholder: string; sensitive: boolean }[];
}

const INTEGRATION_GROUPS: IntegrationGroup[] = [
  {
    id: 'email',
    title: 'Email — Resend',
    description: 'Send outreach emails, proposals, and daily digests',
    color: '#1FB2A6',
    bg: 'rgba(31,178,166,0.08)',
    icon: Mail,
    docUrl: 'https://resend.com/api-keys',
    fields: [
      { key: 'RESEND_API_KEY', label: 'Resend API Key',   placeholder: 're_xxxxxxxxxxxx',          sensitive: true  },
      { key: 'EMAIL_FROM',     label: 'From Address',      placeholder: 'Abyte Hunt <you@email.com>', sensitive: false },
      { key: 'DIGEST_EMAIL',   label: 'Digest Recipient',  placeholder: 'you@email.com',              sensitive: false },
    ],
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp — Meta Cloud API',
    description: 'Send WhatsApp messages to leads via Meta Business',
    color: '#3E8E5A',
    bg: 'rgba(62,142,90,0.08)',
    icon: MessageSquare,
    docUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started',
    fields: [
      { key: 'WHATSAPP_API_TOKEN', label: 'API Access Token', placeholder: 'EAAxxxxxxxx',   sensitive: true  },
      { key: 'WHATSAPP_PHONE_ID',  label: 'Phone Number ID',  placeholder: '123456789012345', sensitive: false },
    ],
  },
  {
    id: 'enrichment',
    title: 'Email Enrichment — Hunter.io',
    description: 'Auto-find email addresses from company domains',
    color: '#C98A1E',
    bg: 'rgba(201,138,30,0.08)',
    icon: Zap,
    docUrl: 'https://hunter.io/api-keys',
    fields: [
      { key: 'HUNTER_API_KEY', label: 'Hunter.io API Key', placeholder: 'xxxxxxxxxxxxxxxx', sensitive: true },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications — Slack',
    description: 'Get Slack alerts for new leads, proposals, and conversions',
    color: '#C23B2E',
    bg: 'rgba(194,59,46,0.08)',
    icon: Bell,
    docUrl: 'https://api.slack.com/messaging/webhooks',
    fields: [
      { key: 'SLACK_WEBHOOK_URL', label: 'Webhook URL', placeholder: 'https://hooks.slack.com/services/...', sensitive: true },
    ],
  },
];

// ─── Password field helper ───────────────────────────────────────────────────
function PasswordField({
  label, value, onChange, show, onToggleShow,
}: {
  label: string; value: string; onChange: (v: string) => void; show: boolean; onToggleShow: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6E7D79' }}>{label}</Label>
      <div className="relative">
        <Input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 text-sm pr-10"
          style={{ borderRadius: 4, border: '1px solid #CBD3CF' }}
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
          style={{ color: '#9CADB0', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Notification Preferences ────────────────────────────────────────────────
interface NotifPrefs {
  emailFollowUp: boolean;
  emailNewLead: boolean;
  whatsappOutreach: boolean;
  sequenceAlerts: boolean;
}

const DEFAULT_NOTIF: NotifPrefs = {
  emailFollowUp: true,
  emailNewLead: true,
  whatsappOutreach: false,
  sequenceAlerts: true,
};

// ─── Integration Group Card ───────────────────────────────────────────────────
function IntegrationCard({
  group, statuses, onSave,
}: {
  group: IntegrationGroup;
  statuses: Record<string, IntegrationMeta>;
  onSave: (updates: Record<string, string>) => Promise<void>;
}) {
  const [editing, setEditing]   = useState(false);
  const [saving,  setSaving]    = useState(false);
  const [saved,   setSaved]     = useState(false);
  const [values,  setValues]    = useState<Record<string, string>>({});
  const [show,    setShow]      = useState<Record<string, boolean>>({});

  const allConfigured = group.fields.every((f) => statuses[f.key]?.configured);
  const anyConfigured = group.fields.some((f) => statuses[f.key]?.configured);

  const handleEdit = () => {
    const initial: Record<string, string> = {};
    group.fields.forEach((f) => { initial[f.key] = ''; });
    setValues(initial);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(values);
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  };

  return (
    <div style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, borderTop: `3px solid ${group.color}`, overflow: 'hidden' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #CBD3CF' }}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center" style={{ background: group.bg, borderRadius: 4 }}>
            <group.icon className="h-4 w-4" style={{ color: group.color }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 13, fontWeight: 600, textTransform: 'uppercase', color: '#1B1F2B' }}>{group.title}</h3>
              {allConfigured ? (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5" style={{ borderRadius: 10, background: 'rgba(31,178,166,0.12)', color: '#1FB2A6', fontFamily: "'IBM Plex Mono', monospace" }}>
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: '#1FB2A6' }} />
                  ACTIVE
                </span>
              ) : anyConfigured ? (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5" style={{ borderRadius: 10, background: 'rgba(201,138,30,0.14)', color: '#C98A1E', fontFamily: "'IBM Plex Mono', monospace" }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#C98A1E' }} />
                  PARTIAL
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5" style={{ borderRadius: 10, background: 'rgba(110,125,121,0.1)', color: '#6E7D79', fontFamily: "'IBM Plex Mono', monospace" }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#9CADB0' }} />
                  NOT SET
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{group.description}</p>
          </div>
        </div>
        <a
          href={group.docUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Docs <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Field statuses */}
      <div className="px-5 py-4 space-y-2">
        {!editing ? (
          <>
            {group.fields.map((field) => {
              const status = statuses[field.key];
              return (
                <div key={field.key} className="flex items-center justify-between py-1.5">
                  <span className="text-xs font-medium text-muted-foreground">{field.label}</span>
                  {status?.configured ? (
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#6E7D79' }}>{status.displayValue}</span>
                      <CheckCircle className="h-3.5 w-3.5" style={{ color: '#1FB2A6' }} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: '#C98A1E' }}>
                      <AlertCircle className="h-3.5 w-3.5" />
                      Not configured
                    </div>
                  )}
                </div>
              );
            })}

            <div className="pt-2">
              {saved ? (
                <div className="flex items-center gap-1.5" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#1FB2A6' }}>
                  <CheckCircle className="h-3.5 w-3.5" /> Settings saved successfully!
                </div>
              ) : (
                <button
                  className="h-8 px-3 text-xs font-semibold gap-1.5 flex items-center text-white"
                  style={{ background: group.color, borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" }}
                  onClick={handleEdit}
                >
                  <Plug className="h-3 w-3" />
                  {allConfigured ? 'Update Credentials' : 'Configure'}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-3">
            {group.fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {field.label}
                </Label>
                {field.sensitive ? (
                  <div className="relative">
                    <Input
                      type={show[field.key] ? 'text' : 'password'}
                      placeholder={field.placeholder}
                      value={values[field.key] || ''}
                      onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                      className="h-9 text-sm pr-10" style={{ borderRadius: 4, border: '1px solid #CBD3CF' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => ({ ...s, [field.key]: !s[field.key] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
                    >
                      {show[field.key] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                ) : (
                  <Input
                    placeholder={field.placeholder}
                    value={values[field.key] || ''}
                    onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                    className="h-9 text-sm" style={{ borderRadius: 4, border: '1px solid #CBD3CF' }}
                  />
                )}
                {statuses[field.key]?.configured && (
                  <p className="text-[11px] text-muted-foreground">
                    Current: {statuses[field.key].displayValue} — leave blank to keep unchanged
                  </p>
                )}
              </div>
            ))}

            <div className="flex gap-2 pt-1">
              <button
                className="h-8 px-3 text-xs font-semibold gap-1.5 flex items-center text-white"
                style={{ background: group.color, borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif", opacity: saving ? 0.7 : 1 }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? <><span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                  : <><Save className="h-3 w-3" /> Save</>}
              </button>
              <button
                className="h-8 px-3 text-xs font-semibold"
                style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, color: '#6E7D79', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" }}
                onClick={() => setEditing(false)}
              >Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
export default function Settings() {
  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading,   setPwLoading]   = useState(false);
  const [pwAlert,     setPwAlert]     = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Integrations
  const [integrations, setIntegrations] = useState<Record<string, IntegrationMeta>>({});
  const [intLoading,   setIntLoading]   = useState(true);

  // AI status
  const [aiStatus, setAiStatus] = useState<{ groqReady: boolean; ollamaReady: boolean; active: string } | null>(null);

  useEffect(() => {
    api.get('/settings/ai-status')
      .then((res) => setAiStatus(res.data?.data || null))
      .catch(() => {});
  }, []);

  // Notifications
  const [notif, setNotif] = useState<NotifPrefs>(() => {
    try { return { ...DEFAULT_NOTIF, ...JSON.parse(localStorage.getItem('abyte_notif_prefs') || '{}') }; }
    catch { return DEFAULT_NOTIF; }
  });
  const [notifSaved, setNotifSaved] = useState(false);

  const passwordStrength = newPassword.length === 0 ? 0
    : newPassword.length < 6 ? 1
    : newPassword.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'];
  const strengthColor = ['', 'bg-rose-400', 'bg-amber-400', 'bg-emerald-400'];

  // ── Fetch integration status ──
  const fetchIntegrations = useCallback(async () => {
    setIntLoading(true);
    try {
      const res = await api.get('/settings/integrations');
      setIntegrations(res.data?.data || {});
    } catch (e) {
      console.error('Failed to fetch integration status', e);
    } finally { setIntLoading(false); }
  }, []);

  useEffect(() => { fetchIntegrations(); }, [fetchIntegrations]);

  // ── Save integration group ──
  const handleSaveIntegration = async (updates: Record<string, string>) => {
    const nonEmpty: Record<string, string> = {};
    Object.entries(updates).forEach(([k, v]) => { if (v.trim()) nonEmpty[k] = v.trim(); });
    if (!Object.keys(nonEmpty).length) return;
    await api.put('/settings/integrations', nonEmpty);
    await fetchIntegrations();
  };

  // ── Change password ──
  const handleChangePassword = async () => {
    setPwAlert(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwAlert({ type: 'error', msg: 'All fields are required.' }); return;
    }
    if (newPassword !== confirmPassword) {
      setPwAlert({ type: 'error', msg: 'New passwords do not match.' }); return;
    }
    if (newPassword.length < 6) {
      setPwAlert({ type: 'error', msg: 'Password must be at least 6 characters.' }); return;
    }
    setPwLoading(true);
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      setPwAlert({ type: 'success', msg: 'Password changed successfully!' });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setPwAlert({ type: 'error', msg: err?.response?.data?.message || 'Failed to change password.' });
    } finally { setPwLoading(false); }
  };

  const handleSaveNotif = () => {
    localStorage.setItem('abyte_notif_prefs', JSON.stringify(notif));
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2000);
  };

  const labelSt: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6E7D79' };
  const inputSt: React.CSSProperties = { borderRadius: 4, border: '1px solid #CBD3CF', fontSize: 13 };

  return (
    <div className="space-y-5 p-5 max-w-2xl" style={{ background: '#E6E9E5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, borderTop: '3px solid #1FB2A6', padding: '20px 24px' }}>
        <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 600, textTransform: 'uppercase', color: '#1B1F2B', marginBottom: 4 }}>Settings</h2>
        <p style={{ fontSize: 13, color: '#6E7D79' }}>Manage your account, integrations, and preferences</p>
      </div>

      <Tabs defaultValue="integrations">
        <TabsList className="h-10 p-1 gap-1 w-full" style={{ background: 'rgba(203,211,207,0.4)', borderRadius: 4, border: '1px solid #CBD3CF' }}>
          <TabsTrigger value="integrations" className="flex-1 text-sm font-medium data-[state=active]:shadow-sm" style={{ borderRadius: 4, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            <Plug className="mr-2 h-3.5 w-3.5" /> Integrations
          </TabsTrigger>
          <TabsTrigger value="security" className="flex-1 text-sm font-medium data-[state=active]:shadow-sm" style={{ borderRadius: 4, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            <Lock className="mr-2 h-3.5 w-3.5" /> Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1 text-sm font-medium data-[state=active]:shadow-sm" style={{ borderRadius: 4, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            <Bell className="mr-2 h-3.5 w-3.5" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="about" className="flex-1 text-sm font-medium data-[state=active]:shadow-sm" style={{ borderRadius: 4, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            <Info className="mr-2 h-3.5 w-3.5" /> About
          </TabsTrigger>
        </TabsList>

        {/* ── Integrations Tab ── */}
        <TabsContent value="integrations" className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <p style={{ fontSize: 13, color: '#6E7D79' }}>Configure API credentials for each integration</p>
            <button
              className="h-8 px-3 text-xs font-semibold gap-1.5 flex items-center"
              style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, color: '#6E7D79', cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace" }}
              onClick={fetchIntegrations}
              disabled={intLoading}
            >
              <RefreshCw className={`h-3 w-3 ${intLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Summary bar */}
          {!intLoading && (
            <div className="p-4 flex items-center gap-4 flex-wrap" style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4 }}>
              {INTEGRATION_GROUPS.map((group) => {
                const configured = group.fields.filter((f) => integrations[f.key]?.configured).length;
                const total      = group.fields.length;
                const all        = configured === total;
                return (
                  <div key={group.id} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ background: all ? '#1FB2A6' : configured > 0 ? '#C98A1E' : '#9CADB0' }} />
                    <span style={{ fontSize: 12, color: '#6E7D79' }}>{group.title.split(' — ')[0]}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, color: '#1B1F2B' }}>{configured}/{total}</span>
                  </div>
                );
              })}
            </div>
          )}

          {intLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 animate-pulse" style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4 }} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {INTEGRATION_GROUPS.map((group) => (
                <IntegrationCard
                  key={group.id}
                  group={group}
                  statuses={integrations}
                  onSave={handleSaveIntegration}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Security Tab ── */}
        <TabsContent value="security" className="mt-5">
          <div style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, borderTop: '3px solid #1FB2A6', overflow: 'hidden' }}>
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #CBD3CF' }}>
              <div className="flex h-8 w-8 items-center justify-center" style={{ background: 'rgba(31,178,166,0.08)', borderRadius: 4 }}>
                <Lock className="h-4 w-4" style={{ color: '#1FB2A6' }} />
              </div>
              <div>
                <h3 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 13, fontWeight: 600, textTransform: 'uppercase', color: '#1B1F2B' }}>Security</h3>
                <p style={{ fontSize: 11, color: '#6E7D79', marginTop: 1 }}>Update your account password</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {pwAlert && (
                <div
                  className="flex items-center gap-2.5 text-sm p-3"
                  style={{
                    borderRadius: 4,
                    background: pwAlert.type === 'success' ? 'rgba(62,142,90,0.08)' : 'rgba(194,59,46,0.08)',
                    border: pwAlert.type === 'success' ? '1px solid rgba(62,142,90,0.3)' : '1px solid rgba(194,59,46,0.25)',
                    color: pwAlert.type === 'success' ? '#3E8E5A' : '#C23B2E',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                  }}
                >
                  {pwAlert.type === 'success' && <CheckCircle className="h-4 w-4 shrink-0" />}
                  {pwAlert.msg}
                </div>
              )}

              <PasswordField label="Current Password" value={currentPassword} onChange={setCurrentPassword} show={showCurrent} onToggleShow={() => setShowCurrent((v) => !v)} />

              <div className="space-y-2">
                <PasswordField label="New Password" value={newPassword} onChange={setNewPassword} show={showNew} onToggleShow={() => setShowNew((v) => !v)} />
                {newPassword.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className="h-1 flex-1 transition-all duration-300"
                          style={{
                            borderRadius: 4,
                            background: level <= passwordStrength
                              ? (passwordStrength === 1 ? '#C23B2E' : passwordStrength === 2 ? '#C98A1E' : '#3E8E5A')
                              : '#CBD3CF',
                          }}
                        />
                      ))}
                    </div>
                    <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 600, color: passwordStrength === 1 ? '#C23B2E' : passwordStrength === 2 ? '#C98A1E' : '#3E8E5A' }}>
                      {strengthLabel[passwordStrength]} password
                    </p>
                  </div>
                )}
              </div>

              <PasswordField label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} onToggleShow={() => setShowConfirm((v) => !v)} />

              <div className="pt-1">
                <button
                  className="h-10 px-5 text-sm font-semibold text-white gap-2 flex items-center"
                  style={{ background: '#1FB2A6', borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif", opacity: pwLoading ? 0.7 : 1 }}
                  onClick={handleChangePassword}
                  disabled={pwLoading}
                >
                  {pwLoading
                    ? <><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                    : <><Shield className="h-3.5 w-3.5" /> Update Password</>}
                </button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Notifications Tab ── */}
        <TabsContent value="notifications" className="mt-5">
          <div style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, borderTop: '3px solid #C98A1E', overflow: 'hidden' }}>
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #CBD3CF' }}>
              <div className="flex h-8 w-8 items-center justify-center" style={{ background: 'rgba(201,138,30,0.1)', borderRadius: 4 }}>
                <Bell className="h-4 w-4" style={{ color: '#C98A1E' }} />
              </div>
              <div>
                <h3 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 13, fontWeight: 600, textTransform: 'uppercase', color: '#1B1F2B' }}>Notification Preferences</h3>
                <p style={{ fontSize: 11, color: '#6E7D79', marginTop: 1 }}>Control what alerts the agent sends you</p>
              </div>
            </div>

            <div className="p-5 space-y-3">
              {([
                { key: 'emailFollowUp'    as keyof NotifPrefs, icon: Mail,          label: 'Follow-up Email Alerts',    desc: 'Notify when auto follow-up emails are sent',  color: '#1FB2A6', bg: 'rgba(31,178,166,0.1)'  },
                { key: 'emailNewLead'     as keyof NotifPrefs, icon: Bell,          label: 'New Lead Alerts',           desc: 'Notify when a new lead is scraped or added',  color: '#3E8E5A', bg: 'rgba(62,142,90,0.1)'   },
                { key: 'whatsappOutreach' as keyof NotifPrefs, icon: MessageSquare, label: 'WhatsApp Outreach Alerts',  desc: 'Notify when WhatsApp messages are sent',      color: '#C98A1E', bg: 'rgba(201,138,30,0.1)'  },
                { key: 'sequenceAlerts'   as keyof NotifPrefs, icon: GitBranch,     label: 'Sequence Step Alerts',      desc: 'Notify when a sequence step is executed',     color: '#C23B2E', bg: 'rgba(194,59,46,0.1)'   },
              ] as const).map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-4 p-3.5 transition-colors"
                  style={{ border: '1px solid #CBD3CF', borderRadius: 4 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(154,198,232,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center" style={{ background: item.bg, borderRadius: 4 }}>
                      <item.icon className="h-3.5 w-3.5" style={{ color: item.color }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1B1F2B', fontFamily: "'IBM Plex Sans', sans-serif" }}>{item.label}</p>
                      <p style={{ fontSize: 11, color: '#6E7D79', marginTop: 1 }}>{item.desc}</p>
                    </div>
                  </div>
                  <button
                    role="switch"
                    aria-checked={notif[item.key]}
                    onClick={() => setNotif((p) => ({ ...p, [item.key]: !p[item.key] }))}
                    className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
                    style={{ background: notif[item.key] ? '#1FB2A6' : '#CBD3CF' }}
                  >
                    <span
                      className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200"
                      style={{ transform: notif[item.key] ? 'translateX(16px)' : 'translateX(0)' }}
                    />
                  </button>
                </div>
              ))}

              <div className="pt-1">
                <button
                  onClick={handleSaveNotif}
                  className="h-9 px-4 text-sm font-semibold gap-2 flex items-center text-white transition-all"
                  style={{ background: notifSaved ? '#3E8E5A' : '#1FB2A6', borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                  {notifSaved
                    ? <><CheckCircle className="h-3.5 w-3.5" /> Saved!</>
                    : <><Bell className="h-3.5 w-3.5" /> Save Preferences</>}
                </button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── About Tab ── */}
        <TabsContent value="about" className="mt-5">
          <div style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, borderTop: '3px solid #1B1F2B', overflow: 'hidden' }}>
            <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: '1px solid #CBD3CF' }}>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center" style={{ background: 'rgba(110,125,121,0.1)', borderRadius: 4 }}>
                  <Info className="h-4 w-4" style={{ color: '#6E7D79' }} />
                </div>
                <div>
                  <h3 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 13, fontWeight: 600, textTransform: 'uppercase', color: '#1B1F2B' }}>Application Info</h3>
                  <p style={{ fontSize: 11, color: '#6E7D79', marginTop: 1 }}>Details about this system</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1" style={{ background: 'rgba(31,178,166,0.08)', border: '1px solid rgba(31,178,166,0.2)', borderRadius: 4 }}>
                <Zap className="h-3 w-3" style={{ color: '#1FB2A6' }} />
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 600, color: '#1FB2A6' }}>AI Powered</span>
              </div>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { icon: Server, label: 'Backend',   value: 'Node.js + Express', color: '#3E8E5A', bg: 'rgba(62,142,90,0.08)' },
                  { icon: Brain,  label: 'AI Engine',  value: aiStatus ? (aiStatus.active === 'groq' ? 'Groq LLaMA 3.3' : 'Ollama Local') : 'Groq LLaMA 3.3', color: '#1FB2A6', bg: 'rgba(31,178,166,0.08)' },
                  { icon: Zap,    label: 'Frontend',   value: 'React + Vite',     color: '#C98A1E', bg: 'rgba(201,138,30,0.08)' },
                ].map((tech) => (
                  <div key={tech.label} className="p-3 text-center" style={{ border: '1px solid #CBD3CF', borderRadius: 4 }}>
                    <div className="flex h-8 w-8 items-center justify-center mx-auto mb-1.5" style={{ background: tech.bg, borderRadius: 4 }}>
                      <tech.icon className="h-4 w-4" style={{ color: tech.color }} />
                    </div>
                    <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: '#6E7D79' }}>{tech.label}</p>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#1B1F2B', marginTop: 2 }}>{tech.value}</p>
                  </div>
                ))}
              </div>

              {aiStatus && (
                <div className="p-3.5 mb-4 space-y-2" style={{ border: '1px solid #CBD3CF', borderRadius: 4 }}>
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6E7D79', marginBottom: 8 }}>AI Provider Status</p>
                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: aiStatus.groqReady ? '#1FB2A6' : '#9CADB0' }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#1B1F2B' }}>Groq API</span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 600, color: aiStatus.groqReady ? '#1FB2A6' : '#6E7D79' }}>
                        {aiStatus.groqReady ? 'Configured' : 'Not set'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: aiStatus.ollamaReady ? '#3E8E5A' : '#9CADB0' }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#1B1F2B' }}>Ollama Local</span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 600, color: aiStatus.ollamaReady ? '#3E8E5A' : '#6E7D79' }}>
                        {aiStatus.ollamaReady ? 'Running' : 'Offline'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: '#6E7D79' }}>Active:</span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(31,178,166,0.12)', color: '#1FB2A6' }}>
                        {aiStatus.active === 'groq' ? 'Groq LLaMA 3.3' : 'Ollama'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ border: '1px solid #CBD3CF', borderRadius: 4, overflow: 'hidden' }}>
                {appInfo.map((row, idx) => (
                  <div
                    key={row.label}
                    className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 px-4 py-3 transition-colors"
                    style={{ borderBottom: idx < appInfo.length - 1 ? '1px solid #CBD3CF' : 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(154,198,232,0.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', color: '#6E7D79', minWidth: 112, flexShrink: 0 }}>{row.label}</span>
                    <span style={{ fontSize: 13, color: '#1B1F2B' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useEffect, useState, useCallback } from 'react';
import {
  Eye, EyeOff, Lock, Info, CheckCircle, Shield, Zap, Server, Brain,
  Bell, Mail, MessageSquare, GitBranch, Plug, RefreshCw, Save,
  AlertCircle, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/services/api';
import { cn } from '@/lib/utils';

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
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.08)',
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
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.08)',
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
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
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
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.08)',
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
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</Label>
      <div className="relative">
        <Input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 rounded-lg border-border/70 text-sm pr-10 focus-visible:ring-primary/30"
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
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: group.bg }}>
            <group.icon className="h-4 w-4" style={{ color: group.color }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
              {allConfigured ? (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ACTIVE
                </span>
              ) : anyConfigured ? (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  PARTIAL
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
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
                      <span className="text-xs font-mono text-muted-foreground">{status.displayValue}</span>
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Not configured
                    </div>
                  )}
                </div>
              );
            })}

            <div className="pt-2">
              {saved ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <CheckCircle className="h-3.5 w-3.5" /> Settings saved successfully!
                </div>
              ) : (
                <Button
                  size="sm"
                  className="h-8 rounded-lg text-xs font-semibold gap-1.5"
                  style={{ background: `linear-gradient(135deg, ${group.color}, ${group.color}cc)`, color: '#fff' }}
                  onClick={handleEdit}
                >
                  <Plug className="h-3 w-3" />
                  {allConfigured ? 'Update Credentials' : 'Configure'}
                </Button>
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
                      className="h-9 rounded-lg border-border/70 text-sm pr-10"
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
                    className="h-9 rounded-lg border-border/70 text-sm"
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
              <Button
                size="sm"
                className="h-8 rounded-lg text-xs font-semibold gap-1.5 text-white"
                style={{ background: `linear-gradient(135deg, ${group.color}, ${group.color}cc)` }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? <><span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                  : <><Save className="h-3 w-3" /> Save</>}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg text-xs border-border/60"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
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

  return (
    <div className="space-y-5 p-5 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account, integrations, and preferences</p>
      </div>

      <Tabs defaultValue="integrations">
        <TabsList className="h-10 rounded-xl bg-muted/60 p-1 gap-1 w-full">
          <TabsTrigger value="integrations" className="flex-1 rounded-lg text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Plug className="mr-2 h-3.5 w-3.5" /> Integrations
          </TabsTrigger>
          <TabsTrigger value="security" className="flex-1 rounded-lg text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Lock className="mr-2 h-3.5 w-3.5" /> Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1 rounded-lg text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Bell className="mr-2 h-3.5 w-3.5" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="about" className="flex-1 rounded-lg text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Info className="mr-2 h-3.5 w-3.5" /> About
          </TabsTrigger>
        </TabsList>

        {/* ── Integrations Tab ── */}
        <TabsContent value="integrations" className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Configure API credentials for each integration</p>
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-lg text-xs border-border/60 gap-1.5"
              onClick={fetchIntegrations}
              disabled={intLoading}
            >
              <RefreshCw className={cn('h-3 w-3', intLoading && 'animate-spin')} />
              Refresh
            </Button>
          </div>

          {/* Summary bar */}
          {!intLoading && (
            <div className="rounded-xl border border-border bg-card shadow-sm p-4 flex items-center gap-4 flex-wrap">
              {INTEGRATION_GROUPS.map((group) => {
                const configured = group.fields.filter((f) => integrations[f.key]?.configured).length;
                const total      = group.fields.length;
                const all        = configured === total;
                return (
                  <div key={group.id} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ background: all ? '#22C55E' : configured > 0 ? '#F59E0B' : '#9CA3AF' }} />
                    <span className="text-xs text-muted-foreground">{group.title.split(' — ')[0]}</span>
                    <span className="text-xs font-semibold text-foreground">{configured}/{total}</span>
                  </div>
                );
              })}
            </div>
          )}

          {intLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card shadow-sm h-24 animate-pulse" />
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
              {pwAlert && (
                <div className={cn(
                  'flex items-center gap-2.5 text-sm rounded-lg p-3 border',
                  pwAlert.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300',
                )}>
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
                        <div key={level} className={cn('h-1 flex-1 rounded-full transition-all duration-300', level <= passwordStrength ? strengthColor[passwordStrength] : 'bg-muted')} />
                      ))}
                    </div>
                    <p className={cn('text-xs font-medium', passwordStrength === 1 ? 'text-rose-500' : passwordStrength === 2 ? 'text-amber-500' : 'text-emerald-500')}>
                      {strengthLabel[passwordStrength]} password
                    </p>
                  </div>
                )}
              </div>

              <PasswordField label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} onToggleShow={() => setShowConfirm((v) => !v)} />

              <div className="pt-1">
                <Button
                  className="h-10 rounded-lg text-sm font-semibold text-gray-900 gap-2"
                  style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}
                  onClick={handleChangePassword}
                  disabled={pwLoading}
                >
                  {pwLoading
                    ? <><span className="h-3.5 w-3.5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" /> Saving...</>
                    : <><Shield className="h-3.5 w-3.5" /> Update Password</>}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Notifications Tab ── */}
        <TabsContent value="notifications" className="mt-5">
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'rgba(99,102,241,0.1)' }}>
                <Bell className="h-4 w-4" style={{ color: '#6366F1' }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Notification Preferences</h3>
                <p className="text-xs text-muted-foreground">Control what alerts the agent sends you</p>
              </div>
            </div>

            <div className="p-5 space-y-3">
              {([
                { key: 'emailFollowUp'    as keyof NotifPrefs, icon: Mail,          label: 'Follow-up Email Alerts',    desc: 'Notify when auto follow-up emails are sent',  color: '#3B82F6', bg: 'rgba(59,130,246,0.1)'  },
                { key: 'emailNewLead'     as keyof NotifPrefs, icon: Bell,          label: 'New Lead Alerts',           desc: 'Notify when a new lead is scraped or added',  color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
                { key: 'whatsappOutreach' as keyof NotifPrefs, icon: MessageSquare, label: 'WhatsApp Outreach Alerts',  desc: 'Notify when WhatsApp messages are sent',      color: '#10B981', bg: 'rgba(16,185,129,0.1)'  },
                { key: 'sequenceAlerts'   as keyof NotifPrefs, icon: GitBranch,     label: 'Sequence Step Alerts',      desc: 'Notify when a sequence step is executed',     color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  },
              ] as const).map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border/50 p-3.5 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: item.bg }}>
                      <item.icon className="h-3.5 w-3.5" style={{ color: item.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <button
                    role="switch"
                    aria-checked={notif[item.key]}
                    onClick={() => setNotif((p) => ({ ...p, [item.key]: !p[item.key] }))}
                    className={cn(
                      'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
                      'transition-colors duration-200 focus:outline-none',
                      notif[item.key] ? 'bg-primary' : 'bg-muted',
                    )}
                  >
                    <span className={cn(
                      'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200',
                      notif[item.key] ? 'translate-x-4' : 'translate-x-0',
                    )} />
                  </button>
                </div>
              ))}

              <div className="pt-1">
                <Button
                  onClick={handleSaveNotif}
                  className={cn('h-9 text-sm font-semibold gap-2 rounded-lg transition-all', notifSaved && 'bg-emerald-500')}
                  style={!notifSaved ? { background: 'linear-gradient(135deg, #2563EB, #7C3AED)', color: '#fff' } : { color: '#fff' }}
                >
                  {notifSaved
                    ? <><CheckCircle className="h-3.5 w-3.5" /> Saved!</>
                    : <><Bell className="h-3.5 w-3.5" /> Save Preferences</>}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── About Tab ── */}
        <TabsContent value="about" className="mt-5">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

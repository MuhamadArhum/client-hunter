import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, TrendingUp, FileText, Mail, ArrowUpRight,
  Plus, Sparkles, BarChart3, ArrowRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import api from '@/services/api';

interface StatusBreakdown { _id: string; count: number; }
interface Lead { _id: string; companyName: string; contactName: string; email: string; status: string; source: string; }
interface OutreachItem { _id: string; lead?: { companyName?: string }; type: string; status: string; subject?: string; createdAt: string; }
interface DashboardData {
  totalLeads: number; conversionRate: number; sentProposals: number; totalEmails: number;
  statusBreakdown: StatusBreakdown[]; recentLeads: Lead[]; recentOutreach: OutreachItem[];
}

/* ── Design tokens (matching sample) ── */
const T = {
  bg:           '#F4F5F7',
  surface:      '#FFFFFF',
  surface2:     '#ECEEF1',
  border:       '#DEE1E6',
  borderStrong: '#C7CCD3',
  text:         '#181B20',
  textMuted:    '#5D6470',
  textDim:      '#97A2A3',
  accent:       '#0F766E',
  accentHover:  '#0C5F58',
  accentSoft:   'rgba(15,118,110,0.08)',
  accentBorder: 'rgba(15,118,110,0.20)',
  info:         '#3E5C76',
  infoSoft:     'rgba(62,92,118,0.08)',
  infoBorder:   'rgba(62,92,118,0.20)',
  warning:      '#B45309',
  warningSoft:  'rgba(180,83,9,0.08)',
  warningBorder:'rgba(180,83,9,0.20)',
  success:      '#16A34A',
  successSoft:  'rgba(22,163,74,0.08)',
  successBorder:'rgba(22,163,74,0.20)',
  danger:       '#9F1239',
  dangerSoft:   'rgba(159,18,57,0.08)',
  dangerBorder: 'rgba(159,18,57,0.20)',
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  new:           { bg: T.accentSoft,   text: T.accent,   dot: T.accent,   border: T.accentBorder   },
  contacted:     { bg: T.infoSoft,     text: T.info,     dot: T.info,     border: T.infoBorder     },
  proposal_sent: { bg: 'rgba(109,40,217,0.08)', text: '#6D28D9', dot: '#6D28D9', border: 'rgba(109,40,217,0.20)' },
  follow_up:     { bg: T.warningSoft,  text: T.warning,  dot: T.warning,  border: T.warningBorder  },
  converted:     { bg: T.successSoft,  text: T.success,  dot: T.success,  border: T.successBorder  },
  lost:          { bg: T.dangerSoft,   text: T.danger,   dot: T.danger,   border: T.dangerBorder   },
};

const CHART_COLORS: Record<string, string> = {
  new: T.accent, contacted: T.info, proposal_sent: '#6D28D9',
  follow_up: T.warning, converted: T.success, lost: T.danger,
};

const STAT_CARDS = [
  { icon: Users,      label: 'Total Leads',     key: 'totalLeads'     as const, accent: T.accent,   iconBg: T.accentSoft,   trend: '+12%' },
  { icon: TrendingUp, label: 'Conversion Rate', key: 'conversionRate' as const, suffix: '%', accent: T.success, iconBg: T.successSoft, trend: '+4%' },
  { icon: FileText,   label: 'Proposals Sent',  key: 'sentProposals'  as const, accent: T.info,     iconBg: T.infoSoft,     trend: '+8%'  },
  { icon: Mail,       label: 'Emails Sent',     key: 'totalEmails'    as const, accent: T.warning,  iconBg: T.warningSoft,  trend: '+16%' },
];

const CARD: React.CSSProperties = {
  background: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: 10,
  boxShadow: '0 1px 3px rgba(24,27,32,0.07), 0 1px 2px rgba(24,27,32,0.04)',
};

function StatCard({ card, value }: { card: typeof STAT_CARDS[0]; value: string | number }) {
  return (
    <div
      className="relative rounded-[10px] p-5 overflow-hidden cursor-default transition-all duration-200 hover:-translate-y-0.5"
      style={CARD}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = '0 4px 16px rgba(24,27,32,0.10), 0 8px 32px rgba(24,27,32,0.08)';
        el.style.borderColor = T.borderStrong;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = '0 1px 3px rgba(24,27,32,0.07), 0 1px 2px rgba(24,27,32,0.04)';
        el.style.borderColor = T.border;
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: card.iconBg }}>
          <card.icon className="h-4 w-4" style={{ color: card.accent }} />
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: T.successSoft, color: T.success }}
        >
          ↑ {card.trend}
        </span>
      </div>
      <p className="mono text-3xl font-bold tracking-tight leading-none mb-1.5" style={{ color: T.text }}>
        {value}
      </p>
      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: T.textDim }}>{card.label}</p>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="rounded-[10px] p-5" style={CARD}>
      <div className="flex items-start justify-between mb-4">
        <div className="h-9 w-9 rounded-lg animate-pulse" style={{ background: T.surface2 }} />
        <div className="h-5 w-12 rounded-full animate-pulse" style={{ background: T.surface2 }} />
      </div>
      <div className="h-8 w-20 rounded mb-2 animate-pulse" style={{ background: T.surface2 }} />
      <div className="h-3 w-24 rounded animate-pulse" style={{ background: T.surface2 }} />
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, boxShadow: '0 10px 24px -8px rgba(24,27,32,0.18)', padding: '9px 13px' }}>
        <p className="text-[11px] capitalize mb-0.5" style={{ color: T.textMuted }}>{label?.replace(/_/g, ' ')}</p>
        <p className="mono text-sm font-bold" style={{ color: T.text }}>{payload[0].value} leads</p>
      </div>
    );
  }
  return null;
};

function OutlineBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-xs font-semibold px-3 h-7 rounded-lg transition-colors"
      style={{ background: T.surface2, border: `1px solid ${T.border}`, color: T.textMuted }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = T.text; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = T.textMuted; }}
    >
      {children}
    </button>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/analytics/dashboard')
      .then((res) => setData(res.data?.data || res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();

  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="page-content space-y-5 p-6" style={{ background: T.bg, minHeight: '100vh' }}>
        <div className="h-24 rounded-[10px] animate-pulse" style={{ background: T.surface2, border: `1px solid ${T.border}` }} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <StatSkeleton key={i} />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-[58%_1fr]">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-[10px] p-5 space-y-4" style={CARD}>
              <div className="h-4 w-32 rounded animate-pulse" style={{ background: T.surface2 }} />
              <div className="h-52 rounded-lg animate-pulse" style={{ background: T.surface2 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const chartData = (Array.isArray(data?.statusBreakdown) ? data!.statusBreakdown : []).map((s) => ({
    name: s._id, label: s._id.replace(/_/g, ' '), count: s.count,
  }));

  const followUpCount  = (data?.statusBreakdown || []).find((s) => s._id === 'follow_up')?.count  || 0;
  const newLeadsCount  = (data?.statusBreakdown || []).find((s) => s._id === 'new')?.count         || 0;
  const convRate       = data?.conversionRate || 0;
  const totalInPipeline = chartData.reduce((sum, d) => sum + d.count, 0);
  const convertedCount = (data?.statusBreakdown || []).find((s) => s._id === 'converted')?.count   || 0;

  return (
    <div className="page-content space-y-5 p-6" style={{ background: T.bg, minHeight: '100vh' }}>

      {/* ── Hero Banner ── */}
      <div
        className="relative overflow-hidden rounded-[10px] px-6 py-5"
        style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: '0 1px 3px rgba(24,27,32,0.07)' }}
      >
        <div className="absolute pointer-events-none" style={{ top: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: T.accentSoft }} />

        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-md" style={{ background: T.accentSoft }}>
                <Sparkles className="h-3 w-3" style={{ color: T.accent }} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: T.accent }}>AI-Powered Pipeline</span>
            </div>
            <h2 className="text-xl font-extrabold mb-0.5" style={{ color: T.text }}>{greeting} 👋</h2>
            <p className="text-sm" style={{ color: T.textMuted }}>{monthLabel} · Your client acquisition overview</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate('/analytics')}
              className="flex items-center gap-2 text-sm font-medium px-4 h-9 rounded-lg transition-all"
              style={{ background: T.surface2, border: `1px solid ${T.border}`, color: T.textMuted }}
              onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = T.text; b.style.borderColor = T.borderStrong; }}
              onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = T.textMuted; b.style.borderColor = T.border; }}
            >
              <BarChart3 className="h-3.5 w-3.5" /> Analytics
            </button>
            <button
              onClick={() => navigate('/leads')}
              className="flex items-center gap-2 text-sm font-bold px-4 h-9 rounded-lg transition-all"
              style={{ background: T.accent, color: '#FFFFFF' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = T.accentHover; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = T.accent; }}
            >
              <Plus className="h-3.5 w-3.5" /> Add Lead
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((card) => {
          const raw = data?.[card.key] ?? 0;
          const val = 'suffix' in card ? `${raw}${card.suffix}` : raw;
          return <StatCard key={card.key} card={card} value={val} />;
        })}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid gap-4 lg:grid-cols-[58%_1fr]">

        {/* Pipeline Chart */}
        <div className="rounded-[10px] overflow-hidden" style={CARD}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <p className="text-sm font-bold" style={{ color: T.text }}>Leads Pipeline</p>
              <p className="text-[11px] mt-0.5" style={{ color: T.textDim }}>{totalInPipeline} total · {convertedCount} converted</p>
            </div>
            <OutlineBtn onClick={() => navigate('/analytics')}>
              View all <ArrowRight className="h-3 w-3" />
            </OutlineBtn>
          </div>
          <div className="px-5 pb-5">
            {chartData.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center gap-3 text-center">
                <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: T.surface2 }}>
                  <BarChart3 className="h-4 w-4" style={{ color: T.textDim }} />
                </div>
                <p className="text-sm" style={{ color: T.textMuted }}>No pipeline data yet</p>
                <button
                  className="text-xs font-bold px-4 h-8 rounded-lg text-white"
                  style={{ background: T.accent, border: 'none', cursor: 'pointer' }}
                  onClick={() => navigate('/leads')}
                >
                  Add your first lead
                </button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke={T.border} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.textDim }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: T.textDim }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: T.accentSoft, radius: 6 }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={CHART_COLORS[entry.name] || T.accent} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="rounded-[10px] overflow-hidden" style={CARD}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <p className="text-sm font-bold" style={{ color: T.text }}>Recent Leads</p>
              <p className="text-[11px] mt-0.5" style={{ color: T.textDim }}>Latest additions</p>
            </div>
            <OutlineBtn onClick={() => navigate('/leads')}>
              View all <ArrowRight className="h-3 w-3" />
            </OutlineBtn>
          </div>
          <div className="px-3 pb-5">
            {(Array.isArray(data?.recentLeads) ? data!.recentLeads : []).length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center gap-3 text-center">
                <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: T.surface2 }}>
                  <Users className="h-4 w-4" style={{ color: T.textDim }} />
                </div>
                <p className="text-sm" style={{ color: T.textMuted }}>No leads yet</p>
              </div>
            ) : (
              <ul className="space-y-0.5">
                {(Array.isArray(data?.recentLeads) ? data!.recentLeads : []).slice(0, 6).map((lead) => {
                  const st = STATUS_STYLES[lead.status] || STATUS_STYLES.new;
                  const initials = lead.companyName?.slice(0, 2).toUpperCase() || '??';
                  return (
                    <li
                      key={lead._id}
                      className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 cursor-pointer transition-colors duration-100"
                      style={{ background: 'transparent' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLLIElement).style.background = T.surface2; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLLIElement).style.background = 'transparent'; }}
                      onClick={() => navigate(`/leads/${lead._id}`)}
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                        style={{ background: T.surface2, color: T.textMuted }}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold truncate" style={{ color: T.text }}>{lead.companyName}</p>
                        <p className="text-[11px] truncate" style={{ color: T.textDim }}>{lead.contactName || lead.email || '—'}</p>
                      </div>
                      <span
                        className="inline-flex items-center gap-1.5 text-[9.5px] font-bold px-2 py-1 rounded-md whitespace-nowrap shrink-0"
                        style={{ background: st.bg, color: st.text }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.dot }} />
                        {lead.status?.replace(/_/g, ' ')}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ── AI Insights Panel ── */}
      <div className="rounded-[10px] p-5" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: '0 1px 3px rgba(24,27,32,0.07)' }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: T.accentSoft }}>
              <Sparkles className="h-4 w-4" style={{ color: T.accent }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: T.text }}>AI Pipeline Insights</p>
              <p className="text-[11px]" style={{ color: T.textMuted }}>Auto-generated from your pipeline data</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 text-xs font-bold px-4 h-8 rounded-lg transition-all"
            style={{ background: T.accentSoft, border: `1px solid ${T.accentBorder}`, color: T.accent }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(15,118,110,0.14)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = T.accentSoft; }}
          >
            <Sparkles className="h-3 w-3" /> Run AI Analysis
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              emoji: '🚀',
              title: `${newLeadsCount} New Lead${newLeadsCount !== 1 ? 's' : ''} Ready`,
              desc: newLeadsCount > 0 ? 'Qualify and move them forward' : 'Import leads to grow your pipeline',
              bg: T.accentSoft, border: T.accentBorder, titleColor: T.accent,
            },
            {
              emoji: convRate >= 15 ? '⚡' : '📈',
              title: `${convRate}% Conversion Rate`,
              desc: convRate >= 15 ? 'Above industry average' : 'Send more proposals to improve',
              bg: convRate >= 15 ? T.successSoft : T.warningSoft,
              border: convRate >= 15 ? T.successBorder : T.warningBorder,
              titleColor: convRate >= 15 ? T.success : T.warning,
            },
            {
              emoji: '🕐',
              title: `${followUpCount} Follow-up${followUpCount !== 1 ? 's' : ''} Pending`,
              desc: followUpCount > 0 ? "Don't let these go cold" : 'All caught up — great work!',
              bg: followUpCount > 0 ? T.warningSoft : T.successSoft,
              border: followUpCount > 0 ? T.warningBorder : T.successBorder,
              titleColor: followUpCount > 0 ? T.warning : T.success,
            },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg p-4" style={{ background: item.bg, border: `1px solid ${item.border}` }}>
              <span className="text-lg mt-0.5">{item.emoji}</span>
              <div>
                <p className="text-[12.5px] font-bold" style={{ color: item.titleColor }}>{item.title}</p>
                <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: T.textMuted }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent Outreach ── */}
      <div className="rounded-[10px] overflow-hidden" style={CARD}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-sm font-bold" style={{ color: T.text }}>Recent Outreach</p>
            <p className="text-[11px] mt-0.5" style={{ color: T.textDim }}>Latest emails and messages sent</p>
          </div>
          <OutlineBtn onClick={() => navigate('/outreach')}>
            View all <ArrowRight className="h-3 w-3" />
          </OutlineBtn>
        </div>
        <div className="px-5 pb-5">
          {(Array.isArray(data?.recentOutreach) ? data!.recentOutreach : []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: T.surface2 }}>
                <Mail className="h-4 w-4" style={{ color: T.textDim }} />
              </div>
              <p className="text-sm" style={{ color: T.textMuted }}>No outreach sent yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Company', 'Type', 'Subject', 'Status', 'Date'].map((h, i) => (
                      <th
                        key={h}
                        className={`text-left py-2.5 pr-4 text-[11px] font-semibold uppercase tracking-wider${i === 2 ? ' hidden md:table-cell' : ''}`}
                        style={{ color: T.textDim }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(data?.recentOutreach) ? data!.recentOutreach : []).map((item, idx, arr) => (
                    <tr
                      key={item._id}
                      className="transition-colors"
                      style={{ borderBottom: idx === arr.length - 1 ? 'none' : `1px solid ${T.border}` }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = T.bg; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                    >
                      <td className="py-3 pr-4 font-semibold text-[12.5px]" style={{ color: T.text }}>{item.lead?.companyName || '—'}</td>
                      <td className="py-3 pr-4">
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md"
                          style={item.type === 'email'
                            ? { background: T.accentSoft, color: T.accent }
                            : { background: T.infoSoft,   color: T.info   }}
                        >
                          {item.type === 'email' ? '✉' : '💬'} {item.type}
                        </span>
                      </td>
                      <td className="py-3 pr-4 hidden md:table-cell max-w-[200px]">
                        <span className="truncate block text-[11px]" style={{ color: T.textMuted }}>{item.subject || '—'}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md"
                          style={item.status === 'sent'
                            ? { background: T.successSoft, color: T.success }
                            : { background: T.dangerSoft,  color: T.danger  }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: item.status === 'sent' ? T.success : T.danger }} />
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 text-[11px] whitespace-nowrap mono" style={{ color: T.textDim }}>
                        {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Users,      label: 'Manage Leads',      desc: 'View and qualify your pipeline',  path: '/leads',     accent: T.accent,   iconBg: T.accentSoft   },
          { icon: FileText,   label: 'Generate Proposal', desc: 'Create AI-powered proposals',     path: '/proposals', accent: T.info,     iconBg: T.infoSoft     },
          { icon: TrendingUp, label: 'View Analytics',    desc: 'Track your performance metrics',  path: '/analytics', accent: T.success,  iconBg: T.successSoft  },
        ].map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className="group relative flex items-center gap-4 rounded-[10px] p-4 text-left transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: '0 1px 3px rgba(24,27,32,0.06)' }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.borderColor = T.borderStrong;
              el.style.boxShadow = '0 4px 16px rgba(24,27,32,0.10)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.borderColor = T.border;
              el.style.boxShadow = '0 1px 3px rgba(24,27,32,0.06)';
            }}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105"
              style={{ background: action.iconBg }}
            >
              <action.icon className="h-4.5 w-4.5" style={{ color: action.accent }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-bold mb-0.5" style={{ color: T.text }}>{action.label}</p>
              <p className="text-[11px]" style={{ color: T.textMuted }}>{action.desc}</p>
            </div>
            <ArrowUpRight
              className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              style={{ color: T.textDim }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

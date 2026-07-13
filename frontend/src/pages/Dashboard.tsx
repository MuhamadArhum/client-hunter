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
interface OutreachItem { _id: string; leadId?: { companyName?: string }; type: string; status: string; subject?: string; createdAt: string; }
interface DashboardData {
  totalLeads: number; conversionRate: number; sentProposals: number; totalEmails: number;
  statusBreakdown: StatusBreakdown[]; recentLeads: Lead[]; recentOutreach: OutreachItem[];
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  new:           { bg: '#EFF6FF', text: '#1E40AF', dot: '#3B82F6', border: '#BFDBFE' },
  contacted:     { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B', border: '#FDE68A' },
  proposal_sent: { bg: '#F5F3FF', text: '#4C1D95', dot: '#8B5CF6', border: '#DDD6FE' },
  follow_up:     { bg: '#EEF2FF', text: '#3730A3', dot: '#6366F1', border: '#C7D2FE' },
  converted:     { bg: '#F0FDF4', text: '#166534', dot: '#22C55E', border: '#BBF7D0' },
  lost:          { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444', border: '#FECACA' },
};

const CHART_COLORS: Record<string, string> = {
  new: '#3B82F6', contacted: '#F59E0B', proposal_sent: '#8B5CF6',
  follow_up: '#6366F1', converted: '#22C55E', lost: '#EF4444',
};

const STAT_CARDS = [
  { icon: Users,      label: 'Total Leads',     key: 'totalLeads'     as const, accent: '#3B82F6', iconBg: 'rgba(59,130,246,0.10)',  trend: '+12%', trendUp: true  },
  { icon: TrendingUp, label: 'Conversion Rate', key: 'conversionRate' as const, suffix: '%', accent: '#6366F1', iconBg: 'rgba(99,102,241,0.10)', trend: '+4%', trendUp: true },
  { icon: FileText,   label: 'Proposals Sent',  key: 'sentProposals'  as const, accent: '#8B5CF6', iconBg: 'rgba(139,92,246,0.10)', trend: '+8%',  trendUp: true },
  { icon: Mail,       label: 'Emails Sent',     key: 'totalEmails'    as const, accent: '#0EA5E9', iconBg: 'rgba(14,165,233,0.10)',  trend: '+16%', trendUp: true },
];

const CARD: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 16,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

function StatCard({ card, value }: { card: typeof STAT_CARDS[0]; value: string | number }) {
  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden cursor-default transition-all duration-200 hover:-translate-y-1"
      style={CARD}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = `0 8px 28px rgba(0,0,0,0.09)`;
        el.style.borderColor = card.accent + '55';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
        el.style.borderColor = '#E2E8F0';
      }}
    >
      {/* Accent strip */}
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${card.accent}, ${card.accent}99)` }} />

      <div className="flex items-start justify-between mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: card.iconBg }}>
          <card.icon className="h-[18px] w-[18px]" style={{ color: card.accent }} />
        </div>
        <span
          className="text-[11px] font-bold px-2.5 py-1 rounded-full"
          style={{ background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' }}
        >
          ↑ {card.trend}
        </span>
      </div>

      <p className="text-4xl font-black tracking-tight leading-none mb-1.5" style={{ color: '#0F172A' }}>
        {value}
      </p>
      <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#94A3B8' }}>{card.label}</p>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="rounded-2xl p-5" style={CARD}>
      <div className="h-[3px] rounded-t-xl mb-4 animate-pulse" style={{ background: '#F1F5F9' }} />
      <div className="flex items-start justify-between mb-4">
        <div className="h-10 w-10 rounded-xl animate-pulse" style={{ background: '#F1F5F9' }} />
        <div className="h-6 w-14 rounded-full animate-pulse" style={{ background: '#F1F5F9' }} />
      </div>
      <div className="h-10 w-20 rounded-lg mb-2 animate-pulse" style={{ background: '#F1F5F9' }} />
      <div className="h-3 w-28 rounded animate-pulse" style={{ background: '#F1F5F9' }} />
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '10px 14px' }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="h-2 w-2 rounded-full" style={{ background: '#3B82F6' }} />
          <p className="text-[11px] capitalize" style={{ color: '#64748B' }}>{label?.replace(/_/g, ' ')}</p>
        </div>
        <p className="text-sm font-bold" style={{ color: '#0F172A' }}>{payload[0].value} leads</p>
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
      style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#DBEAFE'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#EFF6FF'; }}
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
      <div className="page-content space-y-6 p-6" style={{ background: '#F8FAFC', minHeight: '100vh' }}>
        <div className="h-28 rounded-2xl animate-pulse" style={{ background: '#EFF6FF', border: '1px solid #DBEAFE' }} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <StatSkeleton key={i} />)}
        </div>
        <div className="grid gap-5 lg:grid-cols-[58%_1fr]">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-2xl p-5 space-y-4" style={CARD}>
              <div className="h-5 w-36 rounded animate-pulse" style={{ background: '#F1F5F9' }} />
              <div className="h-52 rounded-xl animate-pulse" style={{ background: '#F1F5F9' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const chartData = (Array.isArray(data?.statusBreakdown) ? data!.statusBreakdown : []).map((s) => ({
    name: s._id, label: s._id.replace(/_/g, ' '), count: s.count,
  }));

  const followUpCount = (data?.statusBreakdown || []).find((s) => s._id === 'follow_up')?.count || 0;
  const newLeadsCount = (data?.statusBreakdown || []).find((s) => s._id === 'new')?.count || 0;
  const convRate = data?.conversionRate || 0;
  const totalInPipeline = chartData.reduce((sum, d) => sum + d.count, 0);
  const convertedCount = (data?.statusBreakdown || []).find((s) => s._id === 'converted')?.count || 0;

  return (
    <div className="page-content space-y-6 p-6" style={{ background: '#F8FAFC', minHeight: '100vh' }}>

      {/* ── Hero Banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-5"
        style={{
          background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #EDE9FE 100%)',
          border: '1px solid #BFDBFE',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute pointer-events-none" style={{ top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(99,102,241,0.08)' }} />
        <div className="absolute pointer-events-none" style={{ bottom: -30, left: '40%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(59,130,246,0.07)' }} />

        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-md" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
                <Sparkles className="h-3 w-3" style={{ color: '#1D4ED8' }} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#1D4ED8' }}>AI-Powered Pipeline</span>
            </div>
            <h2 className="text-2xl font-extrabold mb-0.5" style={{ color: '#0F172A' }}>{greeting} 👋</h2>
            <p className="text-sm" style={{ color: '#64748B' }}>{monthLabel} · Your client acquisition overview</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate('/analytics')}
              className="flex items-center gap-2 text-sm font-medium px-4 h-9 rounded-xl transition-all"
              style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', color: '#374151' }}
              onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#F8FAFC'; b.style.borderColor = '#CBD5E1'; }}
              onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#FFFFFF'; b.style.borderColor = '#E2E8F0'; }}
            >
              <BarChart3 className="h-3.5 w-3.5" /> Analytics
            </button>
            <button
              onClick={() => navigate('/leads')}
              className="flex items-center gap-2 text-sm font-bold px-4 h-9 rounded-xl transition-all hover:brightness-105"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', color: '#FFFFFF', boxShadow: '0 4px 14px rgba(59,130,246,0.35)' }}
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
      <div className="grid gap-5 lg:grid-cols-[58%_1fr]">

        {/* Pipeline Chart */}
        <div className="rounded-2xl overflow-hidden" style={CARD}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <p className="text-sm font-bold" style={{ color: '#0F172A' }}>Leads Pipeline</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>{totalInPipeline} total · {convertedCount} converted</p>
            </div>
            <OutlineBtn onClick={() => navigate('/analytics')}>
              View all <ArrowRight className="h-3 w-3" />
            </OutlineBtn>
          </div>
          <div className="px-5 pb-5">
            {chartData.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center gap-3 text-center">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: '#F1F5F9' }}>
                  <BarChart3 className="h-[18px] w-[18px]" style={{ color: '#94A3B8' }} />
                </div>
                <p className="text-sm" style={{ color: '#64748B' }}>No pipeline data yet</p>
                <button
                  className="text-xs font-bold px-4 h-8 rounded-xl text-white"
                  style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', border: 'none', cursor: 'pointer' }}
                  onClick={() => navigate('/leads')}
                >
                  Add your first lead
                </button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)', radius: 6 }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={CHART_COLORS[entry.name] || '#3B82F6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="rounded-2xl overflow-hidden" style={CARD}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <p className="text-sm font-bold" style={{ color: '#0F172A' }}>Recent Leads</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>Latest additions</p>
            </div>
            <OutlineBtn onClick={() => navigate('/leads')}>
              View all <ArrowRight className="h-3 w-3" />
            </OutlineBtn>
          </div>
          <div className="px-3 pb-5">
            {(Array.isArray(data?.recentLeads) ? data!.recentLeads : []).length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center gap-3 text-center">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: '#F1F5F9' }}>
                  <Users className="h-[18px] w-[18px]" style={{ color: '#94A3B8' }} />
                </div>
                <p className="text-sm" style={{ color: '#64748B' }}>No leads yet</p>
              </div>
            ) : (
              <ul className="space-y-0.5">
                {(Array.isArray(data?.recentLeads) ? data!.recentLeads : []).slice(0, 6).map((lead) => {
                  const st = STATUS_STYLES[lead.status] || STATUS_STYLES.new;
                  const initials = lead.companyName?.slice(0, 2).toUpperCase() || '??';
                  return (
                    <li
                      key={lead._id}
                      className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 cursor-pointer transition-colors duration-100"
                      style={{ background: 'transparent' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLLIElement).style.background = '#EFF6FF'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLLIElement).style.background = 'transparent'; }}
                      onClick={() => navigate(`/leads/${lead._id}`)}
                    >
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white"
                        style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#0F172A' }}>{lead.companyName}</p>
                        <p className="text-xs truncate" style={{ color: '#94A3B8' }}>{lead.contactName || lead.email || '—'}</p>
                      </div>
                      <span
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
                        style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}
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
      <div
        className="rounded-2xl p-5"
        style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #EDE9FE 100%)', border: '1px solid #BFDBFE' }}
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}
            >
              <Sparkles className="h-4 w-4" style={{ color: '#1D4ED8' }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: '#0F172A' }}>AI Pipeline Insights</p>
              <p className="text-[11px]" style={{ color: '#64748B' }}>Auto-generated from your pipeline data</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/ai-chat')}
            className="flex items-center gap-2 text-xs font-bold px-4 h-8 rounded-xl transition-all"
            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: '#1D4ED8' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.2)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.12)'; }}
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
              border: '#BFDBFE', titleColor: '#1E40AF',
            },
            {
              emoji: convRate >= 15 ? '⚡' : '📈',
              title: `${convRate}% Conversion Rate`,
              desc: convRate >= 15 ? 'Above industry average' : 'Send more proposals to improve',
              border: convRate >= 15 ? '#BFDBFE' : '#FDE68A', titleColor: convRate >= 15 ? '#1E40AF' : '#92400E',
            },
            {
              emoji: '🕐',
              title: `${followUpCount} Follow-up${followUpCount !== 1 ? 's' : ''} Pending`,
              desc: followUpCount > 0 ? "Don't let these go cold" : 'All caught up — great work!',
              border: followUpCount > 0 ? '#FDE68A' : '#C7D2FE', titleColor: followUpCount > 0 ? '#92400E' : '#3730A3',
            },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl p-4" style={{ background: '#FFFFFF', border: `1px solid ${item.border}` }}>
              <span className="text-lg mt-0.5">{item.emoji}</span>
              <div>
                <p className="text-sm font-bold" style={{ color: item.titleColor }}>{item.title}</p>
                <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: '#64748B' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent Outreach ── */}
      <div className="rounded-2xl overflow-hidden" style={CARD}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-sm font-bold" style={{ color: '#0F172A' }}>Recent Outreach</p>
            <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>Latest emails and messages sent</p>
          </div>
          <OutlineBtn onClick={() => navigate('/outreach')}>
            View all <ArrowRight className="h-3 w-3" />
          </OutlineBtn>
        </div>
        <div className="px-5 pb-5">
          {(Array.isArray(data?.recentOutreach) ? data!.recentOutreach : []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: '#F1F5F9' }}>
                <Mail className="h-[18px] w-[18px]" style={{ color: '#94A3B8' }} />
              </div>
              <p className="text-sm" style={{ color: '#64748B' }}>No outreach sent yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                    {['Company', 'Type', 'Subject', 'Status', 'Date'].map((h, i) => (
                      <th
                        key={h}
                        className={`text-left py-2.5 pr-4 text-[11px] font-bold uppercase tracking-widest${i === 2 ? ' hidden md:table-cell' : ''}`}
                        style={{ color: '#94A3B8' }}
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
                      style={{ borderBottom: idx === arr.length - 1 ? 'none' : '1px solid #F1F5F9' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '#F8FAFC'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                    >
                      <td className="py-3 pr-4 font-semibold text-sm" style={{ color: '#0F172A' }}>{item.leadId?.companyName || '—'}</td>
                      <td className="py-3 pr-4">
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                          style={item.type === 'email'
                            ? { background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' }
                            : { background: '#F5F3FF', color: '#4C1D95', border: '1px solid #DDD6FE' }}
                        >
                          {item.type === 'email' ? '✉' : '💬'} {item.type}
                        </span>
                      </td>
                      <td className="py-3 pr-4 hidden md:table-cell max-w-[200px]">
                        <span className="truncate block text-xs" style={{ color: '#64748B' }}>{item.subject || '—'}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                          style={item.status === 'sent'
                            ? { background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' }
                            : { background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: item.status === 'sent' ? '#22C55E' : '#EF4444' }} />
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 text-[11px] whitespace-nowrap" style={{ color: '#94A3B8' }}>
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
          { icon: Users,      label: 'Manage Leads',      desc: 'View and qualify your pipeline',  path: '/leads',     accent: '#3B82F6', iconBg: 'rgba(59,130,246,0.1)'  },
          { icon: FileText,   label: 'Generate Proposal', desc: 'Create AI-powered proposals',     path: '/proposals', accent: '#8B5CF6', iconBg: 'rgba(139,92,246,0.1)' },
          { icon: TrendingUp, label: 'View Analytics',    desc: 'Track your performance metrics',  path: '/analytics', accent: '#6366F1', iconBg: 'rgba(99,102,241,0.1)'  },
        ].map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className="group relative flex items-center gap-4 rounded-2xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.borderColor = action.accent + '55';
              el.style.boxShadow = `0 6px 20px rgba(0,0,0,0.08)`;
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.borderColor = '#E2E8F0';
              el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
            }}
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
              style={{ background: action.iconBg }}
            >
              <action.icon className="h-5 w-5" style={{ color: action.accent }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold mb-0.5" style={{ color: '#0F172A' }}>{action.label}</p>
              <p className="text-xs" style={{ color: '#64748B' }}>{action.desc}</p>
            </div>
            <ArrowUpRight
              className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              style={{ color: '#CBD5E1' }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

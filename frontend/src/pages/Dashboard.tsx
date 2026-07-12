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
  new:           { bg: '#ECFDF5', text: '#065F46', dot: '#10B981', border: '#A7F3D0' },
  contacted:     { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B', border: '#FDE68A' },
  proposal_sent: { bg: '#F5F3FF', text: '#4C1D95', dot: '#8B5CF6', border: '#DDD6FE' },
  follow_up:     { bg: '#EEF2FF', text: '#3730A3', dot: '#6366F1', border: '#C7D2FE' },
  converted:     { bg: '#D1FAE5', text: '#064E3B', dot: '#21F6A8', border: '#6EE7B7' },
  lost:          { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444', border: '#FECACA' },
};

const CHART_COLORS: Record<string, string> = {
  new: '#21F6A8', contacted: '#F59E0B', proposal_sent: '#8B5CF6',
  follow_up: '#6366F1', converted: '#10B981', lost: '#EF4444',
};

const STAT_CARDS = [
  { icon: Users,      label: 'Total Leads',      key: 'totalLeads'    as const, accent: '#21F6A8', iconBg: 'rgba(33,246,168,0.12)',  trend: '+12%', gradientText: true  },
  { icon: TrendingUp, label: 'Conversion Rate',  key: 'conversionRate'as const, suffix: '%', accent: '#10B981', iconBg: 'rgba(16,185,129,0.12)', trend: '+4%',  gradientText: false },
  { icon: FileText,   label: 'Proposals Sent',   key: 'sentProposals' as const, accent: '#8B5CF6', iconBg: 'rgba(139,92,246,0.12)', trend: '+8%',  gradientText: false },
  { icon: Mail,       label: 'Emails Sent',      key: 'totalEmails'   as const, accent: '#6366F1', iconBg: 'rgba(99,102,241,0.12)',  trend: '+16%', gradientText: false },
];

function StatCard({ card, value }: { card: typeof STAT_CARDS[0]; value: string | number }) {
  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden cursor-default transition-all duration-200 hover:-translate-y-1"
      style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)';
        el.style.borderColor = card.accent + '66';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
        el.style.borderColor = '#E5E7EB';
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: card.accent }} />

      <div className="flex items-start justify-between mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: card.iconBg }}>
          <card.icon className="h-[18px] w-[18px]" style={{ color: card.accent }} />
        </div>
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#ECFDF5', color: '#065F46' }}>
          ↑ {card.trend}
        </span>
      </div>

      {card.gradientText ? (
        <p className="text-4xl font-black tracking-tight leading-none mb-1.5"
          style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          {value}
        </p>
      ) : (
        <p className="text-4xl font-black tracking-tight leading-none mb-1.5" style={{ color: '#111827' }}>{value}</p>
      )}
      <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>{card.label}</p>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="rounded-2xl p-5 overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl animate-pulse" style={{ background: '#F3F4F6' }} />
      <div className="flex items-start justify-between mb-4">
        <div className="h-10 w-10 rounded-xl animate-pulse" style={{ background: '#F3F4F6' }} />
        <div className="h-6 w-14 rounded-full animate-pulse" style={{ background: '#F3F4F6' }} />
      </div>
      <div className="h-10 w-20 rounded-lg mb-2 animate-pulse" style={{ background: '#F3F4F6' }} />
      <div className="h-3 w-28 rounded animate-pulse" style={{ background: '#F3F4F6' }} />
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '10px 14px' }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="h-2 w-2 rounded-full" style={{ background: '#21F6A8' }} />
          <p className="text-[11px] capitalize" style={{ color: '#6B7280' }}>{label?.replace(/_/g, ' ')}</p>
        </div>
        <p className="text-sm font-bold" style={{ color: '#111827' }}>{payload[0].value} leads</p>
      </div>
    );
  }
  return null;
};

function GhostGreenBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-xs font-semibold px-3 h-7 rounded-lg transition-colors"
      style={{ background: '#F0FDF9', border: '1px solid #A7F3D0', color: '#065F46' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#D1FAE5'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F0FDF9'; }}
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
      <div className="page-content space-y-6 p-6">
        <div className="h-28 rounded-2xl animate-pulse" style={{ background: '#F3F4F6', border: '1px solid #E5E7EB' }} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="relative overflow-hidden"><StatSkeleton /></div>)}
        </div>
        <div className="grid gap-5 lg:grid-cols-[58%_1fr]">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-2xl p-5 space-y-4" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
              <div className="h-5 w-36 rounded animate-pulse" style={{ background: '#F3F4F6' }} />
              <div className="h-52 rounded-xl animate-pulse" style={{ background: '#F3F4F6' }} />
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
  const convertedCount = (data?.statusBreakdown || []).find((s) => s._id === 'converted')?.count || 0;
  const totalInPipeline = chartData.reduce((sum, d) => sum + d.count, 0);
  const convRate = data?.conversionRate || 0;

  const CARD_STYLE = { background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' };

  return (
    <div className="page-content space-y-6 p-6">

      {/* ── Hero Banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-5"
        style={{ background: 'linear-gradient(135deg, rgba(33,246,168,0.07) 0%, rgba(16,185,129,0.02) 60%, #FFFFFF 100%)', border: '1px solid #E5E7EB' }}
      >
        <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
          style={{ background: 'linear-gradient(90deg, transparent 0%, #21F6A8 40%, #10B981 60%, transparent 100%)' }} />
        <div className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(rgba(33,246,168,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-md" style={{ background: 'rgba(33,246,168,0.12)', border: '1px solid rgba(33,246,168,0.25)' }}>
                <Sparkles className="h-3 w-3" style={{ color: '#059669' }} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#059669' }}>AI-Powered Pipeline</span>
            </div>
            <h2 className="text-2xl font-extrabold mb-0.5" style={{ color: '#111827' }}>{greeting} 👋</h2>
            <p className="text-sm" style={{ color: '#6B7280' }}>{monthLabel} · Your client acquisition overview</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate('/analytics')}
              className="flex items-center gap-2 text-sm font-medium px-4 h-9 rounded-xl transition-all"
              style={{ background: '#FFFFFF', border: '1.5px solid #E5E7EB', color: '#374151' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#D1D5DB'; (e.currentTarget as HTMLButtonElement).style.background = '#F9FAFB'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF'; }}
            >
              <BarChart3 className="h-3.5 w-3.5" /> Analytics
            </button>
            <button
              onClick={() => navigate('/leads')}
              className="flex items-center gap-2 text-sm font-bold px-4 h-9 rounded-xl transition-all hover:brightness-105"
              style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)', color: '#111827', boxShadow: '0 4px 12px rgba(33,246,168,0.3)' }}
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
        <div className="rounded-2xl overflow-hidden" style={CARD_STYLE}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <p className="text-sm font-bold" style={{ color: '#111827' }}>Leads Pipeline</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>{totalInPipeline} total · {convertedCount} converted</p>
            </div>
            <GhostGreenBtn onClick={() => navigate('/analytics')}>
              View all <ArrowRight className="h-3 w-3" />
            </GhostGreenBtn>
          </div>
          <div className="px-5 pb-5">
            {chartData.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center gap-3 text-center">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: '#F3F4F6' }}>
                  <BarChart3 className="h-[18px] w-[18px]" style={{ color: '#9CA3AF' }} />
                </div>
                <p className="text-sm" style={{ color: '#6B7280' }}>No pipeline data yet</p>
                <button className="text-xs font-bold px-4 h-8 rounded-xl"
                  style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)', color: '#111827' }}
                  onClick={() => navigate('/leads')}>
                  Add your first lead
                </button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.06)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(33,246,168,0.05)', radius: 6 }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={CHART_COLORS[entry.name] || '#21F6A8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="rounded-2xl overflow-hidden" style={CARD_STYLE}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <p className="text-sm font-bold" style={{ color: '#111827' }}>Recent Leads</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>Latest additions</p>
            </div>
            <GhostGreenBtn onClick={() => navigate('/leads')}>
              View all <ArrowRight className="h-3 w-3" />
            </GhostGreenBtn>
          </div>
          <div className="px-3 pb-5">
            {(Array.isArray(data?.recentLeads) ? data!.recentLeads : []).length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center gap-3 text-center">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: '#F3F4F6' }}>
                  <Users className="h-[18px] w-[18px]" style={{ color: '#9CA3AF' }} />
                </div>
                <p className="text-sm" style={{ color: '#6B7280' }}>No leads yet</p>
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
                      onMouseEnter={(e) => { (e.currentTarget as HTMLLIElement).style.background = '#F0FDF9'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLLIElement).style.background = 'transparent'; }}
                      onClick={() => navigate(`/leads/${lead._id}`)}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black"
                        style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)', color: '#111827' }}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#111827' }}>{lead.companyName}</p>
                        <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>{lead.contactName || lead.email || '—'}</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
                        style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
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
      <div className="rounded-2xl p-5" style={{ background: '#F0FDF9', border: '1px solid rgba(33,246,168,0.3)' }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: 'rgba(33,246,168,0.15)', border: '1px solid rgba(33,246,168,0.3)' }}>
              <Sparkles className="h-4 w-4" style={{ color: '#059669' }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: '#111827' }}>AI Pipeline Insights</p>
              <p className="text-[11px]" style={{ color: '#6B7280' }}>Auto-generated from your pipeline data</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/ai-chat')}
            className="flex items-center gap-2 text-xs font-bold px-4 h-8 rounded-xl transition-all"
            style={{ background: 'rgba(33,246,168,0.15)', border: '1px solid rgba(33,246,168,0.3)', color: '#065F46' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(33,246,168,0.25)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(33,246,168,0.15)'; }}
          >
            <Sparkles className="h-3 w-3" /> Run AI Analysis
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-xl p-4" style={{ background: '#FFFFFF', border: '1px solid #A7F3D0' }}>
            <span className="text-lg mt-0.5">🚀</span>
            <div>
              <p className="text-sm font-bold" style={{ color: '#065F46' }}>{newLeadsCount} New Lead{newLeadsCount !== 1 ? 's' : ''} Ready</p>
              <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: '#6B7280' }}>
                {newLeadsCount > 0 ? 'Qualify and move them forward' : 'Import leads to grow your pipeline'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl p-4"
            style={{ background: '#FFFFFF', border: `1px solid ${convRate >= 15 ? '#A7F3D0' : '#FDE68A'}` }}>
            <span className="text-lg mt-0.5">{convRate >= 15 ? '⚡' : '📈'}</span>
            <div>
              <p className="text-sm font-bold" style={{ color: convRate >= 15 ? '#065F46' : '#92400E' }}>{convRate}% Conversion Rate</p>
              <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: '#6B7280' }}>
                {convRate >= 15 ? 'Above industry average' : 'Send more proposals to improve'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl p-4"
            style={{ background: '#FFFFFF', border: `1px solid ${followUpCount > 0 ? '#FDE68A' : '#C7D2FE'}` }}>
            <span className="text-lg mt-0.5">🕐</span>
            <div>
              <p className="text-sm font-bold" style={{ color: followUpCount > 0 ? '#92400E' : '#3730A3' }}>
                {followUpCount} Follow-up{followUpCount !== 1 ? 's' : ''} Pending
              </p>
              <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: '#6B7280' }}>
                {followUpCount > 0 ? "Don't let these go cold" : 'All caught up — great work!'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Outreach ── */}
      <div className="rounded-2xl overflow-hidden" style={CARD_STYLE}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-sm font-bold" style={{ color: '#111827' }}>Recent Outreach</p>
            <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>Latest emails and messages sent</p>
          </div>
          <GhostGreenBtn onClick={() => navigate('/outreach')}>
            View all <ArrowRight className="h-3 w-3" />
          </GhostGreenBtn>
        </div>
        <div className="px-5 pb-5">
          {(Array.isArray(data?.recentOutreach) ? data!.recentOutreach : []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: '#F3F4F6' }}>
                <Mail className="h-[18px] w-[18px]" style={{ color: '#9CA3AF' }} />
              </div>
              <p className="text-sm" style={{ color: '#6B7280' }}>No outreach sent yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #F3F4F6', background: '#F9FAFB' }}>
                    {['Company', 'Type', 'Subject', 'Status', 'Date'].map((h, i) => (
                      <th key={h} className={`text-left py-2.5 pr-4 text-[11px] font-bold uppercase tracking-widest${i === 2 ? ' hidden md:table-cell' : ''}`}
                        style={{ color: '#9CA3AF' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(data?.recentOutreach) ? data!.recentOutreach : []).map((item, idx, arr) => (
                    <tr key={item._id} className="transition-colors"
                      style={{ borderBottom: idx === arr.length - 1 ? 'none' : '1px solid #F3F4F6' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '#F9FAFB'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}>
                      <td className="py-3 pr-4 font-semibold text-sm" style={{ color: '#111827' }}>{item.leadId?.companyName || '—'}</td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                          style={item.type === 'email'
                            ? { background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }
                            : { background: '#F5F3FF', color: '#4C1D95', border: '1px solid #DDD6FE' }}>
                          {item.type === 'email' ? '✉' : '💬'} {item.type}
                        </span>
                      </td>
                      <td className="py-3 pr-4 hidden md:table-cell max-w-[200px]">
                        <span className="truncate block text-xs" style={{ color: '#6B7280' }}>{item.subject || '—'}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                          style={item.status === 'sent'
                            ? { background: '#D1FAE5', color: '#064E3B', border: '1px solid #6EE7B7' }
                            : { background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: item.status === 'sent' ? '#10B981' : '#EF4444' }} />
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 text-[11px] whitespace-nowrap" style={{ color: '#9CA3AF' }}>
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
          { icon: Users,      label: 'Manage Leads',      desc: 'View and qualify your pipeline',   path: '/leads',     accent: '#21F6A8', iconBg: 'rgba(33,246,168,0.1)' },
          { icon: FileText,   label: 'Generate Proposal', desc: 'Create AI-powered proposals',      path: '/proposals', accent: '#8B5CF6', iconBg: 'rgba(139,92,246,0.1)' },
          { icon: TrendingUp, label: 'View Analytics',    desc: 'Track your performance metrics',   path: '/analytics', accent: '#10B981', iconBg: 'rgba(16,185,129,0.1)' },
        ].map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className="group relative flex items-center gap-4 rounded-2xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.borderColor = action.accent + '55';
              el.style.boxShadow = `0 4px 16px ${action.iconBg.replace('0.1', '0.2')}`;
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.borderColor = '#E5E7EB';
              el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
            }}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
              style={{ background: action.iconBg }}>
              <action.icon className="h-5 w-5" style={{ color: action.accent }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold mb-0.5" style={{ color: '#111827' }}>{action.label}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>{action.desc}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              style={{ color: '#D1D5DB' }} />
          </button>
        ))}
      </div>
    </div>
  );
}

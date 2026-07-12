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
  new:           { bg: 'rgba(33,246,168,0.1)',  text: '#21F6A8', dot: '#21F6A8', border: 'rgba(33,246,168,0.2)' },
  contacted:     { bg: 'rgba(245,158,11,0.1)',  text: '#FCD34D', dot: '#F59E0B', border: 'rgba(245,158,11,0.2)' },
  proposal_sent: { bg: 'rgba(139,92,246,0.1)',  text: '#C4B5FD', dot: '#8B5CF6', border: 'rgba(139,92,246,0.2)' },
  follow_up:     { bg: 'rgba(99,102,241,0.1)',  text: '#A5B4FC', dot: '#6366F1', border: 'rgba(99,102,241,0.2)' },
  converted:     { bg: 'rgba(16,185,129,0.1)',  text: '#6EE7B7', dot: '#10B981', border: 'rgba(16,185,129,0.2)' },
  lost:          { bg: 'rgba(244,63,94,0.1)',   text: '#FCA5A5', dot: '#F43F5E', border: 'rgba(244,63,94,0.2)' },
};

const CHART_COLORS: Record<string, string> = {
  new: '#21F6A8', contacted: '#F59E0B', proposal_sent: '#8B5CF6',
  follow_up: '#6366F1', converted: '#10B981', lost: '#F43F5E',
};

const STAT_CARDS = [
  {
    icon: Users, label: 'Total Leads', key: 'totalLeads' as const,
    accent: '#21F6A8', bgColor: 'rgba(33,246,168,0.08)', borderColor: 'rgba(33,246,168,0.2)',
    trend: '+12%', gradientText: true,
  },
  {
    icon: TrendingUp, label: 'Conversion Rate', key: 'conversionRate' as const, suffix: '%',
    accent: '#10B981', bgColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.2)',
    trend: '+4%', gradientText: false,
  },
  {
    icon: FileText, label: 'Proposals Sent', key: 'sentProposals' as const,
    accent: '#8B5CF6', bgColor: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.2)',
    trend: '+8%', gradientText: false,
  },
  {
    icon: Mail, label: 'Emails Sent', key: 'totalEmails' as const,
    accent: '#6366F1', bgColor: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.2)',
    trend: '+16%', gradientText: false,
  },
];

function StatCard({ card, value }: { card: typeof STAT_CARDS[0]; value: string | number }) {
  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden cursor-default transition-all duration-200 hover:-translate-y-1"
      style={{ background: '#111613', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = card.borderColor;
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px ${card.bgColor.replace('0.08', '0.22')}, 0 2px 8px rgba(0,0,0,0.3)`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl" style={{ background: card.accent }} />

      <div className="flex items-start justify-between mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: card.bgColor }}>
          <card.icon className="h-[18px] w-[18px]" style={{ color: card.accent }} />
        </div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(33,246,168,0.08)', color: '#0D9C6A' }}>
          ↑ {card.trend}
        </span>
      </div>

      {card.gradientText ? (
        <p
          className="text-4xl font-black tracking-tight leading-none mb-2"
          style={{ background: 'linear-gradient(135deg, #21F6A8 0%, #A7F3D0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
        >
          {value}
        </p>
      ) : (
        <p className="text-4xl font-black tracking-tight leading-none mb-2" style={{ color: '#E2E8F0' }}>
          {value}
        </p>
      )}

      <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(148,163,184,0.5)' }}>
        {card.label}
      </p>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="relative rounded-2xl p-5 overflow-hidden" style={{ background: '#111613', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl" style={{ background: 'rgba(33,246,168,0.15)' }} />
      <div className="flex items-start justify-between mb-4">
        <div className="h-10 w-10 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="h-5 w-14 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>
      <div className="h-10 w-24 rounded-xl mb-2 animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="h-3 w-28 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: '#161c17', border: '1px solid rgba(33,246,168,0.2)',
        borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', padding: '10px 14px',
      }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="h-2 w-2 rounded-full" style={{ background: '#21F6A8' }} />
          <p className="text-[11px] capitalize" style={{ color: 'rgba(148,163,184,0.55)' }}>{label?.replace(/_/g, ' ')}</p>
        </div>
        <p className="text-sm font-bold" style={{ color: '#E2E8F0' }}>{payload[0].value} leads</p>
      </div>
    );
  }
  return null;
};

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-xs font-semibold px-3 h-7 rounded-lg transition-colors"
      style={{ background: 'rgba(33,246,168,0.06)', border: '1px solid rgba(33,246,168,0.12)', color: '#0D9C6A' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(33,246,168,0.1)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(33,246,168,0.06)'; }}
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

  if (loading) {
    return (
      <div className="space-y-5 p-5">
        <div className="h-28 w-full rounded-2xl animate-pulse" style={{ background: '#111613', border: '1px solid rgba(255,255,255,0.07)' }} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-2xl p-5 space-y-4" style={{ background: '#111613', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="h-5 w-32 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="h-52 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const chartData = (Array.isArray(data?.statusBreakdown) ? data.statusBreakdown : []).map((s) => ({
    name: s._id, label: s._id.replace(/_/g, ' '), count: s.count,
  }));

  const followUpCount = (data?.statusBreakdown || []).find((s) => s._id === 'follow_up')?.count || 0;
  const newLeadsCount = (data?.statusBreakdown || []).find((s) => s._id === 'new')?.count || 0;
  const convertedCount = (data?.statusBreakdown || []).find((s) => s._id === 'converted')?.count || 0;
  const totalInPipeline = chartData.reduce((sum, d) => sum + d.count, 0);
  const convRate = data?.conversionRate || 0;

  return (
    <div className="space-y-5 p-5">

      {/* ── Hero Banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-5"
        style={{ background: 'linear-gradient(145deg, #111613 0%, #0e1610 100%)', border: '1px solid rgba(33,246,168,0.12)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
          style={{ background: 'linear-gradient(90deg, transparent 0%, #21F6A8 35%, #10B981 65%, transparent 100%)' }} />
        <div className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(rgba(33,246,168,0.05) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-md"
                style={{ background: 'rgba(33,246,168,0.1)', border: '1px solid rgba(33,246,168,0.2)' }}>
                <Sparkles className="h-3 w-3" style={{ color: '#21F6A8' }} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#0D9C6A' }}>
                AI-Powered Pipeline
              </span>
            </div>
            <h2 className="text-2xl font-extrabold mb-1" style={{ color: '#E2E8F0' }}>{greeting} 👋</h2>
            <p className="text-sm" style={{ color: 'rgba(148,163,184,0.55)' }}>
              Your client acquisition overview for today.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate('/analytics')}
              className="flex items-center gap-2 text-sm font-medium px-4 h-9 rounded-xl transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(148,163,184,0.8)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)'; (e.currentTarget as HTMLButtonElement).style.color = '#E2E8F0'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(148,163,184,0.8)'; }}
            >
              <BarChart3 className="h-3.5 w-3.5" /> Analytics
            </button>
            <button
              onClick={() => navigate('/leads')}
              className="flex items-center gap-2 text-sm font-bold px-4 h-9 rounded-xl transition-all hover:brightness-105"
              style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)', color: '#0a0f0a', boxShadow: '0 4px 16px rgba(33,246,168,0.25)' }}
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
        <div className="rounded-2xl overflow-hidden" style={{ background: '#111613', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <p className="text-sm font-bold" style={{ color: '#E2E8F0' }}>Leads Pipeline</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(148,163,184,0.45)' }}>
                {totalInPipeline} total · {convertedCount} converted
              </p>
            </div>
            <GhostBtn onClick={() => navigate('/analytics')}>
              View all <ArrowRight className="h-3 w-3" />
            </GhostBtn>
          </div>
          <div className="px-5 pb-5">
            {chartData.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center gap-3 text-center">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(33,246,168,0.08)' }}>
                  <BarChart3 className="h-[18px] w-[18px]" style={{ color: 'rgba(148,163,184,0.35)' }} />
                </div>
                <p className="text-sm" style={{ color: 'rgba(148,163,184,0.5)' }}>No pipeline data yet</p>
                <button
                  className="text-xs font-bold px-4 h-8 rounded-xl"
                  style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)', color: '#0a0f0a' }}
                  onClick={() => navigate('/leads')}
                >
                  Add your first lead
                </button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'rgba(148,163,184,0.4)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'rgba(148,163,184,0.4)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(33,246,168,0.04)', radius: 6 }} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={36}>
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
        <div className="rounded-2xl overflow-hidden" style={{ background: '#111613', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <p className="text-sm font-bold" style={{ color: '#E2E8F0' }}>Recent Leads</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(148,163,184,0.45)' }}>Latest additions</p>
            </div>
            <GhostBtn onClick={() => navigate('/leads')}>
              View all <ArrowRight className="h-3 w-3" />
            </GhostBtn>
          </div>
          <div className="px-3 pb-5">
            {(Array.isArray(data?.recentLeads) ? data.recentLeads : []).length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center gap-3 text-center">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(33,246,168,0.08)' }}>
                  <Users className="h-[18px] w-[18px]" style={{ color: 'rgba(148,163,184,0.35)' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#E2E8F0' }}>No leads yet</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(148,163,184,0.45)' }}>Add or scrape your first lead</p>
                </div>
              </div>
            ) : (
              <ul className="space-y-0.5">
                {(Array.isArray(data?.recentLeads) ? data.recentLeads : []).slice(0, 6).map((lead) => {
                  const st = STATUS_STYLES[lead.status] || STATUS_STYLES.new;
                  const initials = lead.companyName?.slice(0, 2).toUpperCase() || '??';
                  return (
                    <li
                      key={lead._id}
                      className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 cursor-pointer transition-colors duration-100"
                      style={{ background: 'transparent' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLLIElement).style.background = '#161c17'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLLIElement).style.background = 'transparent'; }}
                      onClick={() => navigate(`/leads/${lead._id}`)}
                    >
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black"
                        style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)', color: '#0a0f0a' }}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#E2E8F0' }}>{lead.companyName}</p>
                        <p className="text-xs truncate" style={{ color: 'rgba(148,163,184,0.45)' }}>
                          {lead.contactName || lead.email || '—'}
                        </p>
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
        style={{ background: 'linear-gradient(145deg, #0e1a10 0%, #111613 100%)', border: '1px solid rgba(33,246,168,0.15)' }}
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: 'rgba(33,246,168,0.1)', border: '1px solid rgba(33,246,168,0.2)' }}>
              <Sparkles className="h-4 w-4" style={{ color: '#21F6A8' }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: '#E2E8F0' }}>AI Pipeline Insights</p>
              <p className="text-[11px]" style={{ color: 'rgba(148,163,184,0.45)' }}>Auto-generated from your pipeline data</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/ai-chat')}
            className="flex items-center gap-2 text-xs font-bold px-4 h-8 rounded-xl transition-all hover:brightness-110"
            style={{ background: 'rgba(33,246,168,0.08)', border: '1px solid rgba(33,246,168,0.2)', color: '#0D9C6A' }}
          >
            <Sparkles className="h-3 w-3" /> Run AI Analysis
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-xl p-4" style={{ background: 'rgba(33,246,168,0.05)', border: '1px solid rgba(33,246,168,0.12)' }}>
            <span className="text-lg mt-0.5">🚀</span>
            <div>
              <p className="text-sm font-bold" style={{ color: '#21F6A8' }}>
                {newLeadsCount} New Lead{newLeadsCount !== 1 ? 's' : ''} Ready
              </p>
              <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'rgba(148,163,184,0.5)' }}>
                {newLeadsCount > 0 ? 'Qualify and move them forward' : 'Import leads to grow your pipeline'}
              </p>
            </div>
          </div>

          <div
            className="flex items-start gap-3 rounded-xl p-4"
            style={{
              background: convRate >= 15 ? 'rgba(33,246,168,0.05)' : 'rgba(245,158,11,0.05)',
              border: `1px solid ${convRate >= 15 ? 'rgba(33,246,168,0.12)' : 'rgba(245,158,11,0.12)'}`,
            }}
          >
            <span className="text-lg mt-0.5">{convRate >= 15 ? '⚡' : '📈'}</span>
            <div>
              <p className="text-sm font-bold" style={{ color: convRate >= 15 ? '#21F6A8' : '#FCD34D' }}>
                {convRate}% Conversion Rate
              </p>
              <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'rgba(148,163,184,0.5)' }}>
                {convRate >= 15 ? 'Above industry average — great work' : 'Send more proposals to improve this'}
              </p>
            </div>
          </div>

          <div
            className="flex items-start gap-3 rounded-xl p-4"
            style={{
              background: followUpCount > 0 ? 'rgba(245,158,11,0.05)' : 'rgba(99,102,241,0.05)',
              border: `1px solid ${followUpCount > 0 ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.12)'}`,
            }}
          >
            <span className="text-lg mt-0.5">🕐</span>
            <div>
              <p className="text-sm font-bold" style={{ color: followUpCount > 0 ? '#FCD34D' : '#A5B4FC' }}>
                {followUpCount} Follow-up{followUpCount !== 1 ? 's' : ''} Pending
              </p>
              <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'rgba(148,163,184,0.5)' }}>
                {followUpCount > 0 ? "Don't let these leads go cold" : 'All caught up — great job!'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Outreach ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#111613', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-sm font-bold" style={{ color: '#E2E8F0' }}>Recent Outreach</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(148,163,184,0.45)' }}>Latest emails and messages sent</p>
          </div>
          <GhostBtn onClick={() => navigate('/outreach')}>
            View all <ArrowRight className="h-3 w-3" />
          </GhostBtn>
        </div>
        <div className="px-5 pb-5">
          {(Array.isArray(data?.recentOutreach) ? data.recentOutreach : []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(33,246,168,0.08)' }}>
                <Mail className="h-[18px] w-[18px]" style={{ color: 'rgba(148,163,184,0.35)' }} />
              </div>
              <p className="text-sm" style={{ color: 'rgba(148,163,184,0.5)' }}>No outreach sent yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(33,246,168,0.08)', background: 'rgba(33,246,168,0.02)' }}>
                    {['Company', 'Type', 'Subject', 'Status', 'Date'].map((h, i) => (
                      <th
                        key={h}
                        className={`text-left py-2.5 pr-4 text-[11px] font-bold uppercase tracking-widest${i === 2 ? ' hidden md:table-cell' : ''}`}
                        style={{ color: 'rgba(148,163,184,0.4)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(data?.recentOutreach) ? data.recentOutreach : []).map((item, idx, arr) => (
                    <tr
                      key={item._id}
                      className="transition-colors"
                      style={{ borderBottom: idx === arr.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(33,246,168,0.025)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                    >
                      <td className="py-3 pr-4 font-semibold text-sm" style={{ color: '#CBD5E1' }}>
                        {item.leadId?.companyName || '—'}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                          style={item.type === 'email'
                            ? { background: 'rgba(33,246,168,0.08)', color: '#0D9C6A', border: '1px solid rgba(33,246,168,0.15)' }
                            : { background: 'rgba(139,92,246,0.08)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.15)' }
                          }
                        >
                          {item.type === 'email' ? '✉' : '💬'} {item.type}
                        </span>
                      </td>
                      <td className="py-3 pr-4 hidden md:table-cell max-w-[200px]">
                        <span className="truncate block text-xs" style={{ color: 'rgba(148,163,184,0.45)' }}>
                          {item.subject || '—'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                          style={item.status === 'sent'
                            ? { background: 'rgba(33,246,168,0.08)', color: '#21F6A8', border: '1px solid rgba(33,246,168,0.15)' }
                            : { background: 'rgba(244,63,94,0.08)', color: '#FCA5A5', border: '1px solid rgba(244,63,94,0.15)' }
                          }
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: item.status === 'sent' ? '#21F6A8' : '#F43F5E' }} />
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 text-[11px] whitespace-nowrap" style={{ color: 'rgba(148,163,184,0.4)' }}>
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
          { icon: Users,     label: 'Manage Leads',       desc: 'View and qualify your pipeline',   path: '/leads',     accent: '#21F6A8', iconBg: 'rgba(33,246,168,0.1)' },
          { icon: FileText,  label: 'Generate Proposal',  desc: 'Create AI-powered proposals',      path: '/proposals', accent: '#8B5CF6', iconBg: 'rgba(139,92,246,0.1)' },
          { icon: TrendingUp, label: 'View Analytics',    desc: 'Track your performance metrics',   path: '/analytics', accent: '#10B981', iconBg: 'rgba(16,185,129,0.1)' },
        ].map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className="group relative flex items-center gap-4 rounded-2xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: '#111613', border: '1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = action.accent + '33';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 20px ${action.iconBg.replace('0.1', '0.15')}`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
              style={{ background: action.iconBg }}>
              <action.icon className="h-5 w-5" style={{ color: action.accent }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold mb-0.5" style={{ color: '#E2E8F0' }}>{action.label}</p>
              <p className="text-xs" style={{ color: 'rgba(148,163,184,0.5)' }}>{action.desc}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              style={{ color: 'rgba(148,163,184,0.2)' }} />
          </button>
        ))}
      </div>

    </div>
  );
}

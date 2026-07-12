import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, FileText, Mail, Brain, Target, ArrowUpRight, ExternalLink } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/services/api';
import { cn } from '@/lib/utils';

const PIE_COLORS = ['#21F6A8', '#10B981', '#059669', '#f59e0b', '#6366f1', '#f43f5e'];

interface DashboardData {
  totalLeads: number;
  conversionRate: number;
  sentProposals: number;
  totalEmails: number;
  statusBreakdown: { _id: string; count: number }[];
}
interface OutreachStats { emailSent: number; emailFailed: number; whatsappSent: number; whatsappFailed: number; }
interface ConversionBySource { source: string; total: number; converted: number; conversionRate: number; }
interface ProposalStats { total: number; accepted: number; rejected: number; sent: number; draft: number; acceptanceRate: number; }
interface AIBreakdown {
  qualBreakdown: { _id: string; count: number }[];
  avgScore: number;
  topLeads: { _id: string; companyName: string; aiScore: number; aiQualification: string; aiRecommendedService: string }[];
}

const ANALYTICS_STAT_CARDS = [
  { icon: Users,     label: 'Total Leads',      key: 'totalLeads'     as const, gradient: 'linear-gradient(135deg, #21F6A8, #10B981)', bgColor: 'rgba(33,246,168,0.08)',  borderColor: 'rgba(33,246,168,0.2)',  glowColor: 'rgba(33,246,168,0.15)',  numClass: 'stat-number-green' },
  { icon: TrendingUp,label: 'Conversion Rate',  key: 'conversionRate' as const, gradient: 'linear-gradient(135deg, #10b981, #34d399)', bgColor: 'rgba(16,185,129,0.08)',  borderColor: 'rgba(16,185,129,0.18)', glowColor: 'rgba(16,185,129,0.15)', numClass: 'stat-number-emerald', suffix: '%' },
  { icon: FileText,  label: 'Proposals Sent',   key: 'sentProposals'  as const, gradient: 'linear-gradient(135deg, #7C3AED, #c084fc)', bgColor: 'rgba(124,58,237,0.08)',  borderColor: 'rgba(124,58,237,0.18)', glowColor: 'rgba(124,58,237,0.15)', numClass: 'stat-number-violet' },
  { icon: Mail,      label: 'Emails Sent',      key: 'totalEmails'    as const, gradient: 'linear-gradient(135deg, #6366f1, #818cf8)', bgColor: 'rgba(99,102,241,0.08)',  borderColor: 'rgba(99,102,241,0.18)', glowColor: 'rgba(99,102,241,0.15)', numClass: 'stat-number-indigo' },
];

function StatCard({ card, value }: { card: typeof ANALYTICS_STAT_CARDS[0]; value: string | number }) {
  return (
    <div
      className="relative rounded-xl p-5 overflow-hidden cursor-default group transition-all duration-300 hover:-translate-y-1"
      style={{ background: card.bgColor, border: `1px solid ${card.borderColor}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 20px ${card.glowColor}, 0 8px 40px rgba(0,0,0,0.1)`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)'; }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: card.gradient }} />
      <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full opacity-30 blur-2xl transition-opacity group-hover:opacity-60" style={{ background: card.gradient }} />
      <div className="flex items-start justify-between mb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
             style={{ background: card.gradient, boxShadow: `0 4px 14px ${card.glowColor}` }}>
          <card.icon className="h-5 w-5 text-white" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 transition-all group-hover:text-muted-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
      <p className={cn('text-4xl font-black tracking-tight mb-0.5', card.numClass)}>{value}</p>
      <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, accent, children }: { title: string; subtitle?: string; accent?: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: accent || 'linear-gradient(90deg, #21F6A8, #10B981)' }} />
      <div className="px-5 py-4 border-b border-border/40">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border/60 bg-popover px-3 py-2 shadow-card">
        <p className="text-xs text-muted-foreground capitalize mb-0.5">{label?.replace(/_/g, ' ')}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-bold text-foreground">{p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

const QUAL_CONFIG: Record<string, { emoji: string; bg: string; text: string; dot: string }> = {
  hot:  { emoji: '🔥', bg: 'bg-rose-50',   text: 'text-rose-700',   dot: 'bg-rose-400' },
  warm: { emoji: '⚡', bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-400' },
  cold: { emoji: '❄️', bg: 'bg-sky-50',    text: 'text-sky-700',    dot: 'bg-sky-400' },
};

const STATUS_COLORS: Record<string, string> = {
  new: '#21F6A8', contacted: '#f59e0b', proposal_sent: '#7C3AED',
  follow_up: '#6366f1', converted: '#10b981', lost: '#f43f5e',
};

export default function Analytics() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [sourceData, setSourceData] = useState<{ _id: string; count: number }[]>([]);
  const [outreachStats, setOutreachStats] = useState<OutreachStats | null>(null);
  const [conversionBySource, setConversionBySource] = useState<ConversionBySource[]>([]);
  const [proposalStats, setProposalStats] = useState<ProposalStats | null>(null);
  const [aiBreakdown, setAiBreakdown] = useState<AIBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/dashboard'),
      api.get('/analytics/leads-by-source'),
      api.get('/analytics/outreach-stats'),
      api.get('/analytics/conversion-by-source'),
      api.get('/analytics/proposal-stats'),
      api.get('/analytics/ai-breakdown'),
    ])
      .then(([dashRes, srcRes, outRes, convRes, propRes, aiRes]) => {
        setDashboard(dashRes.data?.data || dashRes.data);
        setSourceData(Array.isArray(srcRes.data?.data) ? srcRes.data.data : []);
        setOutreachStats(outRes.data?.data || outRes.data);
        setConversionBySource(Array.isArray(convRes.data?.data) ? convRes.data.data : []);
        setProposalStats(propRes.data?.data || null);
        setAiBreakdown(aiRes.data?.data || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusChartData = (Array.isArray(dashboard?.statusBreakdown) ? dashboard!.statusBreakdown : []).map(s => ({
    name: s._id, label: s._id.replace(/_/g, ' '), count: s.count,
  }));

  const sourceChartData = sourceData.map(s => ({ name: s._id, value: s.count }));

  const outreachChartData = outreachStats ? [
    { name: 'Email Sent', count: outreachStats.emailSent, color: '#21F6A8' },
    { name: 'Email Failed', count: outreachStats.emailFailed, color: '#f43f5e' },
    { name: 'WA Sent', count: outreachStats.whatsappSent, color: '#7C3AED' },
    { name: 'WA Failed', count: outreachStats.whatsappFailed, color: '#f59e0b' },
  ] : [];

  const proposalChartData = proposalStats ? [
    { name: 'Accepted', count: proposalStats.accepted, color: '#21F6A8' },
    { name: 'Sent', count: proposalStats.sent, color: '#10b981' },
    { name: 'Rejected', count: proposalStats.rejected, color: '#f43f5e' },
    { name: 'Draft', count: proposalStats.draft, color: '#94a3b8' },
  ] : [];

  if (loading) {
    return (
      <div className="space-y-5 p-6">
        <Skeleton className="h-7 w-36" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <Skeleton className="h-4 w-32 mb-4" />
              <Skeleton className="h-56 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const EmptyChart = ({ height = 220, message = 'No data yet', hint }: { height?: number; message?: string; hint?: string }) => (
    <div className="flex flex-col items-center justify-center gap-1.5 text-center" style={{ height }}>
      <p className="text-sm font-medium" style={{ color: '#9CA3AF' }}>{message}</p>
      {hint && <p className="text-xs" style={{ color: '#D1D5DB' }}>{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-5 p-6">
      <div className="page-header">
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#0D9C6A' }}>Performance</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gradient mb-1">Analytics</h1>
          <p className="text-sm text-muted-foreground font-medium">Performance metrics and pipeline insights</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ANALYTICS_STAT_CARDS.map((card) => {
          const raw = dashboard?.[card.key] ?? 0;
          const val = 'suffix' in card ? `${raw}${card.suffix}` : raw;
          return <StatCard key={card.key} card={card} value={val} />;
        })}
      </div>

      {/* Row 1: Source + Status */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Leads by Source" subtitle="Where your leads come from" accent="linear-gradient(90deg, #21F6A8, #10B981)">
          {sourceChartData.length === 0 ? <EmptyChart message="No leads added yet" hint="Add leads to see source breakdown" /> : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={sourceChartData} cx="50%" cy="50%" outerRadius={85} innerRadius={40} dataKey="value" paddingAngle={3}>
                  {sourceChartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} formatter={(value) => <span className="text-xs text-muted-foreground capitalize">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Leads by Status" subtitle="Pipeline stage distribution" accent="linear-gradient(90deg, #10B981, #6366f1)">
          {statusChartData.length === 0 ? <EmptyChart message="No pipeline data" hint="Leads will appear here once added" /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={statusChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.5)', radius: 6 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {statusChartData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#21F6A8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Row 2: Conversion + Proposals */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Conversion Rate by Source" subtitle="How each source performs" accent="linear-gradient(90deg, #10b981, #21F6A8)">
          {conversionBySource.length === 0 ? <EmptyChart height={180} message="No conversion data" hint="Convert a lead to see rates by source" /> : (
            <div className="space-y-3">
              {conversionBySource.map((item) => (
                <div key={item.source} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{item.source}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{item.total} leads</span>
                      <span className="text-sm font-bold" style={{ color: '#0D9C6A' }}>{item.conversionRate}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.conversionRate}%`, background: 'linear-gradient(90deg, #21F6A8, #10B981)' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard title="Proposal Acceptance Rate" subtitle="Overall proposal performance" accent="linear-gradient(90deg, #7C3AED, #c084fc)">
          {!proposalStats ? <EmptyChart height={180} message="No proposals yet" hint="Generate a proposal to see acceptance stats" /> : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className="h-16 w-16 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(33,246,168,0.08)', border: '1px solid rgba(33,246,168,0.2)' }}
                >
                  <p className="text-xl font-bold" style={{ color: '#0D9C6A' }}>{proposalStats.acceptanceRate}%</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Acceptance Rate</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{proposalStats.total} total proposals</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={proposalChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.5)', radius: 6 }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {proposalChartData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Row 3: Outreach + AI */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Outreach Performance" subtitle="Email and WhatsApp statistics" accent="linear-gradient(90deg, #6366f1, #21F6A8)">
          {outreachChartData.every(d => d.count === 0) ? <EmptyChart message="No outreach sent yet" hint="Send emails or WhatsApp messages to see stats" /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={outreachChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.5)', radius: 6 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {outreachChartData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="AI Lead Intelligence" subtitle="AI-powered scoring and qualification" accent="linear-gradient(90deg, #f59e0b, #21F6A8)">
          {!aiBreakdown || (aiBreakdown.topLeads.length === 0 && aiBreakdown.qualBreakdown.length === 0) ? (
            <div className="flex flex-col items-center justify-center h-56 gap-3 text-center">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: '#F0FDF9' }}>
                <Brain className="h-6 w-6" style={{ color: '#9CA3AF' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#111827' }}>No AI data yet</p>
                <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Open a lead and run AI analysis to see scores here</p>
              </div>
              <button
                onClick={() => navigate('/leads')}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 h-8 rounded-lg transition-colors"
                style={{ background: '#F0FDF9', border: '1px solid #A7F3D0', color: '#065F46' }}
              >
                <ExternalLink className="h-3 w-3" /> Go to Leads
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className="h-16 w-16 rounded-xl flex flex-col items-center justify-center shrink-0"
                  style={{ background: 'rgba(33,246,168,0.08)', border: '1px solid rgba(33,246,168,0.2)' }}
                >
                  <p className="text-xl font-bold" style={{ color: '#0D9C6A' }}>{aiBreakdown.avgScore}</p>
                  <p className="text-[10px] text-muted-foreground">avg score</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {aiBreakdown.qualBreakdown.map((q) => {
                    const cfg = QUAL_CONFIG[q._id];
                    if (!cfg) return null;
                    return (
                      <div key={q._id} className={cn('flex flex-col items-center rounded-xl px-3 py-2', cfg.bg)}>
                        <span className="text-base">{cfg.emoji}</span>
                        <span className={cn('text-lg font-bold', cfg.text)}>{q.count}</span>
                        <span className={cn('text-[10px] capitalize', cfg.text)}>{q._id}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {aiBreakdown.topLeads.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">🔥 Hottest Leads</p>
                    <button
                      onClick={() => navigate('/leads')}
                      className="flex items-center gap-1 text-xs font-semibold transition-colors"
                      style={{ color: '#10B981' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#065F46'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#10B981'; }}
                    >
                      View All <ExternalLink className="h-2.5 w-2.5" />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {aiBreakdown.topLeads.map((lead) => {
                      const cfg = QUAL_CONFIG[lead.aiQualification];
                      return (
                        <div
                          key={lead._id}
                          className="flex items-center gap-3 rounded-xl p-2.5 cursor-pointer transition-colors"
                          style={{ background: 'transparent' }}
                          onClick={() => navigate(`/leads/${lead._id}`)}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#F9FAFB'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                        >
                          <div
                            className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold text-gray-900"
                            style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}
                          >
                            {lead.companyName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: '#111827' }}>{lead.companyName}</p>
                            {lead.aiRecommendedService && (
                              <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>{lead.aiRecommendedService}</p>
                            )}
                          </div>
                          {cfg && (
                            <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0', cfg.bg, cfg.text)}>
                              {cfg.emoji} {lead.aiScore}/10
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

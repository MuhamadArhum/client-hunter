import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, FileText, Mail, Brain, Target, ArrowUpRight, ExternalLink, Eye, MousePointerClick, FileDown } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/services/api';
import { cn } from '@/lib/utils';

const PIE_COLORS = ['#1FB2A6', '#3E8E5A', '#C98A1E', '#C23B2E', '#1B1F2B', '#6E7D79'];

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
interface EmailTracking { totalSent: number; totalOpened: number; totalClicked: number; openRate: number; clickRate: number; clickToOpenRate: number; }
interface MonthlyTrend { month: string; emails: number; whatsapp: number; leads: number; }

const ANALYTICS_STAT_CARDS = [
  { icon: Users,     label: 'Total Leads',      key: 'totalLeads'     as const, accentColor: '#1FB2A6', bgColor: 'rgba(31,178,166,0.08)',  borderColor: 'rgba(31,178,166,0.2)'  },
  { icon: TrendingUp,label: 'Conversion Rate',  key: 'conversionRate' as const, accentColor: '#3E8E5A', bgColor: 'rgba(62,142,90,0.08)',   borderColor: 'rgba(62,142,90,0.2)',  suffix: '%' },
  { icon: FileText,  label: 'Proposals Sent',   key: 'sentProposals'  as const, accentColor: '#C98A1E', bgColor: 'rgba(201,138,30,0.08)',  borderColor: 'rgba(201,138,30,0.2)'  },
  { icon: Mail,      label: 'Emails Sent',      key: 'totalEmails'    as const, accentColor: '#C23B2E', bgColor: 'rgba(194,59,46,0.08)',   borderColor: 'rgba(194,59,46,0.2)'   },
];

function StatCard({ card, value }: { card: typeof ANALYTICS_STAT_CARDS[0]; value: string | number }) {
  return (
    <div
      className="p-5"
      style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, borderTop: `3px solid ${card.accentColor}` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="flex h-10 w-10 items-center justify-center"
          style={{ background: card.bgColor, border: `1px solid ${card.borderColor}`, borderRadius: 4 }}
        >
          <card.icon className="h-5 w-5" style={{ color: card.accentColor }} />
        </div>
        <ArrowUpRight className="h-4 w-4" style={{ color: '#CBD3CF' }} />
      </div>
      <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: 32, fontWeight: 700, color: card.accentColor, lineHeight: 1, marginBottom: 4 }}>{value}</p>
      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6E7D79' }}>{card.label}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, accentColor, children }: { title: string; subtitle?: string; accent?: string; accentColor?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, borderTop: `3px solid ${accentColor || '#1FB2A6'}`, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #CBD3CF' }}>
        <h3 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, fontWeight: 600, textTransform: 'uppercase', color: '#1B1F2B' }}>{title}</h3>
        {subtitle && <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: '#6E7D79', marginTop: 2 }}>{subtitle}</p>}
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
  hot:  { emoji: '🔥', bg: 'rgba(194,59,46,0.1)',  text: '#C23B2E', dot: '#C23B2E' },
  warm: { emoji: '⚡', bg: 'rgba(201,138,30,0.12)', text: '#C98A1E', dot: '#C98A1E' },
  cold: { emoji: '❄️', bg: 'rgba(110,125,121,0.1)', text: '#6E7D79', dot: '#6E7D79' },
};

const STATUS_COLORS: Record<string, string> = {
  new: '#1FB2A6', contacted: '#C98A1E', proposal_sent: '#3E8E5A',
  follow_up: '#C23B2E', converted: '#3E8E5A', lost: '#C23B2E',
};

export default function Analytics() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [sourceData, setSourceData] = useState<{ _id: string; count: number }[]>([]);
  const [outreachStats, setOutreachStats] = useState<OutreachStats | null>(null);
  const [conversionBySource, setConversionBySource] = useState<ConversionBySource[]>([]);
  const [proposalStats, setProposalStats] = useState<ProposalStats | null>(null);
  const [aiBreakdown, setAiBreakdown] = useState<AIBreakdown | null>(null);
  const [emailTracking, setEmailTracking] = useState<EmailTracking | null>(null);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/dashboard'),
      api.get('/analytics/leads-by-source'),
      api.get('/analytics/outreach-stats'),
      api.get('/analytics/conversion-by-source'),
      api.get('/analytics/proposal-stats'),
      api.get('/analytics/ai-breakdown'),
      api.get('/analytics/email-tracking'),
      api.get('/analytics/monthly-trend'),
    ])
      .then(([dashRes, srcRes, outRes, convRes, propRes, aiRes, trackRes, trendRes]) => {
        setDashboard(dashRes.data?.data || dashRes.data);
        setSourceData(Array.isArray(srcRes.data?.data) ? srcRes.data.data : []);
        setOutreachStats(outRes.data?.data || outRes.data);
        setConversionBySource(Array.isArray(convRes.data?.data) ? convRes.data.data : []);
        setProposalStats(propRes.data?.data || null);
        setAiBreakdown(aiRes.data?.data || null);
        setEmailTracking(trackRes.data?.data || null);
        setMonthlyTrend(Array.isArray(trendRes.data?.data) ? trendRes.data.data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusChartData = (Array.isArray(dashboard?.statusBreakdown) ? dashboard!.statusBreakdown : []).map(s => ({
    name: s._id, label: s._id.replace(/_/g, ' '), count: s.count,
  }));

  const sourceChartData = sourceData.map(s => ({ name: s._id, value: s.count }));

  const outreachChartData = outreachStats ? [
    { name: 'Email Sent',   count: outreachStats.emailSent,     color: '#1FB2A6' },
    { name: 'Email Failed', count: outreachStats.emailFailed,   color: '#C23B2E' },
    { name: 'WA Sent',      count: outreachStats.whatsappSent,  color: '#C98A1E' },
    { name: 'WA Failed',    count: outreachStats.whatsappFailed, color: '#6E7D79' },
  ] : [];

  const proposalChartData = proposalStats ? [
    { name: 'Accepted', count: proposalStats.accepted, color: '#3E8E5A' },
    { name: 'Sent',     count: proposalStats.sent,     color: '#1FB2A6' },
    { name: 'Rejected', count: proposalStats.rejected, color: '#C23B2E' },
    { name: 'Draft',    count: proposalStats.draft,    color: '#6E7D79' },
  ] : [];

  if (loading) {
    return (
      <div className="space-y-5 p-6">
        <Skeleton className="h-7 w-36" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-5 space-y-3" style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, borderTop: '3px solid #CBD3CF' }}>
              <Skeleton className="h-10 w-10" style={{ borderRadius: 4 }} />
              <Skeleton className="h-9 w-20" style={{ borderRadius: 4 }} />
              <Skeleton className="h-4 w-28" style={{ borderRadius: 4 }} />
            </div>
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-5" style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, borderTop: '3px solid #CBD3CF' }}>
              <Skeleton className="h-4 w-32 mb-4" style={{ borderRadius: 4 }} />
              <Skeleton className="h-56 w-full" style={{ borderRadius: 4 }} />
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
    <div className="space-y-5 p-6" style={{ background: '#E6E9E5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, borderTop: '3px solid #1FB2A6', padding: '20px 24px' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4" style={{ color: '#1FB2A6' }} />
              <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1FB2A6' }}>Performance</span>
            </div>
            <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1B1F2B', marginBottom: 4 }}>Analytics</h1>
            <p style={{ fontSize: 13, color: '#6E7D79' }}>Performance metrics and pipeline insights</p>
          </div>
          <button
            onClick={async () => {
              const res = await api.get('/analytics/export/csv', { responseType: 'blob' });
              const url = URL.createObjectURL(new Blob([res.data as BlobPart]));
              const a = document.createElement('a');
              a.href = url; a.download = `analytics-${Date.now()}.csv`; a.click();
              URL.revokeObjectURL(url);
            }}
            className="h-9 px-4 gap-2 flex items-center text-sm font-semibold text-white shrink-0"
            style={{ background: '#1FB2A6', borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" }}
          >
            <FileDown className="h-3.5 w-3.5" /> Export CSV
          </button>
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
        <ChartCard title="Leads by Source" subtitle="Where your leads come from" accentColor="#1FB2A6">
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

        <ChartCard title="Leads by Status" subtitle="Pipeline stage distribution" accentColor="#C98A1E">
          {statusChartData.length === 0 ? <EmptyChart message="No pipeline data" hint="Leads will appear here once added" /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={statusChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.5)', radius: 6 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {statusChartData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#0F766E'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Row 2: Conversion + Proposals */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Conversion Rate by Source" subtitle="How each source performs" accentColor="#3E8E5A">
          {conversionBySource.length === 0 ? <EmptyChart height={180} message="No conversion data" hint="Convert a lead to see rates by source" /> : (
            <div className="space-y-3">
              {conversionBySource.map((item) => (
                <div key={item.source} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{item.source}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{item.total} leads</span>
                      <span className="text-sm font-bold" style={{ color: '#1FB2A6' }}>{item.conversionRate}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden" style={{ background: '#CBD3CF', borderRadius: 4 }}>
                    <div
                      className="h-full transition-all duration-500"
                      style={{ width: `${item.conversionRate}%`, background: '#1FB2A6', borderRadius: 4 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard title="Proposal Acceptance Rate" subtitle="Overall proposal performance" accentColor="#C98A1E">
          {!proposalStats ? <EmptyChart height={180} message="No proposals yet" hint="Generate a proposal to see acceptance stats" /> : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className="h-16 w-16 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(31,178,166,0.08)', border: '1px solid rgba(31,178,166,0.2)', borderRadius: 4 }}
                >
                  <p className="text-xl font-bold" style={{ color: '#1FB2A6' }}>{proposalStats.acceptanceRate}%</p>
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

      {/* Row 3: Monthly Trend (full width) */}
      <ChartCard title="Monthly Trend" subtitle="Leads, emails & WhatsApp over last 6 months" accentColor="#1B1F2B">
        {monthlyTrend.every(m => m.emails === 0 && m.whatsapp === 0 && m.leads === 0) ? (
          <EmptyChart message="No trend data yet" hint="Data will appear after your first month of activity" />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlyTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-muted-foreground capitalize">{v}</span>} />
              <Line type="monotone" dataKey="leads" stroke="#1B1F2B" strokeWidth={2.5} dot={{ r: 4, fill: '#1B1F2B' }} name="Leads" />
              <Line type="monotone" dataKey="emails" stroke="#1FB2A6" strokeWidth={2.5} dot={{ r: 4, fill: '#1FB2A6' }} name="Emails" />
              <Line type="monotone" dataKey="whatsapp" stroke="#C98A1E" strokeWidth={2.5} dot={{ r: 4, fill: '#C98A1E' }} name="WhatsApp" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Row 4: Outreach + AI */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Outreach Performance" subtitle="Email and WhatsApp statistics" accentColor="#C23B2E">
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

        <ChartCard title="AI Lead Intelligence" subtitle="AI-powered scoring and qualification" accentColor="#C98A1E">
          {!aiBreakdown || (aiBreakdown.topLeads.length === 0 && aiBreakdown.qualBreakdown.length === 0) ? (
            <div className="flex flex-col items-center justify-center h-56 gap-3 text-center">
              <div className="h-14 w-14 flex items-center justify-center" style={{ background: 'rgba(31,178,166,0.08)', borderRadius: 4, border: '1px solid rgba(31,178,166,0.2)' }}>
                <Brain className="h-6 w-6" style={{ color: '#6E7D79' }} />
              </div>
              <div>
                <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, fontWeight: 600, textTransform: 'uppercase', color: '#1B1F2B' }}>No AI data yet</p>
                <p style={{ fontSize: 12, color: '#6E7D79', marginTop: 2 }}>Open a lead and run AI analysis to see scores here</p>
              </div>
              <button
                onClick={() => navigate('/leads')}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 h-8 transition-colors"
                style={{ background: 'rgba(31,178,166,0.08)', border: '1px solid rgba(31,178,166,0.25)', borderRadius: 4, color: '#1FB2A6', cursor: 'pointer' }}
              >
                <ExternalLink className="h-3 w-3" /> Go to Leads
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className="h-16 w-16 rounded-xl flex flex-col items-center justify-center shrink-0"
                  style={{ background: 'rgba(31,178,166,0.08)', border: '1px solid rgba(31,178,166,0.2)', borderRadius: 4 }}
                >
                  <p className="text-xl font-bold" style={{ color: '#1FB2A6' }}>{aiBreakdown.avgScore}</p>
                  <p className="text-[10px] text-muted-foreground">avg score</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {aiBreakdown.qualBreakdown.map((q) => {
                    const cfg = QUAL_CONFIG[q._id];
                    if (!cfg) return null;
                    return (
                      <div key={q._id} className="flex flex-col items-center px-3 py-2" style={{ background: cfg.bg, borderRadius: 4 }}>
                        <span className="text-base">{cfg.emoji}</span>
                        <span className="text-lg font-bold" style={{ color: cfg.text }}>{q.count}</span>
                        <span className="text-[10px] capitalize" style={{ color: cfg.text }}>{q._id}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {aiBreakdown.topLeads.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6E7D79' }}>🔥 Hottest Leads</p>
                    <button
                      onClick={() => navigate('/leads')}
                      className="flex items-center gap-1 text-xs font-semibold transition-colors"
                      style={{ color: '#189187', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5 }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#1B1F2B'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#189187'; }}
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
                          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(154,198,232,0.06)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                        >
                          <div
                            className="h-8 w-8 shrink-0 flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: '#1FB2A6', borderRadius: 4 }}
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
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 shrink-0" style={{ borderRadius: 10, background: cfg.bg, color: cfg.text }}>
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

      {/* Row 5: Email Open & Click Tracking */}
      <ChartCard title="Email Open & Click Tracking" subtitle="How recipients engage with your emails" accentColor="#1FB2A6">
        {!emailTracking || emailTracking.totalSent === 0 ? (
          <EmptyChart message="No tracked emails yet" hint="Send emails to start seeing open and click rates" />
        ) : (
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { label: 'Open Rate',     value: `${emailTracking.openRate}%`,        sub: `${emailTracking.totalOpened} of ${emailTracking.totalSent} opened`,     icon: Eye,             color: '#1FB2A6', bg: 'rgba(31,178,166,0.08)', border: 'rgba(31,178,166,0.2)' },
              { label: 'Click Rate',    value: `${emailTracking.clickRate}%`,        sub: `${emailTracking.totalClicked} of ${emailTracking.totalSent} clicked`,    icon: MousePointerClick, color: '#C98A1E', bg: 'rgba(201,138,30,0.08)', border: 'rgba(201,138,30,0.2)' },
              { label: 'Click-to-Open', value: `${emailTracking.clickToOpenRate}%`, sub: `${emailTracking.totalClicked} of ${emailTracking.totalOpened} who opened`, icon: TrendingUp,      color: '#3E8E5A', bg: 'rgba(62,142,90,0.08)',  border: 'rgba(62,142,90,0.2)'  },
            ].map(({ label, value, sub, icon: Icon, color, bg, border }) => (
              <div key={label} className="p-4 flex flex-col gap-3" style={{ background: bg, border: `1px solid ${border}`, borderRadius: 4 }}>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 flex items-center justify-center" style={{ background: color + '20', borderRadius: 4 }}>
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6E7D79' }}>{label}</span>
                </div>
                <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: 28, fontWeight: 700, color }}>{value}</p>
                <div className="h-2 w-full overflow-hidden" style={{ background: '#CBD3CF', borderRadius: 4 }}>
                  <div className="h-full transition-all duration-700" style={{ width: value, background: color, borderRadius: 4 }} />
                </div>
                <p style={{ fontSize: 11, color: '#6E7D79' }}>{sub}</p>
              </div>
            ))}
          </div>
        )}
      </ChartCard>
    </div>
  );
}

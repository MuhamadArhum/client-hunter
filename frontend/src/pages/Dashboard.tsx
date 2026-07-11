import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, TrendingUp, FileText, Mail, ArrowUpRight,
  Plus, Sparkles, BarChart3, ArrowRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/services/api';
import { cn } from '@/lib/utils';

interface StatusBreakdown { _id: string; count: number; }
interface Lead { _id: string; companyName: string; contactName: string; email: string; status: string; source: string; }
interface OutreachItem { _id: string; leadId?: { companyName?: string }; type: string; status: string; subject?: string; createdAt: string; }
interface DashboardData {
  totalLeads: number; conversionRate: number; sentProposals: number; totalEmails: number;
  statusBreakdown: StatusBreakdown[]; recentLeads: Lead[]; recentOutreach: OutreachItem[];
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  new:           { bg: 'bg-sky-50 dark:bg-sky-950/40',     text: 'text-sky-700 dark:text-sky-300',     dot: 'bg-sky-400' },
  contacted:     { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-400' },
  proposal_sent: { bg: 'bg-violet-50 dark:bg-violet-950/40',text:'text-violet-700 dark:text-violet-300',dot:'bg-violet-400'},
  follow_up:     { bg: 'bg-indigo-50 dark:bg-indigo-950/40',text:'text-indigo-700 dark:text-indigo-300',dot:'bg-indigo-400'},
  converted:     { bg: 'bg-emerald-50 dark:bg-emerald-950/40',text:'text-emerald-700 dark:text-emerald-300',dot:'bg-emerald-400'},
  lost:          { bg: 'bg-rose-50 dark:bg-rose-950/40',   text: 'text-rose-700 dark:text-rose-300',   dot: 'bg-rose-400' },
};

const CHART_COLORS: Record<string, string> = {
  new: '#21F6A8', contacted: '#F59E0B', proposal_sent: '#8B5CF6',
  follow_up: '#6366F1', converted: '#10B981', lost: '#F43F5E',
};

const STAT_CARDS = [
  {
    icon: Users, label: 'Total Leads', key: 'totalLeads' as const,
    color: '#0D9C6A', bgColor: 'rgba(33,246,168,0.08)', borderColor: 'rgba(33,246,168,0.2)',
    numClass: 'stat-number-green', trend: '+12%',
  },
  {
    icon: TrendingUp, label: 'Conversion Rate', key: 'conversionRate' as const, suffix: '%',
    color: '#059669', bgColor: 'rgba(5,150,105,0.08)', borderColor: 'rgba(5,150,105,0.15)',
    numClass: 'stat-number-emerald', trend: '+4%',
  },
  {
    icon: FileText, label: 'Proposals Sent', key: 'sentProposals' as const,
    color: '#7C3AED', bgColor: 'rgba(124,58,237,0.08)', borderColor: 'rgba(124,58,237,0.15)',
    numClass: 'stat-number-violet', trend: '+8%',
  },
  {
    icon: Mail, label: 'Emails Sent', key: 'totalEmails' as const,
    color: '#4F46E5', bgColor: 'rgba(79,70,229,0.08)', borderColor: 'rgba(79,70,229,0.15)',
    numClass: 'stat-number-indigo', trend: '+16%',
  },
];

function StatCard({ card, value }: { card: typeof STAT_CARDS[0]; value: string | number }) {
  return (
    <div
      className="relative rounded-xl p-5 overflow-hidden cursor-default group transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: card.bgColor,
        border: `1px solid ${card.borderColor}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 20px ${card.bgColor.replace('0.08', '0.25')}, 0 8px 32px rgba(0,0,0,0.08)`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: card.color }} />

      <div className="flex items-start justify-between mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: card.color }}>
          <card.icon className="h-4.5 w-4.5 text-white" />
        </div>
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
          {card.trend}
        </span>
      </div>

      <p className={cn('text-3xl font-black tracking-tight leading-none mb-1.5', card.numClass)}>
        {value}
      </p>
      <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border p-5">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-4 w-28" />
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-card-hover">
        <p className="text-xs text-muted-foreground capitalize mb-0.5">{label?.replace(/_/g, ' ')}</p>
        <p className="text-sm font-bold text-foreground">{payload[0].value} leads</p>
      </div>
    );
  }
  return null;
};

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
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card><CardContent className="p-5"><Skeleton className="h-60 w-full rounded-lg" /></CardContent></Card>
          <Card><CardContent className="p-5"><Skeleton className="h-60 w-full rounded-lg" /></CardContent></Card>
        </div>
      </div>
    );
  }

  const chartData = (Array.isArray(data?.statusBreakdown) ? data.statusBreakdown : []).map((s) => ({
    name: s._id, label: s._id.replace(/_/g, ' '), count: s.count,
  }));

  return (
    <div className="space-y-5 p-5">

      {/* ── Hero banner ── */}
      <div className="page-header">
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: '#0D9C6A' }}>
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#0D9C6A' }}>
                AI-Powered Pipeline
              </span>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-1">
              {greeting} 👋
            </h2>
            <p className="text-sm text-muted-foreground">
              Here's your client acquisition overview for today.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-lg text-sm font-medium gap-2"
              onClick={() => navigate('/analytics')}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics
            </Button>
            <Button
              size="sm"
              className="h-9 rounded-lg text-sm font-semibold text-gray-900 gap-2"
              style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}
              onClick={() => navigate('/leads')}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Lead
            </Button>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((card) => {
          const raw = data?.[card.key] ?? 0;
          const val = 'suffix' in card ? `${raw}${card.suffix}` : raw;
          return <StatCard key={card.key} card={card} value={val} />;
        })}
      </div>

      {/* ── Charts row ── */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* Pipeline chart */}
        <Card className="border-border shadow-sm overflow-hidden">
          <CardHeader className="pb-2 pt-5 px-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">Leads Pipeline</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Distribution across all stages</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs rounded-lg gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/analytics')}
              >
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-2">
            {chartData.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center gap-3 text-center">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                  <BarChart3 className="h-4.5 w-4.5 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">No pipeline data yet</p>
                <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" onClick={() => navigate('/leads')}>
                  Add your first lead
                </Button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.6} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false} tickLine={false} allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.5)', radius: 6 }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={CHART_COLORS[entry.name] || '#21F6A8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card className="border-border shadow-sm overflow-hidden">
          <CardHeader className="pb-2 pt-5 px-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">Recent Leads</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Latest additions to your pipeline</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs rounded-lg gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/leads')}
              >
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-2">
            {(Array.isArray(data?.recentLeads) ? data.recentLeads : []).length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center gap-3 text-center">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                  <Users className="h-4.5 w-4.5 text-muted-foreground/50" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">No leads yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Add or scrape your first lead</p>
                </div>
              </div>
            ) : (
              <ul className="space-y-1">
                {(Array.isArray(data?.recentLeads) ? data.recentLeads : []).slice(0, 6).map((lead) => {
                  const style = STATUS_STYLES[lead.status] || STATUS_STYLES.new;
                  const initials = lead.companyName?.slice(0, 2).toUpperCase() || '??';
                  return (
                    <li
                      key={lead._id}
                      className="flex items-center gap-3 rounded-lg px-2.5 py-2 cursor-pointer transition-all duration-150 hover:bg-muted/60 group"
                      onClick={() => navigate(`/leads/${lead._id}`)}
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-gray-900"
                        style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                          {lead.companyName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{lead.contactName || lead.email || '—'}</p>
                      </div>
                      <span className={cn('inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap', style.bg, style.text)}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
                        {lead.status?.replace(/_/g, ' ')}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Outreach ── */}
      <Card className="border-border shadow-sm overflow-hidden">
        <CardHeader className="pb-2 pt-5 px-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">Recent Outreach</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Latest emails and messages sent</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs rounded-lg gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => navigate('/outreach')}
            >
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-2">
          {(Array.isArray(data?.recentOutreach) ? data.recentOutreach : []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                <Mail className="h-4.5 w-4.5 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">No outreach sent yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left py-2.5 pr-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Company</th>
                    <th className="text-left py-2.5 pr-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                    <th className="text-left py-2.5 pr-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Subject</th>
                    <th className="text-left py-2.5 pr-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-left py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {(Array.isArray(data?.recentOutreach) ? data.recentOutreach : []).map((item) => (
                    <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4 font-medium text-sm">{item.leadId?.companyName || '—'}</td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {item.type === 'email' ? '✉️' : '💬'} {item.type}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-sm text-muted-foreground hidden md:table-cell max-w-[200px]">
                        <span className="truncate block">{item.subject || '—'}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full',
                          item.status === 'sent'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
                        )}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', item.status === 'sent' ? 'bg-emerald-400' : 'bg-rose-400')} />
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Quick action cards ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: Users, label: 'Manage Leads', desc: 'View and qualify your pipeline', path: '/leads',
            iconBg: 'rgba(33,246,168,0.1)', iconColor: '#0D9C6A',
          },
          {
            icon: FileText, label: 'Generate Proposal', desc: 'Create AI-powered proposals', path: '/proposals',
            iconBg: '#F5F3FF', iconColor: '#7C3AED',
          },
          {
            icon: TrendingUp, label: 'View Analytics', desc: 'Track your performance metrics', path: '/analytics',
            iconBg: '#ECFDF5', iconColor: '#059669',
          },
        ].map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all duration-150 hover:shadow-sm hover:-translate-y-0.5 hover:border-emerald-200 dark:hover:border-emerald-900"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: action.iconBg }}
            >
              <action.icon className="h-4.5 w-4.5" style={{ color: action.iconColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{action.label}</p>
              <p className="text-xs text-muted-foreground">{action.desc}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, FileText, Mail, ArrowUpRight, Plus, Sparkles, ExternalLink, BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  new:           { bg: 'bg-cyan-50 dark:bg-cyan-950/40',    text: 'text-cyan-700 dark:text-cyan-300',    dot: 'bg-cyan-400' },
  contacted:     { bg: 'bg-amber-50 dark:bg-amber-950/40',  text: 'text-amber-700 dark:text-amber-300',  dot: 'bg-amber-400' },
  proposal_sent: { bg: 'bg-violet-50 dark:bg-violet-950/40',text: 'text-violet-700 dark:text-violet-300',dot: 'bg-violet-400' },
  follow_up:     { bg: 'bg-indigo-50 dark:bg-indigo-950/40',text: 'text-indigo-700 dark:text-indigo-300',dot: 'bg-indigo-400' },
  converted:     { bg: 'bg-emerald-50 dark:bg-emerald-950/40',text: 'text-emerald-700 dark:text-emerald-300',dot: 'bg-emerald-400' },
  lost:          { bg: 'bg-rose-50 dark:bg-rose-950/40',    text: 'text-rose-700 dark:text-rose-300',    dot: 'bg-rose-400' },
};

const CHART_COLORS: Record<string, string> = {
  new: '#1DD2D7', contacted: '#f59e0b', proposal_sent: '#9F8DD4',
  follow_up: '#6366f1', converted: '#10b981', lost: '#f43f5e',
};

const STAT_CARDS = [
  {
    icon: Users, label: 'Total Leads', key: 'totalLeads' as const,
    gradient: 'linear-gradient(135deg, #1DD2D7, #06b6d4)',
    bgColor: 'rgba(29,210,215,0.08)', borderColor: 'rgba(29,210,215,0.18)',
    glowColor: 'rgba(29,210,215,0.15)', numClass: 'stat-number-teal',
  },
  {
    icon: TrendingUp, label: 'Conversion Rate', key: 'conversionRate' as const, suffix: '%',
    gradient: 'linear-gradient(135deg, #10b981, #34d399)',
    bgColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.18)',
    glowColor: 'rgba(16,185,129,0.15)', numClass: 'stat-number-emerald',
  },
  {
    icon: FileText, label: 'Proposals Sent', key: 'sentProposals' as const,
    gradient: 'linear-gradient(135deg, #9F8DD4, #c084fc)',
    bgColor: 'rgba(159,141,212,0.08)', borderColor: 'rgba(159,141,212,0.18)',
    glowColor: 'rgba(159,141,212,0.15)', numClass: 'stat-number-purple',
  },
  {
    icon: Mail, label: 'Emails Sent', key: 'totalEmails' as const,
    gradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
    bgColor: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.18)',
    glowColor: 'rgba(99,102,241,0.15)', numClass: 'stat-number-indigo',
  },
];

function StatCard({ card, value }: { card: typeof STAT_CARDS[0]; value: string | number }) {
  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden cursor-default group transition-all duration-300 hover:-translate-y-1"
      style={{
        background: card.bgColor,
        border: `1px solid ${card.borderColor}`,
        boxShadow: `0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 20px ${card.glowColor}, 0 8px 40px rgba(0,0,0,0.1)`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)`;
      }}
    >
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: card.gradient }} />

      {/* Background glow blob */}
      <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full opacity-30 blur-2xl transition-opacity group-hover:opacity-60"
           style={{ background: card.gradient }} />

      <div className="flex items-start justify-between mb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
             style={{ background: card.gradient, boxShadow: `0 4px 14px ${card.glowColor}` }}>
          <card.icon className="h-5 w-5 text-white" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 transition-all group-hover:text-muted-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>

      <p className={cn('text-4xl font-black tracking-tight mb-0.5', card.numClass)}>
        {value}
      </p>
      <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 p-5">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <Skeleton className="h-9 w-20 mb-2" />
      <Skeleton className="h-4 w-28" />
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl border border-border/60 bg-popover px-3 py-2 shadow-card">
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
      <div className="space-y-6 p-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border border-border/60"><CardContent className="p-6"><Skeleton className="h-64 w-full rounded-lg" /></CardContent></Card>
          <Card className="border border-border/60"><CardContent className="p-6"><Skeleton className="h-64 w-full rounded-lg" /></CardContent></Card>
        </div>
      </div>
    );
  }

  const chartData = (Array.isArray(data?.statusBreakdown) ? data.statusBreakdown : []).map((s) => ({
    name: s._id, label: s._id.replace(/_/g, ' '), count: s.count,
  }));

  return (
    <div className="space-y-6 p-6">

      {/* ── Hero header ── */}
      <div className="page-header">
        <div className="absolute inset-0 opacity-40 rounded-2xl"
             style={{ backgroundImage: 'radial-gradient(rgba(29,210,215,0.08) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary/70">AI-Powered Pipeline</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-gradient mb-1">
              {greeting} 👋
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Here's what's happening with your pipeline today.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => navigate('/leads')}
              className="h-9 rounded-xl text-xs font-semibold text-white gap-1.5 shadow-glow-teal"
              style={{ background: 'linear-gradient(135deg, #1DD2D7, #13a8b0)' }}
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
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline chart */}
        <Card className="border border-border/50 shadow-card overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5"
               style={{ background: 'linear-gradient(90deg, #1DD2D7, #9F8DD4)' }} />
          <CardHeader className="pb-2 pt-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Leads Pipeline</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Distribution across all stages</p>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs rounded-lg" onClick={() => navigate('/analytics')}>
                View all <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {chartData.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center gap-2">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No pipeline data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.4)', radius: 6 }} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={44}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={CHART_COLORS[entry.name] || '#1DD2D7'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent leads */}
        <Card className="border border-border/50 shadow-card overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5"
               style={{ background: 'linear-gradient(90deg, #9F8DD4, #1DD2D7)' }} />
          <CardHeader className="pb-2 pt-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Recent Leads</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Latest additions to your pipeline</p>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs rounded-lg" onClick={() => navigate('/leads')}>
                View all <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {(Array.isArray(data?.recentLeads) ? data.recentLeads : []).length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center gap-2 text-center">
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center"
                     style={{ background: 'linear-gradient(135deg, rgba(29,210,215,0.1), rgba(159,141,212,0.1))' }}>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No leads yet</p>
                <p className="text-xs text-muted-foreground/60">Add or scrape your first lead</p>
              </div>
            ) : (
              <ul className="space-y-1">
                {(Array.isArray(data?.recentLeads) ? data.recentLeads : []).map((lead) => {
                  const style = STATUS_STYLES[lead.status] || STATUS_STYLES.new;
                  const initials = lead.companyName?.slice(0, 2).toUpperCase() || '??';
                  return (
                    <li
                      key={lead._id}
                      className="flex items-center gap-3 rounded-xl p-2.5 cursor-pointer transition-all duration-150 hover:bg-muted/60 group"
                      onClick={() => navigate(`/leads/${lead._id}`)}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                           style={{ background: 'linear-gradient(135deg, #1DD2D7, #9F8DD4)' }}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                          {lead.companyName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{lead.contactName || lead.email || '—'}</p>
                      </div>
                      <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full', style.bg, style.text)}>
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
      <Card className="border border-border/50 shadow-card overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-0.5"
             style={{ background: 'linear-gradient(90deg, #6366f1, #9F8DD4, #1DD2D7)' }} />
        <CardHeader className="pb-2 pt-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Recent Outreach</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Latest emails and messages sent</p>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs rounded-lg" onClick={() => navigate('/outreach')}>
              View all <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Company</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(data?.recentOutreach) ? data.recentOutreach : []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center"
                           style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(159,141,212,0.1))' }}>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">No outreach yet</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                (Array.isArray(data?.recentOutreach) ? data.recentOutreach : []).map((item) => (
                  <TableRow key={item._id} className="border-border/30 hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold text-sm">{item.leadId?.companyName || '—'}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                        {item.type === 'email' ? '✉️' : '💬'} {item.type}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{item.subject || '—'}</TableCell>
                    <TableCell>
                      <span className={cn(
                        'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
                        item.status === 'sent'
                          ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
                      )}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', item.status === 'sent' ? 'bg-cyan-400' : 'bg-rose-400')} />
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

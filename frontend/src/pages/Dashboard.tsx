import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, FileText, Mail, ArrowUpRight } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/services/api';
import { cn } from '@/lib/utils';

interface StatusBreakdown {
  _id: string;
  count: number;
}

interface Lead {
  _id: string;
  companyName: string;
  contactName: string;
  email: string;
  status: string;
  source: string;
}

interface OutreachItem {
  _id: string;
  leadId?: { companyName?: string };
  type: string;
  status: string;
  subject?: string;
  createdAt: string;
}

interface DashboardData {
  totalLeads: number;
  conversionRate: number;
  sentProposals: number;
  totalEmails: number;
  statusBreakdown: StatusBreakdown[];
  recentLeads: Lead[];
  recentOutreach: OutreachItem[];
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  new:           { bg: 'bg-cyan-50',    text: 'text-cyan-700',    dot: 'bg-cyan-400' },
  contacted:     { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400' },
  proposal_sent: { bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-400' },
  follow_up:     { bg: 'bg-indigo-50',  text: 'text-indigo-700',  dot: 'bg-indigo-400' },
  converted:     { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  lost:          { bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-400' },
};

const CHART_COLORS: Record<string, string> = {
  new: '#1DD2D7',
  contacted: '#f59e0b',
  proposal_sent: '#9F8DD4',
  follow_up: '#6366f1',
  converted: '#10b981',
  lost: '#f43f5e',
};

function StatCard({
  icon: Icon,
  label,
  value,
  topGradient,
  iconBg,
  iconColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  topGradient: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card className="relative overflow-hidden border border-border/60 shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${topGradient}`} />
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', iconBg)}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground/40" />
        </div>
        <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-1 font-medium">{label}</p>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="border border-border/60 shadow-card">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-4 w-4 rounded" />
        </div>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-4 w-28" />
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-border/60 rounded-xl shadow-card px-3 py-2">
        <p className="text-xs text-muted-foreground capitalize">{label?.replace('_', ' ')}</p>
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
    api
      .get('/analytics/dashboard')
      .then((res) => setData(res.data?.data || res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <Skeleton className="h-7 w-36 mb-1.5" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border border-border/60 shadow-card">
            <CardContent className="p-6"><Skeleton className="h-64 w-full rounded-lg" /></CardContent>
          </Card>
          <Card className="border border-border/60 shadow-card">
            <CardContent className="p-6"><Skeleton className="h-64 w-full rounded-lg" /></CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const chartData = (Array.isArray(data?.statusBreakdown) ? data.statusBreakdown : []).map((s) => ({
    name: s._id,
    label: s._id.replace(/_/g, ' '),
    count: s.count,
  }));

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Good morning 👋</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Here's what's happening with your pipeline today.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Leads"
          value={data?.totalLeads ?? 0}
          topGradient="bg-gradient-to-r from-cyan-400 to-teal-400"
          iconBg="bg-cyan-50"
          iconColor="text-cyan-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Conversion Rate"
          value={`${data?.conversionRate ?? 0}%`}
          topGradient="bg-gradient-to-r from-emerald-400 to-green-400"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
        />
        <StatCard
          icon={FileText}
          label="Proposals Sent"
          value={data?.sentProposals ?? 0}
          topGradient="bg-gradient-to-r from-violet-400 to-purple-400"
          iconBg="bg-violet-50"
          iconColor="text-violet-500"
        />
        <StatCard
          icon={Mail}
          label="Emails Sent"
          value={data?.totalEmails ?? 0}
          topGradient="bg-gradient-to-r from-indigo-400 to-blue-400"
          iconBg="bg-indigo-50"
          iconColor="text-indigo-500"
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-border/60 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Leads Pipeline</CardTitle>
            <p className="text-xs text-muted-foreground">Distribution across all stages</p>
          </CardHeader>
          <CardContent className="pt-0">
            {chartData.length === 0 ? (
              <div className="h-56 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.5)', radius: 6 }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={CHART_COLORS[entry.name] || '#1DD2D7'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Recent Leads</CardTitle>
            <p className="text-xs text-muted-foreground">Latest additions to your pipeline</p>
          </CardHeader>
          <CardContent className="pt-0">
            {(Array.isArray(data?.recentLeads) ? data.recentLeads : []).length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center gap-2 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No leads yet</p>
                <p className="text-xs text-muted-foreground/60">Scrape or add your first lead</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {(Array.isArray(data?.recentLeads) ? data.recentLeads : []).map((lead) => {
                  const style = STATUS_STYLES[lead.status] || STATUS_STYLES.new;
                  const initials = lead.companyName?.slice(0, 2).toUpperCase() || '??';
                  return (
                    <li
                      key={lead._id}
                      className="flex items-center gap-3 rounded-xl p-3 cursor-pointer transition-all duration-150 hover:bg-muted/60 group"
                      onClick={() => navigate(`/leads/${lead._id}`)}
                    >
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #1DD2D7, #9F8DD4)' }}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                          {lead.companyName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{lead.contactName || lead.email || '—'}</p>
                      </div>
                      <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full', style.bg, style.text)}>
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

      {/* Recent Outreach */}
      <Card className="border border-border/60 shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Recent Outreach</CardTitle>
          <p className="text-xs text-muted-foreground">Latest emails and messages sent</p>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/60">
                <TableHead className="text-xs font-semibold text-muted-foreground">Company</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Type</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Subject</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(data?.recentOutreach) ? data.recentOutreach : []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm">No outreach yet</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                (Array.isArray(data?.recentOutreach) ? data.recentOutreach : []).map((item) => (
                  <TableRow key={item._id} className="border-border/40 hover:bg-muted/30">
                    <TableCell className="font-medium text-sm">
                      {item.leadId?.companyName || '—'}
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-sm text-muted-foreground">{item.type}</span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {item.subject || '—'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full',
                          item.status === 'sent'
                            ? 'bg-cyan-50 text-cyan-700'
                            : 'bg-rose-50 text-rose-700',
                        )}
                      >
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

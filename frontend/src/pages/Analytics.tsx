import { useEffect, useState } from 'react';
import { Users, TrendingUp, FileText, Mail, Flame, Target, Brain } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import api from '@/services/api';
import { cn } from '@/lib/utils';

const PIE_COLORS = ['#1DD2D7', '#9F8DD4', '#3F4D67', '#1DD7CE', '#f59e0b', '#6366f1'];

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

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className={cn('rounded-full p-3', color)}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CardSkeleton() {
  return <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>;
}

const QUAL_EMOJI: Record<string, string> = { hot: '🔥', warm: '🟡', cold: '🔵' };
const QUAL_COLOR: Record<string, string> = {
  hot: 'bg-rose-100 text-rose-700',
  warm: 'bg-amber-100 text-amber-700',
  cold: 'bg-sky-100 text-sky-700',
};

export default function Analytics() {
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
    name: s._id.replace('_', ' '),
    count: s.count,
  }));

  const sourceChartData = sourceData.map(s => ({ name: s._id, value: s.count }));

  const outreachChartData = outreachStats ? [
    { name: 'Email Sent', count: outreachStats.emailSent },
    { name: 'Email Failed', count: outreachStats.emailFailed },
    { name: 'WA Sent', count: outreachStats.whatsappSent },
    { name: 'WA Failed', count: outreachStats.whatsappFailed },
  ] : [];

  const proposalChartData = proposalStats ? [
    { name: 'Accepted', count: proposalStats.accepted },
    { name: 'Sent', count: proposalStats.sent },
    { name: 'Rejected', count: proposalStats.rejected },
    { name: 'Draft', count: proposalStats.draft },
  ] : [];

  const conversionChartData = conversionBySource.map(c => ({
    name: c.source,
    rate: c.conversionRate,
    total: c.total,
  }));

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="flex items-center gap-4 p-6">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-16" /></div>
            </CardContent></Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Leads" value={dashboard?.totalLeads ?? 0} color="bg-cyan-100 text-cyan-600" />
        <StatCard icon={TrendingUp} label="Conversion Rate" value={`${dashboard?.conversionRate ?? 0}%`} color="bg-emerald-100 text-emerald-600" />
        <StatCard icon={FileText} label="Proposals Sent" value={dashboard?.sentProposals ?? 0} color="bg-violet-100 text-violet-600" />
        <StatCard icon={Mail} label="Emails Sent" value={dashboard?.totalEmails ?? 0} color="bg-indigo-100 text-indigo-600" />
      </div>

      {/* Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leads by Source */}
        <Card>
          <CardHeader><CardTitle>Leads by Source</CardTitle></CardHeader>
          <CardContent>
            {sourceChartData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={sourceChartData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {sourceChartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Leads by Status */}
        <Card>
          <CardHeader><CardTitle>Leads by Status</CardTitle></CardHeader>
          <CardContent>
            {statusChartData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={statusChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1DD2D7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Conversion Rate by Source */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Conversion Rate by Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            {conversionChartData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No data</div>
            ) : (
              <div className="space-y-3">
                {conversionChartData.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize font-medium">{item.name}</span>
                      <span className="text-muted-foreground">{item.rate}% ({item.total} leads)</span>
                    </div>
                    <Progress value={item.rate} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Proposal Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Proposal Acceptance Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!proposalStats ? (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">No data</div>
            ) : (
              <>
                <div className="text-center py-2">
                  <p className="text-4xl font-bold text-primary">{proposalStats.acceptanceRate}%</p>
                  <p className="text-sm text-muted-foreground mt-1">Acceptance Rate</p>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={proposalChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#9F8DD4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Outreach Performance */}
        <Card>
          <CardHeader><CardTitle>Outreach Performance</CardTitle></CardHeader>
          <CardContent>
            {outreachChartData.every(d => d.count === 0) ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No outreach yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={outreachChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#9F8DD4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* AI Lead Intelligence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              AI Lead Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!aiBreakdown ? (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">No AI data yet — add leads to begin</div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{aiBreakdown.avgScore}</p>
                    <p className="text-xs text-muted-foreground">Avg Score</p>
                  </div>
                  <div className="flex gap-2">
                    {aiBreakdown.qualBreakdown.map(q => (
                      <div key={q._id} className="text-center">
                        <Badge className={cn('text-xs', QUAL_COLOR[q._id] || '')}>{QUAL_EMOJI[q._id]} {q._id}</Badge>
                        <p className="text-lg font-bold mt-1">{q.count}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">🔥 Hottest Leads</p>
                  <div className="space-y-2">
                    {aiBreakdown.topLeads.map(lead => (
                      <div key={lead._id} className="flex items-center justify-between rounded-md border p-2">
                        <div>
                          <p className="text-sm font-medium">{lead.companyName}</p>
                          <p className="text-xs text-muted-foreground">{lead.aiRecommendedService}</p>
                        </div>
                        <Badge className={cn('text-xs', QUAL_COLOR[lead.aiQualification] || '')}>
                          {QUAL_EMOJI[lead.aiQualification]} {lead.aiScore}/10
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, FileText, Mail } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-cyan-100 text-cyan-700',
  contacted: 'bg-amber-100 text-amber-700',
  proposal_sent: 'bg-violet-100 text-violet-700',
  follow_up: 'bg-indigo-100 text-indigo-700',
  converted: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-rose-100 text-rose-700',
};

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
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

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

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
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
          <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  const chartData = (Array.isArray(data?.statusBreakdown) ? data.statusBreakdown : []).map((s) => ({
    name: s._id.replace('_', ' '),
    count: s.count,
  }));

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Leads"
          value={data?.totalLeads ?? 0}
          color="bg-cyan-100 text-cyan-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Conversion Rate"
          value={`${data?.conversionRate ?? 0}%`}
          color="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          icon={FileText}
          label="Proposals Sent"
          value={data?.sentProposals ?? 0}
          color="bg-violet-100 text-violet-600"
        />
        <StatCard
          icon={Mail}
          label="Emails Sent"
          value={data?.totalEmails ?? 0}
          color="bg-indigo-100 text-indigo-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leads Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1DD2D7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {(Array.isArray(data?.recentLeads) ? data.recentLeads : []).length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No leads yet.</p>
            ) : (
              <ul className="space-y-3">
                {(Array.isArray(data?.recentLeads) ? data.recentLeads : []).map((lead) => (
                  <li
                    key={lead._id}
                    className="flex items-center justify-between rounded-md border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/leads/${lead._id}`)}
                  >
                    <div>
                      <p className="font-medium text-sm">{lead.companyName}</p>
                      <p className="text-xs text-muted-foreground">{lead.contactName} · {lead.email}</p>
                    </div>
                    <Badge className={cn('text-xs', STATUS_COLORS[lead.status] || '')}>
                      {lead.status?.replace('_', ' ')}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Outreach</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(data?.recentOutreach) ? data.recentOutreach : []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No outreach yet.
                  </TableCell>
                </TableRow>
              ) : (
                (Array.isArray(data?.recentOutreach) ? data.recentOutreach : []).map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">
                      {item.leadId?.companyName || '—'}
                    </TableCell>
                    <TableCell className="capitalize">{item.type}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.subject || '—'}</TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          'text-xs',
                          item.status === 'sent'
                            ? 'bg-cyan-100 text-cyan-700'
                            : 'bg-rose-100 text-rose-700',
                        )}
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
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

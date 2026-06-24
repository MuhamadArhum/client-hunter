import { useEffect, useState } from 'react';
import { Mail, FileText, Users, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/services/api';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'outreach' | 'lead' | 'proposal';
  title: string;
  subtitle: string;
  status?: string;
  date: string;
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const STATUS_COLORS: Record<string, string> = {
  sent: 'bg-cyan-100 text-cyan-700',
  failed: 'bg-rose-100 text-rose-700',
  new: 'bg-cyan-100 text-cyan-700',
  contacted: 'bg-amber-100 text-amber-700',
  proposal_sent: 'bg-violet-100 text-violet-700',
  follow_up: 'bg-indigo-100 text-indigo-700',
  converted: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-rose-100 text-rose-700',
  draft: 'bg-slate-100 text-slate-600',
  accepted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};

const TYPE_ICONS = {
  outreach: Mail,
  lead: Users,
  proposal: FileText,
};

const TYPE_COLORS = {
  outreach: 'bg-cyan-100 text-cyan-600',
  lead: 'bg-violet-100 text-violet-600',
  proposal: 'bg-indigo-100 text-indigo-600',
};

export default function Notifications() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/outreach', { params: { limit: 20 } }),
      api.get('/leads', { params: { limit: 10, sortBy: 'createdAt', sortOrder: 'desc' } }),
      api.get('/proposals', { params: { limit: 10 } }),
    ])
      .then(([outreachRes, leadsRes, proposalsRes]) => {
        const outreachItems: ActivityItem[] = (Array.isArray(outreachRes.data?.data) ? outreachRes.data.data : []).map(
          (o: {
            _id: string;
            type?: string;
            subject?: string;
            leadId?: { companyName?: string };
            status?: string;
            createdAt: string;
          }) => ({
            id: `outreach-${o._id}`,
            type: 'outreach' as const,
            title: `${o.type === 'email' ? 'Email' : 'WhatsApp'} sent`,
            subtitle: `To: ${o.leadId?.companyName || 'Unknown'}${o.subject ? ` · ${o.subject}` : ''}`,
            status: o.status,
            date: o.createdAt,
          }),
        );

        const leadItems: ActivityItem[] = (Array.isArray(leadsRes.data?.data) ? leadsRes.data.data : []).map(
          (l: {
            _id: string;
            companyName?: string;
            status?: string;
            source?: string;
            createdAt: string;
          }) => ({
            id: `lead-${l._id}`,
            type: 'lead' as const,
            title: `Lead added: ${l.companyName || 'Unknown'}`,
            subtitle: `Source: ${l.source || '—'} · Status: ${l.status?.replace('_', ' ') || '—'}`,
            status: l.status,
            date: l.createdAt,
          }),
        );

        const proposalItems: ActivityItem[] = (Array.isArray(proposalsRes.data?.data) ? proposalsRes.data.data : []).map(
          (p: {
            _id: string;
            title?: string;
            leadId?: { companyName?: string } | string;
            status?: string;
            createdAt: string;
          }) => {
            const company =
              typeof p.leadId === 'object' && p.leadId !== null
                ? p.leadId.companyName || '—'
                : '—';
            return {
              id: `proposal-${p._id}`,
              type: 'proposal' as const,
              title: p.title || `Proposal generated`,
              subtitle: `For: ${company}`,
              status: p.status,
              date: p.createdAt,
            };
          },
        );

        const combined = [...outreachItems, ...leadItems, ...proposalItems].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        setItems(combined);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Notifications</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
              <h2 className="text-lg font-semibold">No activity yet</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your activity will appear here once you start using the app.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => {
                const Icon = TYPE_ICONS[item.type];
                return (
                  <li key={item.id} className="flex items-start gap-3">
                    <div className={cn('rounded-full p-2 shrink-0 mt-0.5', TYPE_COLORS[item.type])}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <p className="text-sm font-medium">{item.title}</p>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {getRelativeTime(item.date)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
                      {item.status && (
                        <Badge className={cn('mt-1.5 text-xs', STATUS_COLORS[item.status] || '')}>
                          {item.status.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Mail, FileText, Users, Bell, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import api from '@/services/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSocket } from '@/hooks/useSocket';

interface ActivityItem {
  id: string;
  type: 'outreach' | 'lead' | 'proposal';
  title: string;
  subtitle: string;
  status?: string;
  date: string;
}

function getRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  sent:          { bg: 'bg-cyan-50',    text: 'text-cyan-700',    dot: 'bg-cyan-400' },
  failed:        { bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-400' },
  new:           { bg: 'bg-cyan-50',    text: 'text-cyan-700',    dot: 'bg-cyan-400' },
  contacted:     { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400' },
  proposal_sent: { bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-400' },
  follow_up:     { bg: 'bg-indigo-50',  text: 'text-indigo-700',  dot: 'bg-indigo-400' },
  converted:     { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  lost:          { bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-400' },
  draft:         { bg: 'bg-slate-100',  text: 'text-slate-600',   dot: 'bg-slate-400' },
  accepted:      { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  rejected:      { bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-400' },
};

const TYPE_CONFIG = {
  outreach: {
    Icon: Mail,
    gradient: 'linear-gradient(135deg, #1DD2D7, #1DD7CE)',
    label: 'Outreach',
  },
  lead: {
    Icon: Users,
    gradient: 'linear-gradient(135deg, #9F8DD4, #b8a8e4)',
    label: 'Lead',
  },
  proposal: {
    Icon: FileText,
    gradient: 'linear-gradient(135deg, #3F4D67, #4d5f80)',
    label: 'Proposal',
  },
};

export default function Notifications() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/outreach', { params: { limit: 20 } }),
      api.get('/leads', { params: { limit: 10, sortBy: 'createdAt', sortOrder: 'desc' } }),
      api.get('/proposals', { params: { limit: 10 } }),
    ])
      .then(([outreachRes, leadsRes, proposalsRes]) => {
        const outreachItems: ActivityItem[] = (Array.isArray(outreachRes.data?.data) ? outreachRes.data.data : []).map(
          (o: { _id: string; type?: string; subject?: string; leadId?: { companyName?: string }; status?: string; createdAt: string }) => ({
            id: `outreach-${o._id}`,
            type: 'outreach' as const,
            title: `${o.type === 'email' ? 'Email' : 'WhatsApp'} sent`,
            subtitle: `To: ${o.leadId?.companyName || 'Unknown'}${o.subject ? ` · "${o.subject}"` : ''}`,
            status: o.status,
            date: o.createdAt,
          }),
        );

        const leadItems: ActivityItem[] = (Array.isArray(leadsRes.data?.data) ? leadsRes.data.data : []).map(
          (l: { _id: string; companyName?: string; status?: string; source?: string; createdAt: string }) => ({
            id: `lead-${l._id}`,
            type: 'lead' as const,
            title: `Lead added: ${l.companyName || 'Unknown'}`,
            subtitle: `Source: ${l.source || '—'} · Status: ${l.status?.replace(/_/g, ' ') || '—'}`,
            status: l.status,
            date: l.createdAt,
          }),
        );

        const proposalItems: ActivityItem[] = (Array.isArray(proposalsRes.data?.data) ? proposalsRes.data.data : []).map(
          (p: { _id: string; title?: string; leadId?: { companyName?: string } | string; status?: string; createdAt: string }) => {
            const company = typeof p.leadId === 'object' && p.leadId !== null ? p.leadId.companyName || '—' : '—';
            return {
              id: `proposal-${p._id}`,
              type: 'proposal' as const,
              title: p.title || 'Proposal generated',
              subtitle: `For: ${company}`,
              status: p.status,
              date: p.createdAt,
            };
          },
        );

        setItems(
          [...outreachItems, ...leadItems, ...proposalItems].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          ),
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  useSocket((event, data: unknown) => {
    const d = data as Record<string, unknown>;
    setIsLive(true);
    if (event === 'lead:new') {
      toast.success(`New lead: ${d?.companyName as string}`, { duration: 4000 });
      fetchData();
    }
    if (event === 'outreach:sent') {
      toast.success('Outreach sent!', { duration: 3000 });
      fetchData();
    }
  });

  const grouped = items.reduce<Record<string, ActivityItem[]>>((acc, item) => {
    const date = new Date(item.date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key: string;
    if (date.toDateString() === today.toDateString()) key = 'Today';
    else if (date.toDateString() === yesterday.toDateString()) key = 'Yesterday';
    else key = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            {/* Live indicator */}
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className={cn(
                'h-2 w-2 rounded-full bg-emerald-500',
                isLive && 'animate-pulse',
              )} />
              Live
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{items.length} recent activities</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-xl border-border/60 gap-2 text-sm"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <div className="rounded-2xl border border-border/60 bg-white shadow-card overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2 pt-0.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, rgba(29,210,215,0.1), rgba(159,141,212,0.1))' }}
            >
              <Bell className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <h2 className="text-base font-semibold text-foreground">No activity yet</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Your activity will appear here once you start adding leads and sending outreach.
            </p>
          </div>
        ) : (
          <div>
            {Object.entries(grouped).map(([dateLabel, groupItems], groupIdx) => (
              <div key={dateLabel}>
                {/* Date separator */}
                <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: '1px solid hsl(var(--border) / 0.4)', background: 'hsl(var(--muted) / 0.3)' }}>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{dateLabel}</span>
                  <span className="text-xs text-muted-foreground/50">{groupItems.length} items</span>
                </div>

                {/* Items */}
                {groupItems.map((item, idx) => {
                  const config = TYPE_CONFIG[item.type];
                  const statusStyle = item.status ? STATUS_STYLES[item.status] : null;
                  const isLast = groupIdx === Object.keys(grouped).length - 1 && idx === groupItems.length - 1;

                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 px-5 py-4 hover:bg-muted/20 transition-colors"
                      style={{ borderBottom: isLast ? 'none' : '1px solid hsl(var(--border) / 0.3)' }}
                    >
                      {/* Icon */}
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5"
                        style={{ background: config.gradient }}
                      >
                        <config.Icon className="h-4 w-4 text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-foreground">{item.title}</p>
                          <span className="text-xs text-muted-foreground/60 shrink-0 pt-0.5">{getRelativeTime(item.date)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
                        {statusStyle && (
                          <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full mt-1.5', statusStyle.bg, statusStyle.text)}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', statusStyle.dot)} />
                            {item.status?.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Mail, FileText, Users, Bell, RefreshCw, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  sent:          { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-400' },
  failed:        { bg: 'bg-rose-50 dark:bg-rose-950/40',    text: 'text-rose-700 dark:text-rose-300',    dot: 'bg-rose-400' },
  new:           { bg: 'bg-sky-50 dark:bg-sky-950/40',      text: 'text-sky-700 dark:text-sky-300',      dot: 'bg-sky-400' },
  contacted:     { bg: 'bg-amber-50 dark:bg-amber-950/40',  text: 'text-amber-700 dark:text-amber-300',  dot: 'bg-amber-400' },
  proposal_sent: { bg: 'bg-violet-50 dark:bg-violet-950/40',text: 'text-violet-700 dark:text-violet-300',dot: 'bg-violet-400' },
  follow_up:     { bg: 'bg-indigo-50 dark:bg-indigo-950/40',text: 'text-indigo-700 dark:text-indigo-300',dot: 'bg-indigo-400' },
  converted:     { bg: 'bg-emerald-50 dark:bg-emerald-950/40',text:'text-emerald-700 dark:text-emerald-300',dot:'bg-emerald-400'},
  lost:          { bg: 'bg-rose-50 dark:bg-rose-950/40',    text: 'text-rose-700 dark:text-rose-300',    dot: 'bg-rose-400' },
  draft:         { bg: 'bg-slate-100 dark:bg-slate-800',    text: 'text-slate-600 dark:text-slate-300',  dot: 'bg-slate-400' },
  accepted:      { bg: 'bg-emerald-50 dark:bg-emerald-950/40',text:'text-emerald-700 dark:text-emerald-300',dot:'bg-emerald-400'},
  rejected:      { bg: 'bg-rose-50 dark:bg-rose-950/40',    text: 'text-rose-700 dark:text-rose-300',    dot: 'bg-rose-400' },
};

const TYPE_CONFIG = {
  outreach: { Icon: Mail,     color: '#0D9C6A', bg: 'rgba(33,246,168,0.08)', label: 'Outreach' },
  lead:     { Icon: Users,    color: '#7C3AED', bg: '#F5F3FF', label: 'Lead'     },
  proposal: { Icon: FileText, color: '#059669', bg: '#ECFDF5', label: 'Proposal' },
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
    <div className="space-y-5 p-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-foreground">Activity Feed</h2>
            <Badge
              className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full border-0',
                isLive
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full mr-1.5 inline-block', isLive ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/40')} />
              {isLive ? 'Live' : 'Connected'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {items.length} recent {items.length === 1 ? 'activity' : 'activities'} across your pipeline
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-lg gap-2 text-sm border-border/60"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Outreach', count: items.filter(i => i.type === 'outreach').length, color: '#0D9C6A', bg: 'rgba(33,246,168,0.08)', Icon: Mail },
          { label: 'Leads',    count: items.filter(i => i.type === 'lead').length,     color: '#7C3AED', bg: '#F5F3FF', Icon: Users },
          { label: 'Proposals',count: items.filter(i => i.type === 'proposal').length, color: '#059669', bg: '#ECFDF5', Icon: FileText },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-3.5 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: s.bg }}>
              <s.Icon className="h-4 w-4" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground leading-none">{s.count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Activity list */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5 pt-0.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4 bg-muted">
              <Activity className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">No activity yet</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Your activity feed will populate once you start adding leads and sending outreach.
            </p>
          </div>
        ) : (
          <div>
            {Object.entries(grouped).map(([dateLabel, groupItems], groupIdx) => (
              <div key={dateLabel}>
                {/* Date header */}
                <div
                  className="flex items-center gap-3 px-5 py-2.5"
                  style={{
                    background: 'hsl(var(--muted) / 0.5)',
                    borderBottom: '1px solid hsl(var(--border) / 0.5)',
                    borderTop: groupIdx > 0 ? '1px solid hsl(var(--border) / 0.5)' : undefined,
                  }}
                >
                  <Bell className="h-3 w-3 text-muted-foreground/50" />
                  <span className="text-xs font-semibold text-muted-foreground">{dateLabel}</span>
                  <span className="text-xs text-muted-foreground/50">· {groupItems.length}</span>
                </div>

                {/* Items */}
                {groupItems.map((item, idx) => {
                  const config = TYPE_CONFIG[item.type];
                  const statusStyle = item.status ? STATUS_STYLES[item.status] : null;
                  const isLastInGroup = idx === groupItems.length - 1;

                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                      style={{ borderBottom: isLastInGroup ? 'none' : '1px solid hsl(var(--border) / 0.4)' }}
                    >
                      {/* Icon */}
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg mt-0.5"
                        style={{ background: config.bg }}
                      >
                        <config.Icon className="h-4 w-4" style={{ color: config.color }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-foreground leading-tight">{item.title}</p>
                          <span className="text-xs text-muted-foreground/60 shrink-0 pt-0.5 whitespace-nowrap">
                            {getRelativeTime(item.date)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{item.subtitle}</p>
                        {statusStyle && (
                          <span className={cn(
                            'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full mt-1.5',
                            statusStyle.bg, statusStyle.text,
                          )}>
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

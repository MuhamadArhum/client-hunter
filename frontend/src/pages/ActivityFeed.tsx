import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Activity, Mail, UserPlus, RefreshCw, GitBranch, Zap,
  Circle, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import api from '@/services/api';
import { useSocket } from '@/hooks/useSocket';

interface ActivityItem {
  id: string;
  type: 'outreach' | 'lead_new' | 'lead_update' | 'follow_up' | 'sequence';
  title: string;
  subtitle?: string;
  status?: string;
  timestamp: string;
  icon?: string;
  isNew?: boolean;
}

const TYPE_META: Record<string, { color: string; bg: string; Icon: typeof Mail }> = {
  outreach:    { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  Icon: Mail      },
  lead_new:    { color: '#10B981', bg: 'rgba(16,185,129,0.12)',  Icon: UserPlus  },
  lead_update: { color: '#6366F1', bg: 'rgba(99,102,241,0.12)',  Icon: RefreshCw },
  follow_up:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  Icon: Clock     },
  sequence:    { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)',  Icon: GitBranch },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  sent:           { bg: 'rgba(16,185,129,0.1)',  text: '#10B981' },
  failed:         { bg: 'rgba(239,68,68,0.1)',   text: '#EF4444' },
  pending:        { bg: 'rgba(245,158,11,0.1)',  text: '#F59E0B' },
  new:            { bg: 'rgba(59,130,246,0.1)',  text: '#3B82F6' },
  contacted:      { bg: 'rgba(99,102,241,0.1)',  text: '#6366F1' },
  proposal_sent:  { bg: 'rgba(139,92,246,0.1)',  text: '#8B5CF6' },
  follow_up:      { bg: 'rgba(245,158,11,0.1)',  text: '#F59E0B' },
  converted:      { bg: 'rgba(16,185,129,0.1)',  text: '#10B981' },
  lost:           { bg: 'rgba(239,68,68,0.1)',   text: '#EF4444' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function ActivityRow({ item, isFirst }: { item: ActivityItem; isFirst: boolean }) {
  const meta = TYPE_META[item.type] || TYPE_META.lead_update;
  const { Icon } = meta;
  const statusStyle = item.status ? STATUS_COLORS[item.status] : null;

  return (
    <div
      className={cn(
        'flex gap-3 px-4 py-3.5 transition-all duration-500',
        'border-b border-border/30 last:border-0 hover:bg-muted/20',
        item.isNew && 'bg-primary/5 animate-pulse-once',
        isFirst && 'rounded-t-xl',
      )}
    >
      {/* Icon */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
        style={{ background: meta.bg }}
      >
        <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-foreground leading-tight truncate">
            {item.title}
          </p>
          <span className="text-[10px] text-muted-foreground/60 shrink-0 mt-0.5 font-medium">
            {timeAgo(item.timestamp)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {item.subtitle && (
            <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
          )}
          {statusStyle && item.status && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: statusStyle.bg, color: statusStyle.text }}
            >
              {item.status.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex gap-3 px-4 py-3.5 border-b border-border/30 animate-pulse">
      <div className="h-8 w-8 rounded-lg bg-muted shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3.5 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    </div>
  );
}

export default function ActivityFeed() {
  const [items, setItems]       = useState<ActivityItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [liveCount, setLiveCount] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const newIdsRef = useRef<Set<string>>(new Set());

  const fetchActivity = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/activity');
      const data: ActivityItem[] = Array.isArray(res.data?.data) ? res.data.data : [];
      setItems(data);
      setLastRefresh(new Date());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(() => fetchActivity(true), 30000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  // Real-time socket events
  useSocket((event, data) => {
    const d = data as Record<string, unknown>;
    if (event === 'agent:action') {
      const newItem: ActivityItem = {
        id: `live_${Date.now()}`,
        type: (d.type as ActivityItem['type']) || 'follow_up',
        title: (d.message as string) || 'Agent action',
        subtitle: '',
        timestamp: new Date().toISOString(),
        isNew: true,
      };
      newIdsRef.current.add(newItem.id);
      setItems((prev) => [newItem, ...prev].slice(0, 80));
      setLiveCount((c) => c + 1);
      setTimeout(() => {
        newIdsRef.current.delete(newItem.id);
        setItems((prev) => prev.map((i) => i.id === newItem.id ? { ...i, isNew: false } : i));
      }, 3000);
    }
    if (event === 'lead:new') {
      const newItem: ActivityItem = {
        id: `live_lead_${Date.now()}`,
        type: 'lead_new',
        title: `New lead: ${(d.companyName as string) || 'Unknown'}`,
        subtitle: 'Just added',
        timestamp: new Date().toISOString(),
        isNew: true,
      };
      setItems((prev) => [newItem, ...prev].slice(0, 80));
      setLiveCount((c) => c + 1);
    }
    if (event === 'outreach:sent') {
      const newItem: ActivityItem = {
        id: `live_outreach_${Date.now()}`,
        type: 'outreach',
        title: 'Email sent successfully',
        subtitle: 'Via Outreach',
        status: 'sent',
        timestamp: new Date().toISOString(),
        isNew: true,
      };
      setItems((prev) => [newItem, ...prev].slice(0, 80));
      setLiveCount((c) => c + 1);
    }
  });

  const typeCounts = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.type] = (acc[i.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5 p-6">
      {/* Page Header */}
      <div className="page-header">
        <div
          className="absolute inset-0 opacity-40 rounded-2xl"
          style={{ backgroundImage: 'radial-gradient(rgba(99,102,241,0.08) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="relative flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary/70">Real-time</span>
              {/* Live indicator */}
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
                <Circle className="h-1.5 w-1.5 fill-current animate-pulse" />
                LIVE
              </span>
              {liveCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  +{liveCount} new
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-gradient mb-1">Agent Activity</h1>
            <p className="text-sm text-muted-foreground font-medium">
              Everything your agent does — emails, follow-ups, leads, sequences
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 text-xs border-border/60"
            onClick={() => fetchActivity()}
            disabled={loading}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Emails Sent',    key: 'outreach',    ...TYPE_META.outreach    },
          { label: 'New Leads',      key: 'lead_new',    ...TYPE_META.lead_new    },
          { label: 'Status Updates', key: 'lead_update', ...TYPE_META.lead_update },
          { label: 'Follow-ups',     key: 'follow_up',   ...TYPE_META.follow_up   },
        ].map((stat) => (
          <div
            key={stat.key}
            className="rounded-xl border border-border/60 bg-card p-3.5 flex items-center gap-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: stat.bg }}>
              <stat.Icon className="h-3.5 w-3.5" style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-lg font-black text-foreground leading-none">{typeCounts[stat.key] || 0}</p>
              <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Activity timeline */}
      <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-foreground">Recent Activity</span>
            <span className="text-xs text-muted-foreground/60">
              · Last updated {timeAgo(lastRefresh.toISOString())}
            </span>
          </div>
          <span className="text-xs font-semibold text-muted-foreground/60">{items.length} events</span>
        </div>

        {loading ? (
          <div>
            {[...Array(8)].map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl mb-3" style={{ background: 'rgba(99,102,241,0.1)' }}>
              <Activity className="h-5 w-5" style={{ color: '#6366F1' }} />
            </div>
            <p className="text-sm font-bold text-foreground mb-1">No activity yet</p>
            <p className="text-xs text-muted-foreground">
              When your agent sends emails, adds leads, or runs follow-ups — they'll appear here in real-time.
            </p>
          </div>
        ) : (
          <div>
            {items.map((item, idx) => (
              <ActivityRow key={item.id} item={item} isFirst={idx === 0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

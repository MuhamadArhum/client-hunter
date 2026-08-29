import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Activity, Mail, UserPlus, RefreshCw, GitBranch, Zap,
  Circle, Clock,
} from 'lucide-react';
import api from '@/services/api';
import { useSocket } from '@/hooks/useSocket';
import AppPagination, { type PaginationMeta } from '@/components/ui/AppPagination';

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
  outreach:    { color: '#1FB2A6', bg: 'rgba(31,178,166,0.12)',  Icon: Mail      },
  lead_new:    { color: '#3E8E5A', bg: 'rgba(62,142,90,0.12)',   Icon: UserPlus  },
  lead_update: { color: '#C98A1E', bg: 'rgba(201,138,30,0.14)',  Icon: RefreshCw },
  follow_up:   { color: '#C23B2E', bg: 'rgba(194,59,46,0.12)',   Icon: Clock     },
  sequence:    { color: '#1B1F2B', bg: 'rgba(27,31,43,0.08)',    Icon: GitBranch },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  sent:           { bg: 'rgba(62,142,90,0.12)',  text: '#3E8E5A' },
  failed:         { bg: 'rgba(194,59,46,0.12)',  text: '#C23B2E' },
  pending:        { bg: 'rgba(201,138,30,0.14)', text: '#C98A1E' },
  new:            { bg: 'rgba(31,178,166,0.12)', text: '#1FB2A6' },
  contacted:      { bg: 'rgba(201,138,30,0.14)', text: '#C98A1E' },
  proposal_sent:  { bg: 'rgba(62,142,90,0.12)',  text: '#3E8E5A' },
  follow_up:      { bg: 'rgba(194,59,46,0.12)',  text: '#C23B2E' },
  converted:      { bg: 'rgba(62,142,90,0.12)',  text: '#3E8E5A' },
  lost:           { bg: 'rgba(194,59,46,0.12)',  text: '#C23B2E' },
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

function ActivityRow({ item }: { item: ActivityItem; isFirst: boolean }) {
  const meta = TYPE_META[item.type] || TYPE_META.lead_update;
  const { Icon } = meta;
  const statusStyle = item.status ? STATUS_COLORS[item.status] : null;

  return (
    <div
      style={{
        display: 'flex', gap: 12, padding: '12px 20px',
        borderBottom: '1px solid rgba(203,211,207,0.5)',
        transition: 'background 0.15s',
        background: item.isNew ? 'rgba(31,178,166,0.04)' : 'transparent',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(154,198,232,0.06)')}
      onMouseLeave={e => (e.currentTarget.style.background = item.isNew ? 'rgba(31,178,166,0.04)' : 'transparent')}
    >
      {/* Icon */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 4, background: meta.bg, flexShrink: 0, marginTop: 2 }}>
        <Icon style={{ width: 13, height: 13, color: meta.color }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1B1F2B', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.title}
          </p>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#9CADB0', flexShrink: 0, paddingTop: 2 }}>
            {timeAgo(item.timestamp)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
          {item.subtitle && (
            <p style={{ fontSize: 12, color: '#6E7D79', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.subtitle}</p>
          )}
          {statusStyle && item.status && (
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              padding: '2px 8px', borderRadius: 10,
              background: statusStyle.bg, color: statusStyle.text,
            }}>
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
    <div style={{ display: 'flex', gap: 12, padding: '12px 20px', borderBottom: '1px solid rgba(203,211,207,0.5)' }} className="animate-pulse">
      <div style={{ width: 32, height: 32, borderRadius: 4, background: '#CBD3CF', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
        <div style={{ height: 12, background: '#CBD3CF', borderRadius: 4, width: '75%' }} />
        <div style={{ height: 10, background: '#CBD3CF', borderRadius: 4, width: '50%' }} />
      </div>
    </div>
  );
}

const DEFAULT_PAGI: PaginationMeta = { total: 0, page: 1, limit: 20, pages: 1 };

export default function ActivityFeed() {
  const [items, setItems]           = useState<ActivityItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [liveCount, setLiveCount]   = useState(0);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [pagination, setPagination] = useState<PaginationMeta>(DEFAULT_PAGI);
  const [page, setPage]             = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const newIdsRef = useRef<Set<string>>(new Set());

  const fetchActivity = useCallback(async (p = page, type = typeFilter, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/activity', {
        params: { page: p, limit: 20, type: type !== 'all' ? type : undefined },
      });
      const data: ActivityItem[] = Array.isArray(res.data?.data) ? res.data.data : [];
      setItems(data);
      setPagination(res.data?.pagination || DEFAULT_PAGI);
      setLastRefresh(new Date());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => { fetchActivity(page, typeFilter); }, [page, typeFilter]);

  useEffect(() => {
    const interval = setInterval(() => fetchActivity(1, typeFilter, true), 30000);
    return () => clearInterval(interval);
  }, [typeFilter]);

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
      setItems((prev) => [newItem, ...prev].slice(0, 20));
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
      setItems((prev) => [newItem, ...prev].slice(0, 20));
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
      setItems((prev) => [newItem, ...prev].slice(0, 20));
      setLiveCount((c) => c + 1);
    }
  });

  const typeCounts = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.type] = (acc[i.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5 p-6" style={{ background: '#E6E9E5', minHeight: '100vh' }}>

      {/* Page Header */}
      <div style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, borderTop: '3px solid #1FB2A6', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Activity style={{ width: 15, height: 15, color: '#1FB2A6' }} />
              <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1FB2A6' }}>Real-time</span>
              {/* Live indicator */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                padding: '2px 8px', borderRadius: 10,
                background: 'rgba(62,142,90,0.12)', color: '#3E8E5A',
              }}>
                <Circle style={{ width: 6, height: 6, fill: '#3E8E5A', color: '#3E8E5A' }} className="animate-pulse" />
                LIVE
              </span>
              {liveCount > 0 && (
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700,
                  padding: '2px 8px', borderRadius: 10,
                  background: 'rgba(31,178,166,0.12)', color: '#1FB2A6',
                }}>
                  +{liveCount} new
                </span>
              )}
            </div>
            <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1B1F2B', marginBottom: 4 }}>Agent Activity</h1>
            <p style={{ fontSize: 13, color: '#6E7D79' }}>
              Everything your agent does — emails, follow-ups, leads, sequences
            </p>
          </div>
          <button
            className="h-8 px-3 gap-2 flex items-center text-xs font-semibold"
            style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, color: '#6E7D79', cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace" }}
            onClick={() => fetchActivity(1, typeFilter)}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
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
            style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, borderTop: `3px solid ${stat.color}`, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 4, background: stat.bg, flexShrink: 0 }}>
              <stat.Icon style={{ width: 13, height: 13, color: stat.color }} />
            </div>
            <div>
              <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: 20, fontWeight: 700, color: stat.color, lineHeight: 1 }}>{typeCounts[stat.key] || 0}</p>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6E7D79', marginTop: 3 }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Activity timeline */}
      <div style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, overflow: 'hidden' }}>
        {/* Panel header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #CBD3CF', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap style={{ width: 15, height: 15, color: '#1FB2A6' }} />
            <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1B1F2B' }}>Recent Activity</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#9CADB0' }}>
              · Last updated {timeAgo(lastRefresh.toISOString())}
            </span>
          </div>
          {/* Type filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {[
              { key: 'all', label: 'All' },
              { key: 'outreach', label: 'Emails' },
              { key: 'lead_new', label: 'New Leads' },
              { key: 'lead_update', label: 'Updates' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => { setTypeFilter(f.key); setPage(1); }}
                style={{
                  padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                  fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer', transition: 'all 0.15s',
                  background: typeFilter === f.key ? '#1FB2A6' : '#F1F4F0',
                  color: typeFilter === f.key ? '#fff' : '#6E7D79',
                  border: typeFilter === f.key ? '1px solid #1FB2A6' : '1px solid #CBD3CF',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div>
            {[...Array(8)].map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 4, background: 'rgba(203,211,207,0.4)', marginBottom: 12 }}>
              <Activity style={{ width: 20, height: 20, color: '#9CADB0' }} />
            </div>
            <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, fontWeight: 600, textTransform: 'uppercase', color: '#1B1F2B', marginBottom: 6 }}>No activity yet</p>
            <p style={{ fontSize: 12, color: '#6E7D79', maxWidth: 320 }}>
              When your agent sends emails, adds leads, or runs follow-ups — they'll appear here in real-time.
            </p>
          </div>
        ) : (
          <div>
            {items.map((item, idx) => (
              <ActivityRow key={item.id} item={item} isFirst={idx === 0} />
            ))}
            <div style={{ borderTop: '1px solid #CBD3CF', padding: '0 16px' }}>
              <AppPagination
                pagination={pagination}
                onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

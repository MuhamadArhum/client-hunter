import { useEffect, useState } from 'react';
import { Mail, FileText, Users, Bell, RefreshCw, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/services/api';
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

const STATUS_STYLES: Record<string, { bg: string; text: string; dotColor: string }> = {
  sent:          { bg: 'rgba(62,142,90,0.12)',   text: '#3E8E5A', dotColor: '#3E8E5A' },
  failed:        { bg: 'rgba(194,59,46,0.12)',   text: '#C23B2E', dotColor: '#C23B2E' },
  new:           { bg: 'rgba(31,178,166,0.12)',  text: '#1FB2A6', dotColor: '#1FB2A6' },
  contacted:     { bg: 'rgba(201,138,30,0.14)',  text: '#C98A1E', dotColor: '#C98A1E' },
  proposal_sent: { bg: 'rgba(62,142,90,0.12)',   text: '#3E8E5A', dotColor: '#3E8E5A' },
  follow_up:     { bg: 'rgba(194,59,46,0.12)',   text: '#C23B2E', dotColor: '#C23B2E' },
  converted:     { bg: 'rgba(62,142,90,0.12)',   text: '#3E8E5A', dotColor: '#3E8E5A' },
  lost:          { bg: 'rgba(194,59,46,0.12)',   text: '#C23B2E', dotColor: '#C23B2E' },
  draft:         { bg: 'rgba(110,125,121,0.1)',  text: '#6E7D79', dotColor: '#6E7D79' },
  accepted:      { bg: 'rgba(62,142,90,0.12)',   text: '#3E8E5A', dotColor: '#3E8E5A' },
  rejected:      { bg: 'rgba(194,59,46,0.12)',   text: '#C23B2E', dotColor: '#C23B2E' },
};

const TYPE_CONFIG = {
  outreach: { Icon: Mail,     color: '#1FB2A6', bg: 'rgba(31,178,166,0.1)',  label: 'Outreach' },
  lead:     { Icon: Users,    color: '#C98A1E', bg: 'rgba(201,138,30,0.1)', label: 'Lead'     },
  proposal: { Icon: FileText, color: '#3E8E5A', bg: 'rgba(62,142,90,0.1)',  label: 'Proposal' },
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
          (o: { _id: string; type?: string; subject?: string; lead?: { companyName?: string }; status?: string; createdAt: string }) => ({
            id: `outreach-${o._id}`,
            type: 'outreach' as const,
            title: `${o.type === 'email' ? 'Email' : 'WhatsApp'} sent`,
            subtitle: `To: ${o.lead?.companyName || 'Unknown'}${o.subject ? ` · "${o.subject}"` : ''}`,
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
          (p: { _id: string; title?: string; lead?: { companyName?: string } | string; status?: string; createdAt: string }) => {
            const company = typeof p.lead === 'object' && p.lead !== null ? p.lead.companyName || '—' : '—';
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
    <div className="space-y-5 p-6" style={{ background: '#E6E9E5', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, borderTop: '3px solid #1FB2A6', padding: '20px 24px' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bell className="h-4 w-4" style={{ color: '#1FB2A6' }} />
              <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1FB2A6' }}>Feed</span>
              {/* Live indicator */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                padding: '2px 8px', borderRadius: 10,
                background: isLive ? 'rgba(62,142,90,0.12)' : 'rgba(110,125,121,0.1)',
                color: isLive ? '#3E8E5A' : '#6E7D79',
              }}>
                <span style={{
                  display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                  background: isLive ? '#3E8E5A' : '#9CADB0',
                  animation: isLive ? 'pulse 2s infinite' : undefined,
                }} />
                {isLive ? 'Live' : 'Connected'}
              </span>
            </div>
            <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1B1F2B', marginBottom: 4 }}>Activity Feed</h1>
            <p style={{ fontSize: 13, color: '#6E7D79' }}>
              {items.length} recent {items.length === 1 ? 'activity' : 'activities'} across your pipeline
            </p>
          </div>
          <button
            className="h-8 px-3 gap-2 flex items-center text-xs font-semibold"
            style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, color: '#6E7D79', cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace" }}
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Outreach',  count: items.filter(i => i.type === 'outreach').length,  color: '#1FB2A6', bg: 'rgba(31,178,166,0.1)',  Icon: Mail     },
          { label: 'Leads',     count: items.filter(i => i.type === 'lead').length,       color: '#C98A1E', bg: 'rgba(201,138,30,0.1)', Icon: Users    },
          { label: 'Proposals', count: items.filter(i => i.type === 'proposal').length,   color: '#3E8E5A', bg: 'rgba(62,142,90,0.1)',  Icon: FileText },
        ].map((s) => (
          <div key={s.label} style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, borderTop: `3px solid ${s.color}`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 4, background: s.bg, flexShrink: 0 }}>
              <s.Icon style={{ color: s.color, width: 16, height: 16 }} />
            </div>
            <div>
              <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.count}</p>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6E7D79', marginTop: 3 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Activity list */}
      <div style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '20px 24px' }} className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 shrink-0" style={{ borderRadius: 4 }} />
                <div className="flex-1 space-y-1.5 pt-0.5">
                  <Skeleton className="h-4 w-3/4" style={{ borderRadius: 4 }} />
                  <Skeleton className="h-3 w-1/2" style={{ borderRadius: 4 }} />
                </div>
                <Skeleton className="h-3 w-12" style={{ borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(203,211,207,0.4)', marginBottom: 16 }}>
              <Activity style={{ width: 20, height: 20, color: '#9CADB0' }} />
            </div>
            <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, fontWeight: 600, textTransform: 'uppercase', color: '#1B1F2B', marginBottom: 6 }}>No activity yet</p>
            <p style={{ fontSize: 12, color: '#6E7D79', maxWidth: 280 }}>
              Your activity feed will populate once you start adding leads and sending outreach.
            </p>
          </div>
        ) : (
          <div>
            {Object.entries(grouped).map(([dateLabel, groupItems], groupIdx) => (
              <div key={dateLabel}>
                {/* Date header */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 20px',
                    background: 'rgba(203,211,207,0.3)',
                    borderBottom: '1px solid #CBD3CF',
                    borderTop: groupIdx > 0 ? '1px solid #CBD3CF' : undefined,
                  }}
                >
                  <Bell style={{ width: 11, height: 11, color: '#9CADB0' }} />
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6E7D79' }}>{dateLabel}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#9CADB0' }}>· {groupItems.length}</span>
                </div>

                {/* Items */}
                {groupItems.map((item, idx) => {
                  const config = TYPE_CONFIG[item.type];
                  const statusStyle = item.status ? STATUS_STYLES[item.status] : null;
                  const isLastInGroup = idx === groupItems.length - 1;

                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-4"
                      style={{
                        padding: '14px 20px',
                        borderBottom: isLastInGroup ? 'none' : '1px solid rgba(203,211,207,0.5)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(154,198,232,0.06)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Icon */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 4, background: config.bg, flexShrink: 0, marginTop: 2 }}>
                        <config.Icon style={{ width: 15, height: 15, color: config.color }} />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#1B1F2B', lineHeight: 1.3 }}>{item.title}</p>
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#9CADB0', flexShrink: 0, paddingTop: 2, whiteSpace: 'nowrap' }}>
                            {getRelativeTime(item.date)}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: '#6E7D79', marginTop: 3, lineHeight: 1.4 }}>{item.subtitle}</p>
                        {statusStyle && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6,
                            fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                            padding: '3px 9px', borderRadius: 10,
                            background: statusStyle.bg, color: statusStyle.text,
                          }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusStyle.dotColor, display: 'inline-block', flexShrink: 0 }} />
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

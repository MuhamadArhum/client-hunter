import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, FileText, Mail, Plus, BarChart3, ArrowRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import api from '@/services/api';

/* ── Interfaces ── */
interface StatusBreakdown { _id: string; count: number; }
interface Lead { _id: string; companyName: string; contactName: string; email: string; status: string; source: string; createdAt: string; }
interface OutreachItem { _id: string; lead?: { companyName?: string }; type: string; status: string; subject?: string; createdAt: string; }
interface DashboardData {
  totalLeads: number; conversionRate: number; sentProposals: number; totalEmails: number;
  statusBreakdown: StatusBreakdown[]; recentLeads: Lead[]; recentOutreach: OutreachItem[];
}

/* ── ConstructPro Design Tokens ── */
const CP = {
  bg:         '#E6E9E5',
  card:       '#F1F4F0',
  ink:        '#101211',
  blueprint:  '#1B1F2B',
  steel:      '#6E7D79',
  rule:       '#CBD3CF',
  teal:       '#1FB2A6',
  tealDeep:   '#189187',
  green:      '#3E8E5A',
  amber:      '#C98A1E',
  red:        '#C23B2E',
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  new:           { bg: 'rgba(62,142,90,0.12)',   text: CP.green,  dot: CP.green  },
  contacted:     { bg: 'rgba(201,138,30,0.14)',  text: CP.amber,  dot: CP.amber  },
  proposal_sent: { bg: 'rgba(31,178,166,0.12)',  text: CP.teal,   dot: CP.teal   },
  follow_up:     { bg: 'rgba(194,59,46,0.12)',   text: CP.red,    dot: CP.red    },
  converted:     { bg: 'rgba(62,142,90,0.12)',   text: CP.green,  dot: CP.green  },
  lost:          { bg: 'rgba(194,59,46,0.12)',   text: CP.red,    dot: CP.red    },
};

const CHART_COLORS: Record<string, string> = {
  new: CP.green, contacted: CP.amber, proposal_sent: CP.teal,
  follow_up: CP.red, converted: CP.green, lost: CP.red,
};

const KPI_CARDS = [
  { icon: Users,      label: 'TOTAL LEADS',     key: 'totalLeads'     as const, borderColor: CP.teal    },
  { icon: TrendingUp, label: 'CONVERSION RATE',  key: 'conversionRate' as const, suffix: '%', borderColor: CP.green   },
  { icon: FileText,   label: 'PROPOSALS SENT',   key: 'sentProposals'  as const, borderColor: CP.blueprint },
  { icon: Mail,       label: 'EMAILS SENT',      key: 'totalEmails'    as const, borderColor: CP.amber   },
];

const CARD_STYLE: React.CSSProperties = {
  background: CP.card,
  border: `1px solid ${CP.rule}`,
  borderRadius: 4,
};

const PANEL_HEADER: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 20px',
  borderBottom: `1px solid ${CP.rule}`,
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontFamily: "'Oswald', sans-serif",
      fontWeight: 600,
      fontSize: 14,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      color: CP.blueprint,
    }}>
      {children}
    </span>
  );
}

function ViewAllLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 11.5,
        color: CP.tealDeep,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      View all <ArrowRight size={11} />
    </button>
  );
}

function StatusPill({ status }: { status: string }) {
  const st = STATUS_STYLES[status] || STATUS_STYLES.new;
  return (
    <span style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 10.5,
      textTransform: 'uppercase' as const,
      padding: '3px 9px',
      borderRadius: 10,
      background: st.bg,
      color: st.text,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      whiteSpace: 'nowrap' as const,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot, display: 'inline-block', flexShrink: 0 }} />
      {status.replace(/_/g, ' ')}
    </span>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: CP.card, border: `1px solid ${CP.rule}`, borderRadius: 4, padding: '8px 12px' }}>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: CP.steel, marginBottom: 2 }}>{label?.replace(/_/g, ' ')}</p>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 600, color: CP.ink }}>{payload[0].value} leads</p>
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

  const chartData = (Array.isArray(data?.statusBreakdown) ? data!.statusBreakdown : []).map((s) => ({
    name: s._id, label: s._id.replace(/_/g, ' '), count: s.count,
  }));

  const totalInPipeline = chartData.reduce((sum, d) => sum + d.count, 0);
  const convertedCount = (data?.statusBreakdown || []).find((s) => s._id === 'converted')?.count || 0;
  const followUpCount  = (data?.statusBreakdown || []).find((s) => s._id === 'follow_up')?.count  || 0;

  if (loading) {
    return (
      <div style={{ background: CP.bg, minHeight: '100vh', padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ ...CARD_STYLE, height: 100, opacity: 0.5 }} className="animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: CP.bg, minHeight: '100vh', padding: 24 }} className="page-content">

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }} className="sm:grid-cols-2 lg:grid-cols-4">
        {KPI_CARDS.map((card) => {
          const raw = data?.[card.key] ?? 0;
          const val = 'suffix' in card ? `${raw}${card.suffix}` : raw;
          return (
            <div key={card.key} style={{
              ...CARD_STYLE,
              borderTop: `3px solid ${card.borderColor}`,
              padding: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 4, background: `${card.borderColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <card.icon size={16} style={{ color: card.borderColor }} />
                </div>
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 28, fontWeight: 700, color: CP.ink, lineHeight: 1, marginBottom: 6 }}>
                {val}
              </div>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 11, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: CP.steel }}>
                {card.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main Grid: Chart + Active Leads ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '58% 1fr', gap: 16, marginBottom: 20 }}>

        {/* Lead Pipeline Chart */}
        <div style={{ ...CARD_STYLE, overflow: 'hidden' }}>
          <div style={PANEL_HEADER}>
            <SectionTitle>Lead Pipeline</SectionTitle>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: CP.steel }}>
              {totalInPipeline} total · {convertedCount} converted
            </div>
          </div>
          <div style={{ padding: '16px 20px 20px' }}>
            {chartData.length === 0 ? (
              <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <BarChart3 size={32} style={{ color: CP.steel, opacity: 0.4 }} />
                <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, color: CP.steel }}>No pipeline data yet</p>
                <button
                  onClick={() => navigate('/leads')}
                  style={{ background: CP.teal, color: '#fff', border: 'none', borderRadius: 4, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Add your first lead
                </button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke={CP.rule} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: CP.steel, fontFamily: "'IBM Plex Mono', monospace" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: CP.steel }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(31,178,166,0.06)' }} />
                  <Bar dataKey="count" radius={[2, 2, 0, 0]} maxBarSize={40}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={CHART_COLORS[entry.name] || CP.teal} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Active Leads Panel */}
        <div style={{ ...CARD_STYLE, overflow: 'hidden' }}>
          <div style={PANEL_HEADER}>
            <SectionTitle>Active Leads</SectionTitle>
            <ViewAllLink onClick={() => navigate('/leads')} />
          </div>
          <div style={{ overflow: 'auto' }}>
            {(data?.recentLeads || []).length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: CP.steel, fontSize: 13 }}>No leads yet</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${CP.rule}` }}>
                    {['Company', 'Status', 'Source', 'Date'].map((h) => (
                      <th key={h} style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 10.5,
                        fontWeight: 500,
                        textTransform: 'uppercase' as const,
                        letterSpacing: '0.05em',
                        color: CP.steel,
                        textAlign: 'left',
                        padding: '8px 12px',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentLeads || []).slice(0, 7).map((lead, idx, arr) => (
                    <tr
                      key={lead._id}
                      style={{ borderBottom: idx === arr.length - 1 ? 'none' : `1px solid ${CP.rule}`, cursor: 'pointer' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(154,198,232,0.06)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                      onClick={() => navigate(`/leads/${lead._id}`)}
                    >
                      <td style={{ padding: '9px 12px', fontSize: 13, color: CP.ink, fontWeight: 500, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                        {lead.companyName}
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        <StatusPill status={lead.status} />
                      </td>
                      <td style={{ padding: '9px 12px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: CP.steel, textTransform: 'capitalize' as const }}>
                        {lead.source}
                      </td>
                      <td style={{ padding: '9px 12px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: CP.steel, whiteSpace: 'nowrap' as const }}>
                        {new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Grid: Recent Activity + Quick Actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Recent Activity */}
        <div style={{ ...CARD_STYLE, overflow: 'hidden' }}>
          <div style={PANEL_HEADER}>
            <SectionTitle>Recent Activity</SectionTitle>
            <ViewAllLink onClick={() => navigate('/outreach')} />
          </div>
          <div style={{ padding: '8px 0' }}>
            {(data?.recentOutreach || []).length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: CP.steel, fontSize: 13 }}>No outreach sent yet</div>
            ) : (
              (data?.recentOutreach || []).slice(0, 6).map((item, idx, arr) => {
                const isLast = idx === arr.length - 1;
                const dotColor = item.status === 'sent' ? CP.green : item.status === 'failed' ? CP.red : CP.amber;
                return (
                  <div key={item._id} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '10px 20px',
                    borderBottom: isLast ? 'none' : `1px solid ${CP.rule}`,
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, marginTop: 5, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: CP.ink, fontWeight: 500, marginBottom: 2 }}>
                        {item.lead?.companyName || '—'}
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: CP.steel, marginLeft: 6, textTransform: 'capitalize' as const }}>
                          {item.type}
                        </span>
                      </div>
                      {item.subject && (
                        <div style={{ fontSize: 11, color: CP.steel, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                          {item.subject}
                        </div>
                      )}
                    </div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: CP.steel, whiteSpace: 'nowrap' as const, flexShrink: 0 }}>
                      {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ ...CARD_STYLE, overflow: 'hidden' }}>
          <div style={PANEL_HEADER}>
            <SectionTitle>Quick Actions</SectionTitle>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
            {[
              { icon: Users,      label: 'Manage Leads',      desc: 'View and qualify your pipeline',  path: '/leads',     accent: CP.teal    },
              { icon: FileText,   label: 'Generate Proposal',  desc: 'Create AI-powered proposals',     path: '/proposals', accent: CP.green   },
              { icon: TrendingUp, label: 'View Analytics',     desc: 'Track your performance metrics',  path: '/analytics', accent: CP.amber   },
            ].map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  background: CP.bg,
                  border: `1px solid ${CP.rule}`,
                  borderRadius: 4,
                  cursor: 'pointer',
                  textAlign: 'left' as const,
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = action.accent; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = CP.rule; }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 4, background: `${action.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <action.icon size={16} style={{ color: action.accent }} />
                </div>
                <div>
                  <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 13, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.04em', color: CP.blueprint, marginBottom: 2 }}>
                    {action.label}
                  </div>
                  <div style={{ fontSize: 12, color: CP.steel }}>{action.desc}</div>
                </div>
              </button>
            ))}

            {/* Summary insight */}
            <div style={{ marginTop: 4, padding: '12px 14px', background: 'rgba(31,178,166,0.07)', border: `1px solid rgba(31,178,166,0.2)`, borderRadius: 4 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: CP.teal, marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Pipeline Summary</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: CP.steel }}>
                  Follow-up: <strong style={{ color: followUpCount > 0 ? CP.amber : CP.green }}>{followUpCount}</strong>
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: CP.steel }}>
                  Converted: <strong style={{ color: CP.green }}>{convertedCount}</strong>
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: CP.steel }}>
                  Rate: <strong style={{ color: CP.teal }}>{data?.conversionRate || 0}%</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Add Lead button (floating bottom bar) ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <button
          onClick={() => navigate('/leads')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: CP.teal,
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '10px 20px',
            fontFamily: "'Oswald', sans-serif",
            fontSize: 13,
            fontWeight: 500,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.06em',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = CP.tealDeep; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = CP.teal; }}
        >
          <Plus size={15} /> Add Lead
        </button>
      </div>
    </div>
  );
}

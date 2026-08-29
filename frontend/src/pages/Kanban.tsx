import { useEffect, useState, useCallback } from 'react';
import { Kanban as KanbanIcon, RefreshCw } from 'lucide-react';
import api from '@/services/api';

interface Lead {
  _id: string;
  companyName: string;
  industry?: string;
  aiScore?: number;
  status: string;
  email?: string;
}

const COLUMNS: { key: string; label: string; color: string; bg: string }[] = [
  { key: 'new',           label: 'New',           color: '#1FB2A6', bg: 'rgba(31,178,166,0.1)'   },
  { key: 'contacted',     label: 'Contacted',     color: '#C98A1E', bg: 'rgba(201,138,30,0.1)'   },
  { key: 'proposal_sent', label: 'Proposal Sent', color: '#3E8E5A', bg: 'rgba(62,142,90,0.1)'    },
  { key: 'follow_up',     label: 'Follow Up',     color: '#C23B2E', bg: 'rgba(194,59,46,0.1)'    },
  { key: 'converted',     label: 'Converted',     color: '#1FB2A6', bg: 'rgba(31,178,166,0.08)'  },
  { key: 'lost',          label: 'Lost',           color: '#6E7D79', bg: 'rgba(110,125,121,0.1)' },
];

export default function Kanban() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const fetchLeads = useCallback(() => {
    setLoading(true);
    api.get('/leads', { params: { limit: 200 } })
      .then((res) => setLeads(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const getLeadsForColumn = (status: string) => leads.filter((l) => l.status === status);

  const handleDrop = async (targetStatus: string) => {
    if (!dragging || dragging === targetStatus) return;
    const lead = leads.find((l) => l._id === dragging);
    if (!lead || lead.status === targetStatus) return;

    setLeads((prev) => prev.map((l) => l._id === dragging ? { ...l, status: targetStatus } : l));
    try {
      await api.put(`/leads/${dragging}`, { status: targetStatus });
    } catch {
      fetchLeads();
    }
    setDragging(null);
    setDragOverCol(null);
  };

  return (
    <div className="space-y-5 p-6 h-full flex flex-col" style={{ background: '#E6E9E5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, borderTop: '3px solid #1FB2A6', padding: '20px 24px' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <KanbanIcon className="h-4 w-4" style={{ color: '#1FB2A6' }} />
              <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1FB2A6' }}>Pipeline</span>
            </div>
            <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1B1F2B', marginBottom: 4 }}>Kanban Board</h1>
            <p style={{ fontSize: 13, color: '#6E7D79' }}>Drag leads across pipeline stages</p>
          </div>
          <button
            className="h-8 px-3 gap-2 flex items-center text-xs font-semibold"
            style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, color: '#6E7D79', cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace" }}
            onClick={fetchLeads}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(31,178,166,0.3)', borderTopColor: '#1FB2A6' }} />
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4 flex-1" style={{ minHeight: 0 }}>
          {COLUMNS.map((col) => {
            const colLeads = getLeadsForColumn(col.key);
            const isDragOver = dragOverCol === col.key;
            return (
              <div
                key={col.key}
                className="flex-shrink-0 w-64 flex flex-col transition-all"
                style={{
                  background: isDragOver ? col.bg : '#F1F4F0',
                  border: isDragOver ? `1px solid ${col.color}` : '1px solid #CBD3CF',
                  borderRadius: 4,
                  borderTop: `3px solid ${col.color}`,
                  boxShadow: isDragOver ? `0 0 0 2px ${col.color}30` : undefined,
                }}
                onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.key); }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={() => handleDrop(col.key)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #CBD3CF' }}>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.color }} />
                    <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 13, fontWeight: 600, textTransform: 'uppercase', color: '#1B1F2B' }}>{col.label}</span>
                  </div>
                  <span
                    style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: col.bg, color: col.color }}
                  >
                    {colLeads.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {colLeads.length === 0 ? (
                    <div className="flex items-center justify-center h-24" style={{ border: '2px dashed #CBD3CF', borderRadius: 4 }}>
                      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: '#9CADB0' }}>Drop here</p>
                    </div>
                  ) : (
                    colLeads.map((lead) => (
                      <div
                        key={lead._id}
                        draggable
                        onDragStart={() => setDragging(lead._id)}
                        onDragEnd={() => { setDragging(null); setDragOverCol(null); }}
                        className="p-3 cursor-grab active:cursor-grabbing transition-all select-none"
                        style={{
                          background: dragging === lead._id ? col.bg : '#fff',
                          border: dragging === lead._id ? `1px solid ${col.color}` : '1px solid #CBD3CF',
                          borderRadius: 4,
                          opacity: dragging === lead._id ? 0.6 : 1,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        }}
                      >
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#1B1F2B', fontFamily: "'IBM Plex Sans', sans-serif" }} className="truncate">{lead.companyName}</p>
                        {lead.industry && <p style={{ fontSize: 11, color: '#6E7D79', marginTop: 2 }} className="truncate">{lead.industry}</p>}
                        {lead.email && <p style={{ fontSize: 11, color: '#6E7D79', fontFamily: "'IBM Plex Mono', monospace" }} className="truncate">{lead.email}</p>}
                        {lead.aiScore != null && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <div className="flex-1 h-1 overflow-hidden" style={{ background: '#CBD3CF', borderRadius: 4 }}>
                              <div className="h-full" style={{ width: `${lead.aiScore}%`, background: col.color, borderRadius: 4 }} />
                            </div>
                            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700, color: col.color }}>{lead.aiScore}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

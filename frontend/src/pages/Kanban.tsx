import { useEffect, useState, useCallback } from 'react';
import { Kanban as KanbanIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  { key: 'new', label: 'New', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  { key: 'contacted', label: 'Contacted', color: '#1DD2D7', bg: 'rgba(29,210,215,0.1)' },
  { key: 'proposal_sent', label: 'Proposal Sent', color: '#9F8DD4', bg: 'rgba(159,141,212,0.1)' },
  { key: 'follow_up', label: 'Follow Up', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  { key: 'converted', label: 'Converted', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  { key: 'lost', label: 'Lost', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
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
      fetchLeads(); // revert on error
    }
    setDragging(null);
    setDragOverCol(null);
  };

  return (
    <div className="space-y-5 p-6 h-full flex flex-col">
      <div className="page-header">
        <div className="absolute inset-0 opacity-40 rounded-2xl"
             style={{ backgroundImage: 'radial-gradient(rgba(99,102,241,0.08) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <KanbanIcon className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary/70">Pipeline</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-gradient mb-1">Kanban Board</h1>
            <p className="text-sm text-muted-foreground font-medium">Drag leads across pipeline stages</p>
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-2 text-xs border-border/60" onClick={fetchLeads}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4 flex-1" style={{ minHeight: 0 }}>
          {COLUMNS.map((col) => {
            const colLeads = getLeadsForColumn(col.key);
            const isDragOver = dragOverCol === col.key;
            return (
              <div
                key={col.key}
                className="flex-shrink-0 w-64 flex flex-col rounded-2xl border transition-all"
                style={{
                  background: isDragOver ? col.bg : 'hsl(var(--card))',
                  borderColor: isDragOver ? col.color : 'hsl(var(--border) / 0.6)',
                  boxShadow: isDragOver ? `0 0 0 2px ${col.color}40` : undefined,
                }}
                onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.key); }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={() => handleDrop(col.key)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.color }} />
                    <span className="text-sm font-semibold text-foreground">{col.label}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: col.bg, color: col.color }}>
                    {colLeads.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {colLeads.length === 0 ? (
                    <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-border/30">
                      <p className="text-xs text-muted-foreground/50">Drop here</p>
                    </div>
                  ) : (
                    colLeads.map((lead) => (
                      <div
                        key={lead._id}
                        draggable
                        onDragStart={() => setDragging(lead._id)}
                        onDragEnd={() => { setDragging(null); setDragOverCol(null); }}
                        className="rounded-xl p-3 border cursor-grab active:cursor-grabbing transition-all select-none"
                        style={{
                          background: dragging === lead._id ? col.bg : 'hsl(var(--background))',
                          borderColor: dragging === lead._id ? col.color : 'hsl(var(--border) / 0.5)',
                          opacity: dragging === lead._id ? 0.6 : 1,
                          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        }}
                      >
                        <p className="text-sm font-semibold text-foreground truncate">{lead.companyName}</p>
                        {lead.industry && <p className="text-xs text-muted-foreground mt-0.5 truncate">{lead.industry}</p>}
                        {lead.email && <p className="text-xs text-muted-foreground truncate">{lead.email}</p>}
                        {lead.aiScore != null && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <div className="flex-1 h-1 rounded-full bg-border/50">
                              <div className="h-full rounded-full" style={{ width: `${lead.aiScore}%`, background: col.color }} />
                            </div>
                            <span className="text-[10px] font-bold" style={{ color: col.color }}>{lead.aiScore}</span>
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

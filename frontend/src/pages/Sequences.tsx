import { useEffect, useState, useCallback } from 'react';
import { GitBranch, Plus, Trash2, Play, Pause, Users, ChevronDown, ChevronUp, X, Search } from 'lucide-react';
import AppPagination, { type PaginationMeta } from '@/components/ui/AppPagination';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import api from '@/services/api';

interface Step {
  stepNumber: number;
  delayDays: number;
  subject: string;
  body: string;
}

interface Sequence {
  _id: string;
  name: string;
  description: string;
  steps: Step[];
  isActive: boolean;
  createdAt: string;
}

interface Lead {
  _id: string;
  companyName: string;
  email?: string;
}

interface Enrollment {
  _id: string;
  sequence: { _id: string; name: string; steps: Step[] };
  lead: { _id: string; companyName: string; email?: string };
  currentStep: number;
  status: string;
  nextSendAt: string;
}

const DEFAULT_PAGI: PaginationMeta = { total: 0, page: 1, limit: 10, pages: 1 };

export default function Sequences() {
  const [sequences, setSequences]       = useState<Sequence[]>([]);
  const [seqPagination, setSeqPagination] = useState<PaginationMeta>(DEFAULT_PAGI);
  const [seqSearch, setSeqSearch]       = useState('');
  const [seqPage, setSeqPage]           = useState(1);

  const [enrollments, setEnrollments]   = useState<Enrollment[]>([]);
  const [enrPagination, setEnrPagination] = useState<PaginationMeta>(DEFAULT_PAGI);
  const [enrPage, setEnrPage]           = useState(1);
  const [enrStatus, setEnrStatus]       = useState('all');

  const [leads, setLeads]               = useState<Lead[]>([]);
  const [loading, setLoading]           = useState(true);
  const [enrLoading, setEnrLoading]     = useState(false);
  const [activeTab, setActiveTab]       = useState<'sequences' | 'enrollments'>('sequences');

  const [showCreate, setShowCreate]     = useState(false);
  const [newName, setNewName]           = useState('');
  const [newDesc, setNewDesc]           = useState('');
  const [newSteps, setNewSteps]         = useState<Step[]>([{ stepNumber: 1, delayDays: 0, subject: '', body: '' }]);
  const [creating, setCreating]         = useState(false);

  const [enrollSeqId, setEnrollSeqId]   = useState('');
  const [enrollLeadId, setEnrollLeadId] = useState('');
  const [enrolling, setEnrolling]       = useState(false);
  const [enrollAlert, setEnrollAlert]   = useState('');
  const [expandedId, setExpandedId]     = useState<string | null>(null);

  const fetchSequences = useCallback(async (page = seqPage, q = seqSearch) => {
    setLoading(true);
    try {
      const [seqRes, leadsRes] = await Promise.all([
        api.get('/sequences', { params: { page, limit: 10, search: q || undefined } }),
        api.get('/leads', { params: { limit: 100 } }),
      ]);
      setSequences(Array.isArray(seqRes.data?.data) ? seqRes.data.data : []);
      setSeqPagination(seqRes.data?.pagination || DEFAULT_PAGI);
      setLeads(Array.isArray(leadsRes.data?.data) ? leadsRes.data.data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [seqPage, seqSearch]);

  const fetchEnrollments = useCallback(async (page = enrPage, status = enrStatus) => {
    setEnrLoading(true);
    try {
      const res = await api.get('/sequences/enrollments/all', {
        params: { page, limit: 10, status: status !== 'all' ? status : undefined },
      });
      setEnrollments(Array.isArray(res.data?.data) ? res.data.data : []);
      setEnrPagination(res.data?.pagination || DEFAULT_PAGI);
    } catch (err) { console.error(err); }
    finally { setEnrLoading(false); }
  }, [enrPage, enrStatus]);

  useEffect(() => { fetchSequences(seqPage, seqSearch); }, [seqPage]);
  useEffect(() => { fetchSequences(1, seqSearch); setSeqPage(1); }, [seqSearch]);
  useEffect(() => { if (activeTab === 'enrollments') fetchEnrollments(enrPage, enrStatus); }, [enrPage, enrStatus, activeTab]);

  const addStep = () => {
    setNewSteps((prev) => [...prev, { stepNumber: prev.length + 1, delayDays: 1, subject: '', body: '' }]);
  };

  const removeStep = (idx: number) => {
    setNewSteps((prev) => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepNumber: i + 1 })));
  };

  const updateStep = (idx: number, field: keyof Step, value: string | number) => {
    setNewSteps((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const handleCreate = async () => {
    if (!newName.trim() || newSteps.some((s) => !s.subject.trim() || !s.body.trim())) return;
    setCreating(true);
    try {
      await api.post('/sequences', { name: newName, description: newDesc, steps: newSteps });
      setShowCreate(false); setNewName(''); setNewDesc('');
      setNewSteps([{ stepNumber: 1, delayDays: 0, subject: '', body: '' }]);
      fetchSequences(seqPage, seqSearch);
    } catch (err) { console.error(err); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this sequence and all its enrollments?')) return;
    try { await api.delete(`/sequences/${id}`); fetchSequences(seqPage, seqSearch); } catch (err) { console.error(err); }
  };

  const handleEnroll = async () => {
    if (!enrollSeqId || !enrollLeadId) return;
    setEnrolling(true); setEnrollAlert('');
    try {
      await api.post(`/sequences/${enrollSeqId}/enroll`, { leadId: enrollLeadId });
      setEnrollAlert('Lead enrolled successfully!');
      setEnrollLeadId('');
      fetchSequences(seqPage, seqSearch);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setEnrollAlert(err?.response?.data?.message || 'Failed to enroll');
    } finally { setEnrolling(false); }
  };

  const handlePause = async (enrollmentId: string, currentStatus: string) => {
    try {
      await api.patch(`/sequences/enrollments/${enrollmentId}`, { status: currentStatus === 'active' ? 'paused' : 'active' });
      fetchSequences(seqPage, seqSearch);
    } catch (err) { console.error(err); }
  };

  const statusStyleMap: Record<string, { bg: string; text: string }> = {
    active:       { bg: 'rgba(31,178,166,0.12)',  text: '#1FB2A6' },
    paused:       { bg: 'rgba(201,138,30,0.14)',  text: '#C98A1E' },
    completed:    { bg: 'rgba(62,142,90,0.12)',   text: '#3E8E5A' },
    unsubscribed: { bg: 'rgba(194,59,46,0.12)',   text: '#C23B2E' },
  };
  const getStatusStyle = (s: string) => statusStyleMap[s] || { bg: 'rgba(110,125,121,0.1)', text: '#6E7D79' };

  const labelSt: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6E7D79' };
  const inputSt: React.CSSProperties = { borderRadius: 4, border: '1px solid #CBD3CF', fontSize: 13 };

  return (
    <div className="space-y-5 p-6" style={{ background: '#E6E9E5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, borderTop: '3px solid #1FB2A6', padding: '20px 24px' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GitBranch className="h-4 w-4" style={{ color: '#1FB2A6' }} />
              <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1FB2A6' }}>Automation</span>
            </div>
            <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1B1F2B', marginBottom: 4 }}>Email Sequences</h1>
            <p style={{ fontSize: 13, color: '#6E7D79' }}>Automated drip campaigns for your leads</p>
          </div>
          <button
            className="h-9 px-4 gap-2 flex items-center text-sm font-semibold text-white"
            style={{ background: '#1FB2A6', borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" }}
            onClick={() => setShowCreate((v) => !v)}
          >
            <Plus className="h-3.5 w-3.5" /> New Sequence
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="p-5 space-y-4" style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, borderTop: '3px solid #1FB2A6' }}>
          <h3 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, fontWeight: 600, textTransform: 'uppercase', color: '#1B1F2B' }}>Create Sequence</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label style={labelSt}>Name *</Label>
              <Input className="h-9 text-sm" style={inputSt} placeholder="e.g. Cold Outreach" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label style={labelSt}>Description</Label>
              <Input className="h-9 text-sm" style={inputSt} placeholder="Optional description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label style={labelSt}>Steps</Label>
              <button
                className="h-7 px-2.5 text-xs font-semibold gap-1 flex items-center"
                style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, color: '#1FB2A6', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" }}
                onClick={addStep}
              >
                <Plus className="h-3 w-3" /> Add Step
              </button>
            </div>
            {newSteps.map((step, idx) => (
              <div key={idx} className="p-4 space-y-3" style={{ background: 'rgba(203,211,207,0.2)', border: '1px solid #CBD3CF', borderRadius: 4 }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', color: '#6E7D79' }}>Step {step.stepNumber}</span>
                  {newSteps.length > 1 && (
                    <button onClick={() => removeStep(idx)} style={{ color: '#C23B2E', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label style={labelSt}>Delay (days)</Label>
                    <Input type="number" min={0} className="h-8 text-sm" style={inputSt} value={step.delayDays} onChange={(e) => updateStep(idx, 'delayDays', Number(e.target.value))} />
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {[0, 1, 3, 7, 14, 30].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => updateStep(idx, 'delayDays', d)}
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            background: step.delayDays === d ? '#1FB2A6' : '#F1F4F0',
                            color: step.delayDays === d ? '#fff' : '#6E7D79',
                            border: step.delayDays === d ? '1px solid #1FB2A6' : '1px solid #CBD3CF',
                          }}
                        >
                          {d === 0 ? 'Now' : `${d}d`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label style={labelSt}>Subject *</Label>
                    <Input className="h-8 text-sm" style={inputSt} placeholder="Email subject..." value={step.subject} onChange={(e) => updateStep(idx, 'subject', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label style={labelSt}>Body *</Label>
                  <Textarea className="text-sm resize-none" style={inputSt} rows={4} placeholder="Email body HTML or plain text..." value={step.body} onChange={(e) => updateStep(idx, 'body', e.target.value)} />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              className="h-9 px-4 text-sm font-semibold text-white gap-2 flex items-center"
              style={{ background: '#1FB2A6', borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif", opacity: creating ? 0.7 : 1 }}
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create Sequence'}
            </button>
            <button
              className="h-9 px-4 text-sm font-semibold"
              style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, color: '#6E7D79', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" }}
              onClick={() => setShowCreate(false)}
            >Cancel</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 w-fit" style={{ background: 'rgba(203,211,207,0.4)', borderRadius: 4, border: '1px solid #CBD3CF' }}>
        {(['sequences', 'enrollments'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              padding: '6px 16px',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "'IBM Plex Sans', sans-serif",
              cursor: 'pointer',
              border: 'none',
              background: activeTab === t ? '#F1F4F0' : 'transparent',
              color: activeTab === t ? '#1B1F2B' : '#6E7D79',
              boxShadow: activeTab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {t === 'sequences' ? 'Sequences' : 'Enrollments'}
          </button>
        ))}
      </div>

      {/* Search bar (sequences tab only) */}
      {activeTab === 'sequences' && (
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: '#9CADB0' }} />
          <Input
            value={seqSearch}
            onChange={(e) => setSeqSearch(e.target.value)}
            placeholder="Search sequences..."
            className="pl-8 h-9 text-sm"
            style={inputSt}
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(31,178,166,0.3)', borderTopColor: '#1FB2A6' }} />
        </div>
      ) : activeTab === 'sequences' ? (
        <div className="space-y-3">
          {sequences.length === 0 ? (
            <div className="p-16 flex flex-col items-center gap-3" style={{ background: '#F1F4F0', border: '1px dashed #CBD3CF', borderRadius: 4 }}>
              <div className="h-14 w-14 flex items-center justify-center" style={{ background: 'rgba(31,178,166,0.08)', borderRadius: 4 }}>
                <GitBranch className="h-6 w-6" style={{ color: '#6E7D79' }} />
              </div>
              <p style={{ fontSize: 13, color: '#6E7D79' }}>No sequences yet. Create one to get started.</p>
            </div>
          ) : (<>{sequences.map((seq) => (
            <div key={seq._id} style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, overflow: 'hidden', borderTop: '3px solid #1FB2A6' }}>
              <div className="flex items-center justify-between px-5 py-4 cursor-pointer" onClick={() => setExpandedId(expandedId === seq._id ? null : seq._id)}>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 flex items-center justify-center" style={{ background: 'rgba(31,178,166,0.1)', borderRadius: 4 }}>
                    <GitBranch className="h-4 w-4" style={{ color: '#1FB2A6' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1B1F2B', fontFamily: "'IBM Plex Sans', sans-serif" }}>{seq.name}</p>
                    <p style={{ fontSize: 11, color: '#6E7D79', marginTop: 1 }}>{seq.steps.length} step{seq.steps.length !== 1 ? 's' : ''} · {seq.description || 'No description'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10.5,
                    textTransform: 'uppercase',
                    padding: '3px 9px',
                    borderRadius: 10,
                    background: seq.isActive ? 'rgba(31,178,166,0.12)' : 'rgba(194,59,46,0.12)',
                    color: seq.isActive ? '#1FB2A6' : '#C23B2E',
                  }}>
                    {seq.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(seq._id); }}
                    className="h-7 w-7 flex items-center justify-center transition-colors"
                    style={{ borderRadius: 4, background: 'rgba(194,59,46,0.08)', border: '1px solid rgba(194,59,46,0.2)', color: '#C23B2E', cursor: 'pointer' }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  {expandedId === seq._id ? <ChevronUp className="h-4 w-4" style={{ color: '#6E7D79' }} /> : <ChevronDown className="h-4 w-4" style={{ color: '#6E7D79' }} />}
                </div>
              </div>

              {expandedId === seq._id && (
                <div className="px-5 py-4 space-y-3" style={{ borderTop: '1px solid #CBD3CF' }}>
                  {seq.steps.map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-7 w-7 flex items-center justify-center text-xs font-bold text-white" style={{ background: '#1FB2A6', borderRadius: 4 }}>{step.stepNumber}</div>
                        {i < seq.steps.length - 1 && <div className="flex-1 w-px my-1" style={{ background: '#CBD3CF' }} />}
                      </div>
                      <div className="flex-1 pb-3">
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#1B1F2B' }}>{step.subject}</p>
                        <p style={{ fontSize: 11, color: '#6E7D79', marginTop: 2 }}>Send after {step.delayDays} day{step.delayDays !== 1 ? 's' : ''}</p>
                        <p style={{ fontSize: 11, color: '#6E7D79', marginTop: 4 }} className="line-clamp-2">{step.body}</p>
                      </div>
                    </div>
                  ))}

                  <div className="p-3 space-y-2" style={{ background: 'rgba(203,211,207,0.2)', border: '1px solid #CBD3CF', borderRadius: 4 }}>
                    <p className="flex items-center gap-1.5" style={labelSt}><Users className="h-3 w-3" /> Enroll a Lead</p>
                    {enrollAlert && enrollSeqId === seq._id && (
                      <p style={{ fontSize: 12, color: enrollAlert.includes('success') ? '#1FB2A6' : '#C23B2E' }}>{enrollAlert}</p>
                    )}
                    <div className="flex gap-2">
                      <Select value={enrollSeqId === seq._id ? enrollLeadId : ''} onValueChange={(v) => { setEnrollSeqId(seq._id); setEnrollLeadId(v); setEnrollAlert(''); }}>
                        <SelectTrigger className="h-8 text-xs flex-1" style={inputSt}>
                          <SelectValue placeholder="Select lead..." />
                        </SelectTrigger>
                        <SelectContent style={{ borderRadius: 4 }}>
                          {leads.map((l) => (
                            <SelectItem key={l._id} value={l._id}>{l.companyName} {l.email ? `(${l.email})` : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button
                        className="h-8 px-3 text-xs font-semibold text-white gap-1.5 flex items-center"
                        style={{ background: '#1FB2A6', borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif", opacity: (enrolling || enrollSeqId !== seq._id || !enrollLeadId) ? 0.5 : 1 }}
                        onClick={() => { setEnrollSeqId(seq._id); handleEnroll(); }}
                        disabled={enrolling || enrollSeqId !== seq._id || !enrollLeadId}
                      >
                        <Play className="h-3 w-3" /> Enroll
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}</>)}
          <AppPagination
            pagination={seqPagination}
            onPageChange={(p) => setSeqPage(p)}
            className="pt-1"
          />
        </div>
      ) : (
        <div style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #CBD3CF' }}>
            <h3 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, fontWeight: 600, textTransform: 'uppercase', color: '#1B1F2B' }}>Active Enrollments</h3>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: '#6E7D79', marginTop: 2 }}>{enrPagination.total.toLocaleString()} total</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #CBD3CF', background: 'rgba(203,211,207,0.3)' }}>
                {['Lead', 'Sequence', 'Step', 'Next Send', 'Status', ''].map((h, i) => (
                  <th key={i} className="text-left px-5 py-3" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6E7D79' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enrollments.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12" style={{ fontSize: 13, color: '#6E7D79' }}>No enrollments yet</td></tr>
              ) : enrollments.map((enr, idx) => {
                const st = getStatusStyle(enr.status);
                return (
                  <tr
                    key={enr._id}
                    style={{ borderBottom: idx === enrollments.length - 1 ? 'none' : '1px solid #CBD3CF', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(154,198,232,0.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="px-5 py-3">
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1B1F2B', fontFamily: "'IBM Plex Sans', sans-serif" }}>{enr.lead?.companyName || '—'}</p>
                      {enr.lead?.email && <p style={{ fontSize: 11, color: '#6E7D79' }}>{enr.lead.email}</p>}
                    </td>
                    <td className="px-5 py-3" style={{ fontSize: 13, color: '#6E7D79' }}>{enr.sequence?.name || '—'}</td>
                    <td className="px-5 py-3" style={{ fontSize: 13, color: '#1B1F2B' }}>
                      {enr.currentStep + 1} / {enr.sequence?.steps?.length || '?'}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#6E7D79' }}>
                      {enr.nextSendAt ? new Date(enr.nextSendAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, textTransform: 'uppercase', padding: '3px 9px', borderRadius: 10, background: st.bg, color: st.text }}>
                        {enr.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {(enr.status === 'active' || enr.status === 'paused') && (
                        <button
                          onClick={() => handlePause(enr._id, enr.status)}
                          className="h-7 w-7 flex items-center justify-center transition-colors"
                          style={{ borderRadius: 4, background: '#F1F4F0', border: '1px solid #CBD3CF', color: '#6E7D79', cursor: 'pointer' }}
                        >
                          {enr.status === 'active' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {enrPagination.pages > 1 && (
            <div style={{ borderTop: '1px solid #CBD3CF', padding: '0 20px' }}>
              <AppPagination
                pagination={enrPagination}
                onPageChange={(p) => setEnrPage(p)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

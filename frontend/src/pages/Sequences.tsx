import { useEffect, useState, useCallback } from 'react';
import { GitBranch, Plus, Trash2, Play, Pause, Users, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
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

export default function Sequences() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sequences' | 'enrollments'>('sequences');

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSteps, setNewSteps] = useState<Step[]>([{ stepNumber: 1, delayDays: 0, subject: '', body: '' }]);
  const [creating, setCreating] = useState(false);

  const [enrollSeqId, setEnrollSeqId] = useState('');
  const [enrollLeadId, setEnrollLeadId] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [enrollAlert, setEnrollAlert] = useState('');

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [seqRes, enrRes, leadsRes] = await Promise.all([
        api.get('/sequences'),
        api.get('/sequences/enrollments/all'),
        api.get('/leads', { params: { limit: 100 } }),
      ]);
      setSequences(Array.isArray(seqRes.data?.data) ? seqRes.data.data : []);
      setEnrollments(Array.isArray(enrRes.data?.data) ? enrRes.data.data : []);
      setLeads(Array.isArray(leadsRes.data?.data) ? leadsRes.data.data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

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
      fetchAll();
    } catch (err) { console.error(err); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this sequence and all its enrollments?')) return;
    try { await api.delete(`/sequences/${id}`); fetchAll(); } catch (err) { console.error(err); }
  };

  const handleEnroll = async () => {
    if (!enrollSeqId || !enrollLeadId) return;
    setEnrolling(true); setEnrollAlert('');
    try {
      await api.post(`/sequences/${enrollSeqId}/enroll`, { leadId: enrollLeadId });
      setEnrollAlert('Lead enrolled successfully!');
      setEnrollLeadId('');
      fetchAll();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setEnrollAlert(err?.response?.data?.message || 'Failed to enroll');
    } finally { setEnrolling(false); }
  };

  const handlePause = async (enrollmentId: string, currentStatus: string) => {
    try {
      await api.patch(`/sequences/enrollments/${enrollmentId}`, { status: currentStatus === 'active' ? 'paused' : 'active' });
      fetchAll();
    } catch (err) { console.error(err); }
  };

  const statusColor: Record<string, string> = {
    active: 'text-emerald-600 bg-emerald-50',
    paused: 'text-amber-600 bg-amber-50',
    completed: 'text-green-600 bg-green-50',
    unsubscribed: 'text-rose-600 bg-rose-50',
  };

  return (
    <div className="space-y-5 p-6">
      <div className="page-header">
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GitBranch className="h-4 w-4" style={{ color: '#0D9C6A' }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#0D9C6A' }}>Automation</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-gradient mb-1">Email Sequences</h1>
            <p className="text-sm text-muted-foreground font-medium">Automated drip campaigns for your leads</p>
          </div>
          <Button
            className="h-9 rounded-xl text-sm font-semibold text-gray-900 gap-2"
            style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}
            onClick={() => setShowCreate((v) => !v)}
          >
            <Plus className="h-3.5 w-3.5" /> New Sequence
          </Button>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="rounded-xl border border-border bg-card shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold">Create Sequence</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name *</Label>
              <Input className="h-9 rounded-xl border-border/60 text-sm" placeholder="e.g. Cold Outreach" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</Label>
              <Input className="h-9 rounded-xl border-border/60 text-sm" placeholder="Optional description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Steps</Label>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-border/60" onClick={addStep}>
                <Plus className="h-3 w-3" /> Add Step
              </Button>
            </div>
            {newSteps.map((step, idx) => (
              <div key={idx} className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Step {step.stepNumber}</span>
                  {newSteps.length > 1 && (
                    <button onClick={() => removeStep(idx)} className="text-rose-400 hover:text-rose-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Delay (days)</Label>
                    <Input type="number" min={0} className="h-8 rounded-lg border-border/60 text-sm" value={step.delayDays} onChange={(e) => updateStep(idx, 'delayDays', Number(e.target.value))} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs text-muted-foreground">Subject *</Label>
                    <Input className="h-8 rounded-lg border-border/60 text-sm" placeholder="Email subject..." value={step.subject} onChange={(e) => updateStep(idx, 'subject', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Body *</Label>
                  <Textarea className="rounded-lg border-border/60 text-sm resize-none" rows={4} placeholder="Email body HTML or plain text..." value={step.body} onChange={(e) => updateStep(idx, 'body', e.target.value)} />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button className="h-9 rounded-xl text-sm font-semibold text-gray-900 gap-2" style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }} onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating...' : 'Create Sequence'}
            </Button>
            <Button variant="outline" className="h-9 rounded-xl text-sm border-border/60" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/60 w-fit">
        {(['sequences', 'enrollments'] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all', activeTab === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>
            {t === 'sequences' ? 'Sequences' : 'Enrollments'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(33,246,168,0.3)', borderTopColor: '#21F6A8' }} />
        </div>
      ) : activeTab === 'sequences' ? (
        <div className="space-y-3">
          {sequences.length === 0 ? (
            <div className="rounded-xl border border-border bg-card shadow-sm p-16 flex flex-col items-center gap-3">
              <div className="h-14 w-14 rounded-xl flex items-center justify-center" style={{ background: 'rgba(33,246,168,0.06)' }}>
                <GitBranch className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">No sequences yet. Create one to get started.</p>
            </div>
          ) : sequences.map((seq) => (
            <div key={seq._id} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 cursor-pointer" onClick={() => setExpandedId(expandedId === seq._id ? null : seq._id)}>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(33,246,168,0.08)' }}>
                    <GitBranch className="h-4 w-4" style={{ color: '#0D9C6A' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{seq.name}</p>
                    <p className="text-xs text-muted-foreground">{seq.steps.length} step{seq.steps.length !== 1 ? 's' : ''} · {seq.description || 'No description'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', seq.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}>
                    {seq.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(seq._id); }} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-rose-50 text-muted-foreground hover:text-rose-600 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  {expandedId === seq._id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>

              {expandedId === seq._id && (
                <div className="border-t border-border/40 px-5 py-4 space-y-3">
                  {seq.steps.map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-gray-900" style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}>{step.stepNumber}</div>
                        {i < seq.steps.length - 1 && <div className="flex-1 w-px bg-border/40 my-1" />}
                      </div>
                      <div className="flex-1 pb-3">
                        <p className="text-sm font-medium">{step.subject}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Send after {step.delayDays} day{step.delayDays !== 1 ? 's' : ''}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{step.body}</p>
                      </div>
                    </div>
                  ))}

                  <div className="rounded-xl border border-border/40 bg-muted/20 p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"><Users className="h-3 w-3" /> Enroll a Lead</p>
                    {enrollAlert && enrollSeqId === seq._id && (
                      <p className={cn('text-xs', enrollAlert.includes('success') ? 'text-emerald-600' : 'text-rose-600')}>{enrollAlert}</p>
                    )}
                    <div className="flex gap-2">
                      <Select value={enrollSeqId === seq._id ? enrollLeadId : ''} onValueChange={(v) => { setEnrollSeqId(seq._id); setEnrollLeadId(v); setEnrollAlert(''); }}>
                        <SelectTrigger className="h-8 rounded-lg border-border/60 text-xs flex-1">
                          <SelectValue placeholder="Select lead..." />
                        </SelectTrigger>
                        <SelectContent>
                          {leads.map((l) => (
                            <SelectItem key={l._id} value={l._id}>{l.companyName} {l.email ? `(${l.email})` : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" className="h-8 rounded-lg text-xs font-semibold text-gray-900 gap-1.5" style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}
                        onClick={() => { setEnrollSeqId(seq._id); handleEnroll(); }} disabled={enrolling || enrollSeqId !== seq._id || !enrollLeadId}>
                        <Play className="h-3 w-3" /> Enroll
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border/60">
            <h3 className="text-sm font-semibold">Active Enrollments</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{enrollments.length} total</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border) / 0.6)', background: 'hsl(var(--muted) / 0.4)' }}>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">Lead</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">Sequence</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">Step</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">Next Send</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {enrollments.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">No enrollments yet</td></tr>
              ) : enrollments.map((enr, idx) => (
                <tr key={enr._id} className="hover:bg-muted/30 transition-colors" style={{ borderBottom: idx === enrollments.length - 1 ? 'none' : '1px solid hsl(var(--border) / 0.4)' }}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-sm">{enr.lead?.companyName || '—'}</p>
                    {enr.lead?.email && <p className="text-xs text-muted-foreground">{enr.lead.email}</p>}
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{enr.sequence?.name || '—'}</td>
                  <td className="px-5 py-3 text-sm">
                    {enr.currentStep + 1} / {enr.sequence?.steps?.length || '?'}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {enr.nextSendAt ? new Date(enr.nextSendAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full capitalize', statusColor[enr.status] || 'bg-muted text-muted-foreground')}>
                      {enr.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {(enr.status === 'active' || enr.status === 'paused') && (
                      <button onClick={() => handlePause(enr._id, enr.status)} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors">
                        {enr.status === 'active' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, MessageSquare, Clock,
  Brain, Zap, CalendarClock, RefreshCw, Sparkles, Globe, StickyNote, Search,
  CheckCircle, XCircle, Tag, X, Plus, Pencil,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import api from '@/services/api';
import { cn } from '@/lib/utils';

interface Lead {
  _id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  website?: string;
  industry?: string;
  budget?: string;
  status: string;
  source: string;
  tags?: string[];
  description?: string;
  aiScore?: number;
  aiQualification?: 'hot' | 'warm' | 'cold';
  aiRecommendedService?: string;
  aiPainPoints?: string[];
  aiSummary?: string;
  followUpScheduled?: string;
  followUpSent?: boolean;
  notes?: string;
}

interface OutreachLog {
  _id: string;
  type: string;
  status: string;
  subject?: string;
  message?: string;
  to?: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-emerald-50 text-emerald-700',
  contacted: 'bg-amber-50 text-amber-700',
  proposal_sent: 'bg-violet-50 text-violet-700',
  follow_up: 'bg-indigo-50 text-indigo-700',
  converted: 'bg-emerald-50 text-emerald-700',
  lost: 'bg-rose-50 text-rose-700',
};

const QUAL_STYLES: Record<string, string> = {
  hot: 'bg-rose-50 text-rose-700 border-rose-200',
  warm: 'bg-amber-50 text-amber-700 border-amber-200',
  cold: 'bg-sky-50 text-sky-700 border-sky-200',
};

const QUAL_EMOJI: Record<string, string> = { hot: '🔥', warm: '⚡', cold: '❄️' };

const STATUSES = ['new', 'contacted', 'proposal_sent', 'follow_up', 'converted', 'lost'];

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 border-b border-border/40 last:border-0">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-sm font-medium text-foreground">{value || '—'}</span>
    </div>
  );
}

function AlertMsg({ msg, success }: { msg: string; success?: boolean }) {
  return (
    <div className={cn(
      'flex items-center gap-2.5 text-sm rounded-xl p-3 border',
      success ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200',
    )}>
      {success
        ? <CheckCircle className="h-4 w-4 shrink-0" />
        : <XCircle className="h-4 w-4 shrink-0" />}
      {msg}
    </div>
  );
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg, setEmailMsg] = useState('');

  const [waPhone, setWaPhone] = useState('');
  const [waMessage, setWaMessage] = useState('');
  const [waLoading, setWaLoading] = useState(false);
  const [waMsg, setWaMsg] = useState('');

  const [history, setHistory] = useState<OutreachLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [followUpDays, setFollowUpDays] = useState('3');
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpMsg, setFollowUpMsg] = useState('');

  const [autoReplyInput, setAutoReplyInput] = useState('');
  const [autoReplyLoading, setAutoReplyLoading] = useState(false);
  const [autoReplyDraft, setAutoReplyDraft] = useState<{ subject: string; body: string } | null>(null);

  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  interface WebsiteAnalysis {
    businessType: string;
    techStack: string[];
    painPoints: string[];
    opportunities: string[];
    recommendedService: string;
    pitchAngle: string;
    score: number;
  }
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteAnalysis, setWebsiteAnalysis] = useState<WebsiteAnalysis | null>(null);
  const [websiteLoading, setWebsiteLoading] = useState(false);

  const [enrichLoading, setEnrichLoading] = useState(false);
  const [enrichMsg, setEnrichMsg] = useState('');

  // Tags
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tagsSaving, setTagsSaving] = useState(false);

  // Edit lead dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ companyName: '', contactName: '', email: '', phone: '', website: '', industry: '', budget: '', description: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchLead = () => {
    if (!id) return;
    api.get(`/leads/${id}`)
      .then((res) => {
        const l = res.data?.data || res.data;
        setLead(l);
        setWaPhone(l?.phone || '');
        setNotes(l?.notes || '');
        setWebsiteUrl(l?.website || '');
        setTags(Array.isArray(l?.tags) ? l.tags : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const openEdit = () => {
    if (!lead) return;
    setEditForm({
      companyName: lead.companyName || '',
      contactName: lead.contactName || '',
      email: lead.email || '',
      phone: lead.phone || '',
      website: lead.website || '',
      industry: lead.industry || '',
      budget: lead.budget || '',
      description: lead.description || '',
    });
    setEditError('');
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editForm.companyName.trim()) { setEditError('Company name is required.'); return; }
    setEditSaving(true); setEditError('');
    try {
      const res = await api.put(`/leads/${id}`, editForm);
      setLead(res.data?.data || { ...lead!, ...editForm });
      setWebsiteUrl(editForm.website);
      setEditOpen(false);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setEditError(err?.response?.data?.message || 'Failed to save changes.');
    } finally { setEditSaving(false); }
  };

  useEffect(() => { fetchLead(); }, [id]);

  const fetchHistory = () => {
    if (!id) return;
    setHistoryLoading(true);
    api.get(`/outreach/history/${id}`)
      .then((res) => setHistory(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(console.error)
      .finally(() => setHistoryLoading(false));
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;
    setStatusUpdating(true);
    try {
      const res = await api.put(`/leads/${id}`, { status: newStatus });
      setLead(res.data?.data || { ...lead!, status: newStatus });
    } catch (e) { console.error(e); }
    finally { setStatusUpdating(false); }
  };

  const handleSendEmail = async () => {
    if (!id || !emailSubject.trim() || !emailMessage.trim()) {
      setEmailMsg('Subject and message are required.'); return;
    }
    setEmailLoading(true); setEmailMsg('');
    try {
      await api.post('/outreach/email', { leadId: id, subject: emailSubject, message: emailMessage });
      setEmailMsg('Email sent successfully!');
      setEmailSubject(''); setEmailMessage('');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setEmailMsg(err?.response?.data?.message || 'Failed to send email.');
    } finally { setEmailLoading(false); }
  };

  const handleSendWhatsApp = async () => {
    if (!id || !waMessage.trim()) { setWaMsg('Message is required.'); return; }
    setWaLoading(true); setWaMsg('');
    try {
      await api.post('/outreach/whatsapp', { leadId: id, message: waMessage, to: waPhone });
      setWaMsg('WhatsApp message sent successfully!');
      setWaMessage('');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setWaMsg(err?.response?.data?.message || 'Failed to send WhatsApp message.');
    } finally { setWaLoading(false); }
  };

  const handleAnalyze = async () => {
    if (!id) return;
    setAnalyzeLoading(true);
    try {
      const res = await api.post(`/leads/${id}/analyze`);
      setLead(res.data?.data);
    } catch (e) { console.error(e); }
    finally { setAnalyzeLoading(false); }
  };

  const handleScheduleFollowUp = async () => {
    if (!id) return;
    setFollowUpLoading(true); setFollowUpMsg('');
    try {
      const res = await api.post(`/leads/${id}/schedule-followup`, { daysFromNow: followUpDays });
      setFollowUpMsg(res.data?.message || 'Follow-up scheduled!');
      setLead((prev) => prev ? { ...prev, followUpScheduled: res.data?.data?.followUpScheduled } : prev);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setFollowUpMsg(err?.response?.data?.message || 'Failed to schedule.');
    } finally { setFollowUpLoading(false); }
  };

  const handleAutoReply = async () => {
    if (!id || !autoReplyInput.trim()) return;
    setAutoReplyLoading(true); setAutoReplyDraft(null);
    try {
      const res = await api.post(`/leads/${id}/auto-reply`, { message: autoReplyInput });
      setAutoReplyDraft(res.data?.data);
    } catch (e) { console.error(e); }
    finally { setAutoReplyLoading(false); }
  };

  const applyAutoReply = () => {
    if (!autoReplyDraft) return;
    setEmailSubject(autoReplyDraft.subject);
    setEmailMessage(autoReplyDraft.body);
    setAutoReplyDraft(null);
    setAutoReplyInput('');
  };

  const handleSaveNotes = async () => {
    if (!id) return;
    setNotesSaving(true); setNotesSaved(false);
    try {
      await api.put(`/leads/${id}/notes`, { notes });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch (e) { console.error(e); }
    finally { setNotesSaving(false); }
  };

  const handleEnrichEmail = async () => {
    if (!id) return;
    setEnrichLoading(true); setEnrichMsg('');
    try {
      const res = await api.post(`/leads/${id}/enrich-email`);
      setEnrichMsg(res.data?.message || 'Email found!');
      fetchLead();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setEnrichMsg(err?.response?.data?.message || 'No email found for this domain.');
    } finally { setEnrichLoading(false); }
  };

  const handleWebsiteAnalyze = async () => {
    if (!id || !websiteUrl.trim()) return;
    setWebsiteLoading(true); setWebsiteAnalysis(null);
    try {
      const res = await api.post(`/leads/${id}/analyze-website`, { url: websiteUrl });
      setWebsiteAnalysis(res.data?.data);
    } catch (e) { console.error(e); }
    finally { setWebsiteLoading(false); }
  };

  const saveTags = async (newTags: string[]) => {
    if (!id) return;
    setTagsSaving(true);
    try {
      await api.put(`/leads/${id}`, { tags: newTags });
      setTags(newTags);
      setLead((prev) => prev ? { ...prev, tags: newTags } : prev);
    } catch (e) { console.error(e); }
    finally { setTagsSaving(false); }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed || tags.includes(trimmed)) { setTagInput(''); return; }
    const newTags = [...tags, trimmed];
    setTagInput('');
    saveTags(newTags);
  };

  const handleRemoveTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag);
    saveTags(newTags);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-32 rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-2xl border border-border/60 shadow-card overflow-hidden">
              <div className="h-0.5 bg-muted" />
              <div className="p-5 space-y-3">{[...Array(7)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}</div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-border/60 shadow-card overflow-hidden">
              <div className="p-5 space-y-3">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-6 flex flex-col items-center justify-center py-20 text-center">
        <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(33,246,168,0.08)' }}>
          <XCircle className="h-7 w-7 text-muted-foreground/40" />
        </div>
        <h2 className="text-base font-semibold text-foreground mb-1">Lead not found</h2>
        <p className="text-sm text-muted-foreground mb-4">This lead may have been deleted or doesn't exist.</p>
        <Button
          size="sm"
          className="h-9 rounded-xl gap-2 text-sm font-semibold text-gray-900"
          style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}
          onClick={() => navigate('/leads')}
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Leads
        </Button>
      </div>
    );
  }

  const score = lead.aiScore ?? null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/leads')}
          className="h-8 rounded-xl gap-2 text-sm font-medium hover:bg-muted/60 -ml-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Leads
        </Button>
        <span className="text-muted-foreground/40 text-xs">·</span>
        <span className="text-sm font-semibold text-foreground">{lead.companyName}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        {/* Left: Lead Info */}
        <div className="space-y-4">
          <Card className="border border-border/60 shadow-card overflow-hidden">
            <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #21F6A8, #10B981)' }} />
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base font-semibold">{lead.companyName}</CardTitle>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full', STATUS_COLORS[lead.status] || 'bg-slate-50 text-slate-600')}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                    {lead.status?.replace(/_/g, ' ')}
                  </span>
                  <button onClick={openEdit} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Edit lead">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-0 pb-4 px-5">
              <InfoRow label="Contact" value={lead.contactName} />
              <div className="flex flex-col gap-0.5 py-2 border-b border-border/40">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Email</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground flex-1">{lead.email || '—'}</span>
                  {!lead.email && lead.website && (
                    <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 rounded-lg shrink-0 gap-1 border-border/60" onClick={handleEnrichEmail} disabled={enrichLoading}>
                      <Search className="h-3 w-3" />
                      {enrichLoading ? '...' : 'Find'}
                    </Button>
                  )}
                </div>
                {enrichMsg && <p className={cn('text-xs mt-0.5', enrichMsg.includes('found') || enrichMsg.includes('Email') ? 'text-emerald-600' : 'text-rose-500')}>{enrichMsg}</p>}
              </div>
              <InfoRow label="Phone" value={lead.phone} />
              <InfoRow label="Website" value={lead.website} />
              <InfoRow label="Industry" value={lead.industry} />
              <InfoRow label="Budget" value={lead.budget} />
              <InfoRow label="Source" value={lead.source} />
              {lead.description && <InfoRow label="Description" value={lead.description} />}

              {/* Tags */}
              <div className="py-2 border-b border-border/40">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Tags</span>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(33,246,168,0.12)', color: '#0D9C6A' }}
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {tag}
                      <button
                        className="ml-0.5 hover:opacity-70 transition-opacity"
                        onClick={() => handleRemoveTag(tag)}
                        disabled={tagsSaving}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                  {tags.length === 0 && (
                    <span className="text-xs text-muted-foreground/50">No tags yet</span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <Input
                    className="h-7 rounded-lg border-border/60 text-xs flex-1"
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                    disabled={tagsSaving}
                  />
                  <button
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-900 shrink-0 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}
                    onClick={handleAddTag}
                    disabled={tagsSaving || !tagInput.trim()}
                  >
                    {tagsSaving ? (
                      <span className="h-3 w-3 border border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-3 space-y-1.5">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Change Status</Label>
                <Select value={lead.status} onValueChange={handleStatusChange} disabled={statusUpdating}>
                  <SelectTrigger className="h-9 rounded-xl border-border/60 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="text-sm capitalize">{s.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis Card */}
          <Card className="border border-border/60 shadow-card overflow-hidden">
            <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #10B981, #21F6A8)' }} />
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: 'rgba(33,246,168,0.08)' }}>
                    <Brain className="h-3.5 w-3.5" style={{ color: '#0D9C6A' }} />
                  </span>
                  AI Analysis
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs rounded-lg gap-1 hover:bg-muted/60"
                  onClick={handleAnalyze}
                  disabled={analyzeLoading}
                >
                  <RefreshCw className={cn('h-3 w-3', analyzeLoading && 'animate-spin')} />
                  {analyzeLoading ? 'Analyzing...' : 'Re-analyze'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {score === null ? (
                <p className="text-xs text-muted-foreground">
                  AI analysis pending. Click Re-analyze to run.
                </p>
              ) : (
                <>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Lead Score</span>
                      <span className="font-bold text-primary">{score}/10</span>
                    </div>
                    <Progress value={score * 10} className="h-2" />
                  </div>

                  {lead.aiQualification && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn('text-xs', QUAL_STYLES[lead.aiQualification])}>
                        {QUAL_EMOJI[lead.aiQualification]} {lead.aiQualification.toUpperCase()}
                      </Badge>
                    </div>
                  )}

                  {lead.aiRecommendedService && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Recommended Service</p>
                      <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                        <Zap className="h-3 w-3 mr-1" />
                        {lead.aiRecommendedService}
                      </Badge>
                    </div>
                  )}

                  {lead.aiSummary && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{lead.aiSummary}</p>
                  )}

                  {(lead.aiPainPoints?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Pain Points</p>
                      <ul className="space-y-1">
                        {lead.aiPainPoints!.map((p, i) => (
                          <li key={i} className="text-xs flex items-start gap-1.5">
                            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Follow-up Scheduler */}
          <Card className="border border-border/60 shadow-card overflow-hidden">
            <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #6366f1, #818cf8)' }} />
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: 'rgba(99,102,241,0.1)' }}>
                  <CalendarClock className="h-3.5 w-3.5 text-indigo-500" />
                </span>
                Schedule Follow-up
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lead.followUpScheduled && (
                <div className="flex items-center gap-2 text-xs rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 p-3">
                  {lead.followUpSent ? '✅ Follow-up sent' : `⏰ Scheduled: ${new Date(lead.followUpScheduled).toDateString()}`}
                </div>
              )}
              {followUpMsg && <AlertMsg msg={followUpMsg} success={followUpMsg.includes('cheduled')} />}
              <div className="flex gap-2">
                <Select value={followUpDays} onValueChange={setFollowUpDays}>
                  <SelectTrigger className="h-9 rounded-xl border-border/60 text-sm flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {['1', '2', '3', '5', '7', '14'].map((d) => (
                      <SelectItem key={d} value={d} className="text-sm">In {d} day{d !== '1' ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="h-9 rounded-xl text-sm font-semibold text-white gap-1.5 shrink-0"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}
                  onClick={handleScheduleFollowUp}
                  disabled={followUpLoading}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {followUpLoading ? '...' : 'Set'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Actions */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="email" onValueChange={(v) => v === 'history' && fetchHistory()}>
            <TabsList className="grid grid-cols-6 w-full h-10 rounded-xl bg-muted/60 p-1">
              <TabsTrigger value="email" className="rounded-lg text-xs font-medium gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Mail className="h-3.5 w-3.5" /><span className="hidden sm:inline">Email</span>
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="rounded-lg text-xs font-medium gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <MessageSquare className="h-3.5 w-3.5" /><span className="hidden sm:inline">WA</span>
              </TabsTrigger>
              <TabsTrigger value="autoreply" className="rounded-lg text-xs font-medium gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Sparkles className="h-3.5 w-3.5" /><span className="hidden sm:inline">AI Reply</span>
              </TabsTrigger>
              <TabsTrigger value="website" className="rounded-lg text-xs font-medium gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Globe className="h-3.5 w-3.5" /><span className="hidden sm:inline">Website</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className="rounded-lg text-xs font-medium gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <StickyNote className="h-3.5 w-3.5" /><span className="hidden sm:inline">Notes</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-lg text-xs font-medium gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Clock className="h-3.5 w-3.5" /><span className="hidden sm:inline">History</span>
              </TabsTrigger>
            </TabsList>

            {/* Email Tab */}
            <TabsContent value="email">
              <Card className="border border-border/60 shadow-card overflow-hidden">
                <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #21F6A8, #10B981)' }} />
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: 'rgba(33,246,168,0.08)' }}>
                      <Mail className="h-3.5 w-3.5" style={{ color: '#0D9C6A' }} />
                    </span>
                    Send Email
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {emailMsg && <AlertMsg msg={emailMsg} success={emailMsg.includes('success')} />}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">To</Label>
                    <Input value={lead.email || 'No email on file'} disabled className="h-9 rounded-xl border-border/60 text-sm bg-muted/40" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Subject</Label>
                    <Input className="h-9 rounded-xl border-border/60 text-sm" placeholder="Email subject..." value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Message</Label>
                    <Textarea className="rounded-xl border-border/60 text-sm resize-none" rows={5} placeholder="Write your email..." value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} />
                  </div>
                  <Button
                    className="w-full h-10 rounded-xl text-sm font-semibold text-gray-900 gap-2"
                    style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}
                    onClick={handleSendEmail}
                    disabled={emailLoading}
                  >
                    {emailLoading
                      ? <><span className="h-3.5 w-3.5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" /> Sending...</>
                      : <><Mail className="h-4 w-4" /> Send Email</>}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* WhatsApp Tab */}
            <TabsContent value="whatsapp">
              <Card className="border border-border/60 shadow-card overflow-hidden">
                <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #7C3AED, #a78bfa)' }} />
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: 'rgba(124,58,237,0.1)' }}>
                      <MessageSquare className="h-3.5 w-3.5 text-violet-500" />
                    </span>
                    Send WhatsApp
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {waMsg && <AlertMsg msg={waMsg} success={waMsg.includes('success')} />}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone Number</Label>
                    <Input className="h-9 rounded-xl border-border/60 text-sm" placeholder="+923001234567" value={waPhone} onChange={(e) => setWaPhone(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Message</Label>
                    <Textarea className="rounded-xl border-border/60 text-sm resize-none" rows={5} placeholder="Write your message..." value={waMessage} onChange={(e) => setWaMessage(e.target.value)} />
                  </div>
                  <Button
                    className="w-full h-10 rounded-xl text-sm font-semibold gap-2"
                    style={{ background: 'linear-gradient(135deg, #7C3AED, #a78bfa)', color: 'white' }}
                    onClick={handleSendWhatsApp}
                    disabled={waLoading}
                  >
                    {waLoading
                      ? <><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                      : <><MessageSquare className="h-4 w-4" /> Send WhatsApp</>}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Auto Reply Tab */}
            <TabsContent value="autoreply">
              <Card className="border border-border/60 shadow-card overflow-hidden">
                <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #21F6A8, #10B981)' }} />
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: 'rgba(33,246,168,0.08)' }}>
                      <Sparkles className="h-3.5 w-3.5" style={{ color: '#0D9C6A' }} />
                    </span>
                    AI Auto Reply Draft
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground bg-muted/40 rounded-xl p-3 border border-border/40">
                    Paste the client's message — AI will draft a professional reply for you.
                  </p>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Client's Message</Label>
                    <Textarea
                      className="rounded-xl border-border/60 text-sm resize-none"
                      rows={4}
                      placeholder="Paste what the client wrote to you..."
                      value={autoReplyInput}
                      onChange={(e) => setAutoReplyInput(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full h-10 rounded-xl text-sm font-semibold text-gray-900 gap-2"
                    style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}
                    onClick={handleAutoReply}
                    disabled={autoReplyLoading || !autoReplyInput.trim()}
                  >
                    <Sparkles className={cn('h-4 w-4', autoReplyLoading && 'animate-pulse')} />
                    {autoReplyLoading ? 'Generating...' : 'Generate Reply'}
                  </Button>

                  {autoReplyDraft && (
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Subject</p>
                        <p className="text-sm font-medium text-foreground">{autoReplyDraft.subject}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Reply Body</p>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/80">{autoReplyDraft.body}</p>
                      </div>
                      <Button
                        className="w-full h-9 rounded-xl text-sm font-semibold gap-2"
                        variant="outline"
                        onClick={applyAutoReply}
                      >
                        <Mail className="h-3.5 w-3.5" />
                        Use in Email Tab
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Website Analyzer Tab */}
            <TabsContent value="website">
              <Card className="border border-border/60 shadow-card overflow-hidden">
                <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #3F4D67, #21F6A8)' }} />
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: 'rgba(63,77,103,0.1)' }}>
                      <Globe className="h-3.5 w-3.5 text-foreground/60" />
                    </span>
                    AI Website Analyzer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground bg-muted/40 rounded-xl p-3 border border-border/40">
                    AI analyzes the client's website and detects pain points, tech stack, and the best service to pitch.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      className="h-9 rounded-xl border-border/60 text-sm"
                      placeholder="https://client-website.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                    />
                    <Button
                      className="h-9 rounded-xl text-sm font-semibold text-white gap-1.5 shrink-0"
                      style={{ background: 'linear-gradient(135deg, #3F4D67, #4d5f80)' }}
                      onClick={handleWebsiteAnalyze}
                      disabled={websiteLoading || !websiteUrl.trim()}
                    >
                      <Globe className={cn('h-3.5 w-3.5', websiteLoading && 'animate-spin')} />
                      {websiteLoading ? 'Analyzing...' : 'Analyze'}
                    </Button>
                  </div>

                  {websiteAnalysis && (
                    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Business Type</p>
                          <p className="text-sm font-medium">{websiteAnalysis.businessType}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Opportunity Score</p>
                          <span className={cn(
                            'text-sm font-bold px-2 py-0.5 rounded-full',
                            websiteAnalysis.score >= 7 ? 'bg-rose-100 text-rose-700' :
                            websiteAnalysis.score >= 5 ? 'bg-amber-100 text-amber-700' :
                            'bg-sky-100 text-sky-700'
                          )}>
                            {websiteAnalysis.score}/10
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Recommended Service</p>
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          <Zap className="h-3 w-3 mr-1" />{websiteAnalysis.recommendedService}
                        </Badge>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Pitch Angle</p>
                        <p className="text-sm italic text-foreground/80">"{websiteAnalysis.pitchAngle}"</p>
                      </div>

                      {websiteAnalysis.painPoints?.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Pain Points Detected</p>
                          <ul className="space-y-1">
                            {websiteAnalysis.painPoints.map((p, i) => (
                              <li key={i} className="text-xs flex items-start gap-1.5">
                                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
                                {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {websiteAnalysis.opportunities?.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Sales Opportunities</p>
                          <ul className="space-y-1">
                            {websiteAnalysis.opportunities.map((o, i) => (
                              <li key={i} className="text-xs flex items-start gap-1.5">
                                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                                {o}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {websiteAnalysis.techStack?.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Tech Stack</p>
                          <div className="flex flex-wrap gap-1">
                            {websiteAnalysis.techStack.map((t, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes">
              <Card className="border border-border/60 shadow-card overflow-hidden">
                <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: 'rgba(245,158,11,0.1)' }}>
                      <StickyNote className="h-3.5 w-3.5 text-amber-500" />
                    </span>
                    Internal Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground bg-muted/40 rounded-xl p-3 border border-border/40">
                    Private notes visible only to your team. Not sent to the client.
                  </p>
                  <Textarea
                    className="rounded-xl border-border/60 text-sm resize-none"
                    rows={8}
                    placeholder="Add notes about this lead — call summaries, concerns, next steps..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <Button
                    className="w-full h-10 rounded-xl text-sm font-semibold gap-2"
                    style={notesSaved
                      ? { background: 'linear-gradient(135deg, #10b981, #34d399)', color: 'white' }
                      : { background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', color: 'white' }}
                    onClick={handleSaveNotes}
                    disabled={notesSaving}
                  >
                    {notesSaved ? '✅ Saved!' : notesSaving
                      ? <><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                      : 'Save Notes'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <Card className="border border-border/60 shadow-card overflow-hidden">
                <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #6366f1, #21F6A8)' }} />
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: 'rgba(99,102,241,0.1)' }}>
                      <Clock className="h-3.5 w-3.5 text-indigo-500" />
                    </span>
                    Outreach History
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {historyLoading ? (
                    <div className="space-y-2 py-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-border/60">
                          <TableHead className="text-xs font-semibold text-muted-foreground">Type</TableHead>
                          <TableHead className="text-xs font-semibold text-muted-foreground">Subject</TableHead>
                          <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                          <TableHead className="text-xs font-semibold text-muted-foreground">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-12">
                              <div className="flex flex-col items-center gap-2">
                                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.08)' }}>
                                  <Clock className="h-4 w-4 text-muted-foreground/40" />
                                </div>
                                <p className="text-sm text-muted-foreground">No outreach history yet.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : history.map((log) => (
                          <TableRow key={log._id} className="border-border/40 hover:bg-muted/30">
                            <TableCell>
                              <span className={cn(
                                'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full capitalize',
                                log.type === 'email' ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700',
                              )}>
                                {log.type === 'email' ? <Mail className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                                {log.type}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{log.subject || log.message?.slice(0, 40) || '—'}</TableCell>
                            <TableCell>
                              <span className={cn(
                                'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full',
                                log.status === 'sent' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
                              )}>
                                <span className={cn('h-1.5 w-1.5 rounded-full', log.status === 'sent' ? 'bg-emerald-400' : 'bg-rose-400')} />
                                {log.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Lead Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}>
                <Pencil className="h-3.5 w-3.5 text-gray-900" />
              </span>
              Edit Lead
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            {editError && (
              <div className="text-sm rounded-xl p-3 bg-rose-50 text-rose-700 border border-rose-200">{editError}</div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Company Name *</Label>
              <Input className="h-9 rounded-xl border-border/60 text-sm" value={editForm.companyName} onChange={(e) => setEditForm((f) => ({ ...f, companyName: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact Name</Label>
                <Input className="h-9 rounded-xl border-border/60 text-sm" placeholder="John Smith" value={editForm.contactName} onChange={(e) => setEditForm((f) => ({ ...f, contactName: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</Label>
                <Input className="h-9 rounded-xl border-border/60 text-sm" type="email" placeholder="john@company.com" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone</Label>
                <Input className="h-9 rounded-xl border-border/60 text-sm" placeholder="+1234567890" value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Website</Label>
                <Input className="h-9 rounded-xl border-border/60 text-sm" placeholder="https://company.com" value={editForm.website} onChange={(e) => setEditForm((f) => ({ ...f, website: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Industry</Label>
                <Input className="h-9 rounded-xl border-border/60 text-sm" placeholder="SaaS, E-commerce..." value={editForm.industry} onChange={(e) => setEditForm((f) => ({ ...f, industry: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Budget</Label>
                <Input className="h-9 rounded-xl border-border/60 text-sm" placeholder="$5k–$10k" value={editForm.budget} onChange={(e) => setEditForm((f) => ({ ...f, budget: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</Label>
              <Textarea className="rounded-xl border-border/60 text-sm resize-none" rows={3} placeholder="Brief description..." value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" className="h-9 rounded-xl text-sm border-border/60" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              className="h-9 rounded-xl text-sm font-semibold text-gray-900 gap-2"
              style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}
              onClick={handleEditSave}
              disabled={editSaving}
            >
              {editSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

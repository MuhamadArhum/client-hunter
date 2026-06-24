import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, MessageSquare, Clock,
  Brain, Zap, CalendarClock, RefreshCw, Sparkles, Globe, StickyNote, Search,
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
  new: 'bg-cyan-100 text-cyan-700',
  contacted: 'bg-amber-100 text-amber-700',
  proposal_sent: 'bg-violet-100 text-violet-700',
  follow_up: 'bg-indigo-100 text-indigo-700',
  converted: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-rose-100 text-rose-700',
};

const QUAL_STYLES: Record<string, string> = {
  hot: 'bg-rose-100 text-rose-700 border-rose-200',
  warm: 'bg-amber-100 text-amber-700 border-amber-200',
  cold: 'bg-sky-100 text-sky-700 border-sky-200',
};

const QUAL_EMOJI: Record<string, string> = { hot: '🔥', warm: '🟡', cold: '🔵' };

const STATUSES = ['new', 'contacted', 'proposal_sent', 'follow_up', 'converted', 'lost'];

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || '—'}</span>
    </div>
  );
}

function AlertMsg({ msg, success }: { msg: string; success?: boolean }) {
  return (
    <p className={cn('text-sm rounded p-2', success ? 'text-cyan-700 bg-cyan-50' : 'text-destructive bg-destructive/10')}>
      {msg}
    </p>
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

  const fetchLead = () => {
    if (!id) return;
    api.get(`/leads/${id}`)
      .then((res) => {
        const l = res.data?.data || res.data;
        setLead(l);
        setWaPhone(l?.phone || '');
        setNotes(l?.notes || '');
        setWebsiteUrl(l?.website || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
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

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1"><CardContent className="p-6 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}</CardContent></Card>
          <Card className="lg:col-span-2"><CardContent className="p-6 space-y-3"><Skeleton className="h-10 w-48" /><Skeleton className="h-32 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Lead not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/leads')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Leads
        </Button>
      </div>
    );
  }

  const score = lead.aiScore ?? null;

  return (
    <div className="space-y-6 p-6">
      <Button variant="ghost" onClick={() => navigate('/leads')} className="-ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Leads
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">

        {/* Left: Lead Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg">{lead.companyName}</CardTitle>
                <Badge className={cn('text-xs', STATUS_COLORS[lead.status] || '')}>
                  {lead.status?.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Contact" value={lead.contactName} />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Email</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium flex-1">{lead.email || '—'}</span>
                  {!lead.email && lead.website && (
                    <Button size="sm" variant="outline" className="h-6 text-xs px-2 shrink-0" onClick={handleEnrichEmail} disabled={enrichLoading}>
                      <Search className="h-3 w-3 mr-1" />
                      {enrichLoading ? '...' : 'Find'}
                    </Button>
                  )}
                </div>
                {enrichMsg && <p className={cn('text-xs mt-0.5', enrichMsg.includes('found') || enrichMsg.includes('Email') ? 'text-cyan-600' : 'text-rose-500')}>{enrichMsg}</p>}
              </div>
              <InfoRow label="Phone" value={lead.phone} />
              <InfoRow label="Website" value={lead.website} />
              <InfoRow label="Industry" value={lead.industry} />
              <InfoRow label="Budget" value={lead.budget} />
              <InfoRow label="Source" value={lead.source} />
              {lead.description && <InfoRow label="Description" value={lead.description} />}

              <div className="pt-2 space-y-1">
                <Label className="text-xs text-muted-foreground">Change Status</Label>
                <Select value={lead.status} onValueChange={handleStatusChange} disabled={statusUpdating}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis Card */}
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  AI Analysis
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={handleAnalyze}
                  disabled={analyzeLoading}
                >
                  <RefreshCw className={cn('h-3 w-3 mr-1', analyzeLoading && 'animate-spin')} />
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
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                Schedule Follow-up
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lead.followUpScheduled && (
                <div className="text-xs rounded bg-indigo-50 text-indigo-700 p-2">
                  {lead.followUpSent ? '✅ Follow-up sent' : `⏰ Scheduled: ${new Date(lead.followUpScheduled).toDateString()}`}
                </div>
              )}
              {followUpMsg && <AlertMsg msg={followUpMsg} success={followUpMsg.includes('cheduled')} />}
              <div className="flex gap-2">
                <Select value={followUpDays} onValueChange={setFollowUpDays}>
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['1', '2', '3', '5', '7', '14'].map((d) => (
                      <SelectItem key={d} value={d} className="text-xs">In {d} day{d !== '1' ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-8 text-xs" onClick={handleScheduleFollowUp} disabled={followUpLoading}>
                  <Clock className="h-3 w-3 mr-1" />
                  {followUpLoading ? '...' : 'Set'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Actions */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="email" onValueChange={(v) => v === 'history' && fetchHistory()}>
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="email"><Mail className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Email</span></TabsTrigger>
              <TabsTrigger value="whatsapp"><MessageSquare className="h-4 w-4 mr-1" /><span className="hidden sm:inline">WA</span></TabsTrigger>
              <TabsTrigger value="autoreply"><Sparkles className="h-4 w-4 mr-1" /><span className="hidden sm:inline">AI Reply</span></TabsTrigger>
              <TabsTrigger value="website"><Globe className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Website</span></TabsTrigger>
              <TabsTrigger value="notes"><StickyNote className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Notes</span></TabsTrigger>
              <TabsTrigger value="history"><Clock className="h-4 w-4 mr-1" /><span className="hidden sm:inline">History</span></TabsTrigger>
            </TabsList>

            {/* Email Tab */}
            <TabsContent value="email">
              <Card>
                <CardHeader><CardTitle className="text-base">Send Email</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {emailMsg && <AlertMsg msg={emailMsg} success={emailMsg.includes('success')} />}
                  <div className="space-y-1">
                    <Label>To</Label>
                    <Input value={lead.email || ''} disabled className="bg-muted/50" />
                  </div>
                  <div className="space-y-1">
                    <Label>Subject</Label>
                    <Input placeholder="Email subject..." value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Message</Label>
                    <Textarea rows={5} placeholder="Write your email..." value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} />
                  </div>
                  <Button className="w-full" onClick={handleSendEmail} disabled={emailLoading}>
                    <Mail className="mr-2 h-4 w-4" />
                    {emailLoading ? 'Sending...' : 'Send Email'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* WhatsApp Tab */}
            <TabsContent value="whatsapp">
              <Card>
                <CardHeader><CardTitle className="text-base">Send WhatsApp</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {waMsg && <AlertMsg msg={waMsg} success={waMsg.includes('success')} />}
                  <div className="space-y-1">
                    <Label>Phone Number</Label>
                    <Input placeholder="+923001234567" value={waPhone} onChange={(e) => setWaPhone(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Message</Label>
                    <Textarea rows={5} placeholder="Write your message..." value={waMessage} onChange={(e) => setWaMessage(e.target.value)} />
                  </div>
                  <Button className="w-full" onClick={handleSendWhatsApp} disabled={waLoading}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {waLoading ? 'Sending...' : 'Send WhatsApp'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Auto Reply Tab */}
            <TabsContent value="autoreply">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Auto Reply Draft
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Paste the client's message — AI will draft a professional reply for you.
                  </p>
                  <div className="space-y-1">
                    <Label>Client's Message</Label>
                    <Textarea
                      rows={4}
                      placeholder="Paste what the client wrote to you..."
                      value={autoReplyInput}
                      onChange={(e) => setAutoReplyInput(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" onClick={handleAutoReply} disabled={autoReplyLoading || !autoReplyInput.trim()}>
                    <Sparkles className={cn('mr-2 h-4 w-4', autoReplyLoading && 'animate-pulse')} />
                    {autoReplyLoading ? 'Generating...' : 'Generate Reply'}
                  </Button>

                  {autoReplyDraft && (
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Subject</p>
                        <p className="text-sm font-medium">{autoReplyDraft.subject}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Reply Body</p>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{autoReplyDraft.body}</p>
                      </div>
                      <Button className="w-full" variant="outline" onClick={applyAutoReply}>
                        <Mail className="mr-2 h-4 w-4" />
                        Use in Email Tab
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Website Analyzer Tab */}
            <TabsContent value="website">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    AI Website Analyzer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    AI analyzes the client's website and detects pain points, tech stack, and the best service to pitch.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://client-website.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                    />
                    <Button onClick={handleWebsiteAnalyze} disabled={websiteLoading || !websiteUrl.trim()} className="shrink-0">
                      <Globe className={cn('mr-2 h-4 w-4', websiteLoading && 'animate-spin')} />
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-primary" />
                    Internal Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Private notes visible only to your team. Not sent to the client.
                  </p>
                  <Textarea
                    rows={8}
                    placeholder="Add notes about this lead — call summaries, concerns, next steps..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <Button className="w-full" onClick={handleSaveNotes} disabled={notesSaving}>
                    {notesSaved ? '✅ Saved!' : notesSaving ? 'Saving...' : 'Save Notes'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <Card>
                <CardHeader><CardTitle className="text-base">Outreach History</CardTitle></CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                              No outreach history yet.
                            </TableCell>
                          </TableRow>
                        ) : history.map((log) => (
                          <TableRow key={log._id}>
                            <TableCell className="capitalize text-sm">{log.type}</TableCell>
                            <TableCell className="max-w-xs truncate text-sm">{log.subject || log.message?.slice(0, 40) || '—'}</TableCell>
                            <TableCell>
                              <Badge className={cn('text-xs', log.status === 'sent' ? 'bg-cyan-100 text-cyan-700' : 'bg-rose-100 text-rose-700')}>
                                {log.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(log.createdAt).toLocaleDateString()}
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
    </div>
  );
}

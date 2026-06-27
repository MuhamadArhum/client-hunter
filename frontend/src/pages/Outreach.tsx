import { useEffect, useState, useCallback } from 'react';
import { Mail, MessageSquare, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import api from '@/services/api';
import { cn } from '@/lib/utils';

interface Lead {
  _id: string;
  companyName: string;
  phone?: string;
  email?: string;
}

interface OutreachRecord {
  _id: string;
  leadId?: { companyName?: string };
  type: string;
  status: string;
  subject?: string;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

function Alert({ type, msg }: { type: 'success' | 'error'; msg: string }) {
  return (
    <div className={cn(
      'flex items-center gap-2.5 text-sm rounded-xl p-3 border',
      type === 'success'
        ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
        : 'bg-rose-50 text-rose-700 border-rose-200',
    )}>
      {type === 'success'
        ? <CheckCircle className="h-4 w-4 shrink-0" />
        : <XCircle className="h-4 w-4 shrink-0" />}
      {msg}
    </div>
  );
}

export default function Outreach() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const selectedLead = leads.find((l) => l._id === selectedLeadId);

  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailAlert, setEmailAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [waPhone, setWaPhone] = useState('');
  const [waMessage, setWaMessage] = useState('');
  const [waLoading, setWaLoading] = useState(false);
  const [waAlert, setWaAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [history, setHistory] = useState<OutreachRecord[]>([]);
  const [histPagination, setHistPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, pages: 1 });
  const [histPage, setHistPage] = useState(1);
  const [histLoading, setHistLoading] = useState(false);

  useEffect(() => {
    api.get('/leads', { params: { limit: 100 } })
      .then((res) => setLeads(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedLead?.phone) setWaPhone(selectedLead.phone);
  }, [selectedLeadId, selectedLead]);

  const fetchHistory = useCallback(() => {
    setHistLoading(true);
    api.get('/outreach', { params: { page: histPage, limit: 10 } })
      .then((res) => {
        setHistory(Array.isArray(res.data?.data) ? res.data.data : []);
        setHistPagination(res.data?.pagination || { total: 0, page: 1, limit: 10, pages: 1 });
      })
      .catch(console.error)
      .finally(() => setHistLoading(false));
  }, [histPage]);

  const handleSendEmail = async () => {
    if (!selectedLeadId) { setEmailAlert({ type: 'error', msg: 'Please select a lead.' }); return; }
    if (!emailSubject.trim() || !emailMessage.trim()) { setEmailAlert({ type: 'error', msg: 'Subject and message are required.' }); return; }
    setEmailLoading(true); setEmailAlert(null);
    try {
      await api.post('/outreach/email', { leadId: selectedLeadId, subject: emailSubject, message: emailMessage });
      setEmailAlert({ type: 'success', msg: 'Email sent successfully!' });
      setEmailSubject(''); setEmailMessage('');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setEmailAlert({ type: 'error', msg: err?.response?.data?.message || 'Failed to send email.' });
    } finally { setEmailLoading(false); }
  };

  const handleSendWhatsApp = async () => {
    if (!selectedLeadId) { setWaAlert({ type: 'error', msg: 'Please select a lead.' }); return; }
    if (!waMessage.trim()) { setWaAlert({ type: 'error', msg: 'Message is required.' }); return; }
    setWaLoading(true); setWaAlert(null);
    try {
      await api.post('/outreach/whatsapp', { leadId: selectedLeadId, message: waMessage, to: waPhone });
      setWaAlert({ type: 'success', msg: 'WhatsApp message sent successfully!' });
      setWaMessage('');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setWaAlert({ type: 'error', msg: err?.response?.data?.message || 'Failed to send message.' });
    } finally { setWaLoading(false); }
  };

  return (
    <div className="space-y-5 p-6">
      <div className="page-header">
        <div className="absolute inset-0 opacity-40 rounded-2xl"
             style={{ backgroundImage: 'radial-gradient(rgba(99,102,241,0.08) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Send className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary/70">Automation</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gradient mb-1">Outreach</h1>
          <p className="text-sm text-muted-foreground font-medium">Send emails and WhatsApp messages to your leads</p>
        </div>
      </div>

      <Tabs defaultValue="send">
        <TabsList className="h-10 rounded-xl bg-muted/60 p-1 gap-1">
          <TabsTrigger value="send" className="rounded-lg text-sm font-medium px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Send className="mr-2 h-3.5 w-3.5" /> Send Outreach
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg text-sm font-medium px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm" onClick={fetchHistory}>
            <Clock className="mr-2 h-3.5 w-3.5" /> History
          </TabsTrigger>
        </TabsList>

        {/* Send Tab */}
        <TabsContent value="send" className="mt-5">
          <div className="max-w-2xl space-y-4">
            {/* Lead Selector */}
            <div className="rounded-2xl border border-border/60 bg-white shadow-card p-4 space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Select Lead</Label>
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                <SelectTrigger className="h-10 rounded-xl border-border/60 text-sm">
                  <SelectValue placeholder="Choose a lead to contact..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {leads.map((lead) => (
                    <SelectItem key={lead._id} value={lead._id}>
                      <span className="font-medium">{lead.companyName}</span>
                      {lead.email && <span className="text-muted-foreground ml-2 text-xs">{lead.email}</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedLead?.email && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
                  <Mail className="h-3 w-3" /> {selectedLead.email}
                </p>
              )}
            </div>

            {/* Channel Tabs */}
            <div className="rounded-2xl border border-border/60 bg-white shadow-card overflow-hidden">
              <Tabs defaultValue="email">
                <div className="border-b border-border/60 px-4 pt-4 pb-0">
                  <TabsList className="h-9 rounded-lg bg-muted/60 p-1 gap-1">
                    <TabsTrigger value="email" className="rounded-md text-sm font-medium px-3 gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                      <Mail className="h-3.5 w-3.5" /> Email
                    </TabsTrigger>
                    <TabsTrigger value="whatsapp" className="rounded-md text-sm font-medium px-3 gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                      <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="email" className="p-5 space-y-4">
                  {emailAlert && <Alert type={emailAlert.type} msg={emailAlert.msg} />}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Subject</Label>
                    <Input className="h-10 rounded-xl border-border/60 text-sm" placeholder="Your email subject..." value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Message</Label>
                    <Textarea className="rounded-xl border-border/60 text-sm resize-none" rows={8} placeholder="Write your email message..." value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} />
                  </div>
                  <Button
                    className="h-10 rounded-xl text-sm font-semibold text-white gap-2 shadow-glow-teal"
                    style={{ background: 'linear-gradient(135deg, #1DD2D7, #1DD7CE)' }}
                    onClick={handleSendEmail}
                    disabled={emailLoading}
                  >
                    {emailLoading
                      ? <><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                      : <><Mail className="h-3.5 w-3.5" /> Send Email</>}
                  </Button>
                </TabsContent>

                <TabsContent value="whatsapp" className="p-5 space-y-4">
                  {waAlert && <Alert type={waAlert.type} msg={waAlert.msg} />}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone Number</Label>
                    <Input className="h-10 rounded-xl border-border/60 text-sm" placeholder="+1234567890" value={waPhone} onChange={(e) => setWaPhone(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Message</Label>
                    <Textarea className="rounded-xl border-border/60 text-sm resize-none" rows={8} placeholder="Write your WhatsApp message..." value={waMessage} onChange={(e) => setWaMessage(e.target.value)} />
                  </div>
                  <Button
                    className="h-10 rounded-xl text-sm font-semibold gap-2"
                    style={{ background: 'linear-gradient(135deg, #9F8DD4, #b8a8e4)', color: 'white' }}
                    onClick={handleSendWhatsApp}
                    disabled={waLoading}
                  >
                    {waLoading
                      ? <><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                      : <><MessageSquare className="h-3.5 w-3.5" /> Send WhatsApp</>}
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-5 space-y-4">
          <div className="rounded-2xl border border-border/60 bg-white shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border/60">
              <h3 className="text-sm font-semibold text-foreground">Outreach History</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{histPagination.total} total records</p>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--border) / 0.6)', background: 'hsl(var(--muted) / 0.4)' }}>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">Company</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">Subject</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">Sent At</th>
                </tr>
              </thead>
              <tbody>
                {histLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid hsl(var(--border) / 0.4)' }}>
                      {[...Array(5)].map((__, j) => (
                        <td key={j} className="px-5 py-3"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(29,210,215,0.08)' }}>
                          <Send className="h-5 w-5 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm text-muted-foreground">No outreach history yet</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  history.map((item, idx) => (
                    <tr
                      key={item._id}
                      className="hover:bg-muted/30 transition-colors"
                      style={{ borderBottom: idx === history.length - 1 ? 'none' : '1px solid hsl(var(--border) / 0.4)' }}
                    >
                      <td className="px-5 py-3 font-medium text-sm">{item.leadId?.companyName || '—'}</td>
                      <td className="px-5 py-3">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full capitalize',
                          item.type === 'email' ? 'bg-cyan-50 text-cyan-700' : 'bg-violet-50 text-violet-700',
                        )}>
                          {item.type === 'email'
                            ? <Mail className="h-3 w-3" />
                            : <MessageSquare className="h-3 w-3" />}
                          {item.type}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full',
                          item.status === 'sent' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
                        )}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', item.status === 'sent' ? 'bg-emerald-400' : 'bg-rose-400')} />
                          {item.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground max-w-xs truncate">{item.subject || '—'}</td>
                      <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {histPagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Page {histPage} of {histPagination.pages}</p>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg text-xs border-border/60" disabled={histPage <= 1} onClick={() => setHistPage((p) => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg text-xs border-border/60" disabled={histPage >= histPagination.pages} onClick={() => setHistPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

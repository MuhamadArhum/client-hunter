import { useEffect, useState, useCallback } from 'react';
import { Mail, MessageSquare, Send, Clock, CheckCircle, XCircle, Plus, Trash2, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import api from '@/services/api';

interface Lead {
  _id: string;
  companyName: string;
  phone?: string;
  email?: string;
}

interface OutreachRecord {
  _id: string;
  lead?: { companyName?: string };
  type: string;
  status: string;
  subject?: string;
  createdAt: string;
  openedAt?: string;
  clickedAt?: string;
}

interface EmailTemplate {
  _id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  usageCount: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

function Alert({ type, msg }: { type: 'success' | 'error'; msg: string }) {
  return (
    <div
      className="flex items-center gap-2.5 text-sm p-3"
      style={{
        borderRadius: 4,
        border: type === 'success' ? '1px solid rgba(62,142,90,0.3)' : '1px solid rgba(194,59,46,0.25)',
        background: type === 'success' ? 'rgba(62,142,90,0.08)' : 'rgba(194,59,46,0.08)',
        color: type === 'success' ? '#3E8E5A' : '#C23B2E',
        fontFamily: "'IBM Plex Sans', sans-serif",
      }}
    >
      {type === 'success'
        ? <CheckCircle className="h-4 w-4 shrink-0" />
        : <XCircle className="h-4 w-4 shrink-0" />}
      {msg}
    </div>
  );
}

const CATEGORIES = ['general', 'cold-outreach', 'follow-up', 'proposal'];

const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  general:        { bg: 'rgba(110,125,121,0.1)', text: '#6E7D79' },
  'cold-outreach': { bg: 'rgba(31,178,166,0.12)', text: '#1FB2A6' },
  'follow-up':     { bg: 'rgba(201,138,30,0.14)', text: '#C98A1E' },
  proposal:        { bg: 'rgba(62,142,90,0.12)',  text: '#3E8E5A' },
};

const labelStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 10.5,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#6E7D79',
};

const inputStyle: React.CSSProperties = {
  borderRadius: 4,
  border: '1px solid #CBD3CF',
  fontSize: 13,
};

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

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [tmplName, setTmplName] = useState('');
  const [tmplCategory, setTmplCategory] = useState('general');
  const [tmplSubject, setTmplSubject] = useState('');
  const [tmplBody, setTmplBody] = useState('');
  const [tmplSaving, setTmplSaving] = useState(false);
  const [tmplAlert, setTmplAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [activeOuterTab, setActiveOuterTab] = useState('send');

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

  const fetchTemplates = useCallback(() => {
    setTemplatesLoading(true);
    api.get('/templates')
      .then((res) => setTemplates(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(console.error)
      .finally(() => setTemplatesLoading(false));
  }, []);

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

  const handleUseTemplate = async (tmpl: EmailTemplate) => {
    setEmailSubject(tmpl.subject);
    setEmailMessage(tmpl.body);
    setActiveOuterTab('send');
    try { await api.post(`/templates/${tmpl._id}/use`); } catch (_) {}
  };

  const handleCreateTemplate = async () => {
    if (!tmplName.trim() || !tmplSubject.trim() || !tmplBody.trim()) {
      setTmplAlert({ type: 'error', msg: 'Name, subject, and body are required.' }); return;
    }
    setTmplSaving(true); setTmplAlert(null);
    try {
      await api.post('/templates', { name: tmplName, subject: tmplSubject, body: tmplBody, category: tmplCategory });
      setTmplAlert({ type: 'success', msg: 'Template saved!' });
      setTmplName(''); setTmplSubject(''); setTmplBody(''); setTmplCategory('general');
      setShowNewTemplate(false);
      fetchTemplates();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setTmplAlert({ type: 'error', msg: err?.response?.data?.message || 'Failed to save.' });
    } finally { setTmplSaving(false); }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await api.delete(`/templates/${id}`);
      fetchTemplates();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-5 p-6" style={{ background: '#E6E9E5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, borderTop: '3px solid #1FB2A6', padding: '20px 24px' }}>
        <div className="flex items-center gap-2 mb-1">
          <Send className="h-4 w-4" style={{ color: '#1FB2A6' }} />
          <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1FB2A6' }}>Automation</span>
        </div>
        <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1B1F2B', marginBottom: 4 }}>Outreach</h1>
        <p style={{ fontSize: 13, color: '#6E7D79' }}>Send emails and WhatsApp messages to your leads</p>
      </div>

      <Tabs value={activeOuterTab} onValueChange={setActiveOuterTab}>
        <TabsList className="h-10 p-1 gap-1" style={{ background: 'rgba(203,211,207,0.4)', borderRadius: 4, border: '1px solid #CBD3CF' }}>
          <TabsTrigger value="send" className="text-sm font-medium px-4 data-[state=active]:shadow-sm" style={{ borderRadius: 4, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            <Send className="mr-2 h-3.5 w-3.5" /> Send Outreach
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-sm font-medium px-4 data-[state=active]:shadow-sm" style={{ borderRadius: 4, fontFamily: "'IBM Plex Sans', sans-serif" }} onClick={fetchTemplates}>
            <Eye className="mr-2 h-3.5 w-3.5" /> Templates
          </TabsTrigger>
          <TabsTrigger value="history" className="text-sm font-medium px-4 data-[state=active]:shadow-sm" style={{ borderRadius: 4, fontFamily: "'IBM Plex Sans', sans-serif" }} onClick={fetchHistory}>
            <Clock className="mr-2 h-3.5 w-3.5" /> History
          </TabsTrigger>
        </TabsList>

        {/* Send Tab */}
        <TabsContent value="send" className="mt-5">
          <div className="max-w-2xl space-y-4">
            {/* Lead selector */}
            <div className="p-4 space-y-1.5" style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4 }}>
              <Label style={labelStyle}>Select Lead</Label>
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                <SelectTrigger className="h-10 text-sm" style={inputStyle}>
                  <SelectValue placeholder="Choose a lead to contact..." />
                </SelectTrigger>
                <SelectContent style={{ borderRadius: 4 }}>
                  {leads.map((lead) => (
                    <SelectItem key={lead._id} value={lead._id}>
                      <span className="font-medium">{lead.companyName}</span>
                      {lead.email && <span className="ml-2 text-xs" style={{ color: '#6E7D79' }}>{lead.email}</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedLead?.email && (
                <p className="flex items-center gap-1.5 pt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#6E7D79' }}>
                  <Mail className="h-3 w-3" /> {selectedLead.email}
                </p>
              )}
            </div>

            {/* Email / WhatsApp tabs */}
            <div style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, overflow: 'hidden' }}>
              <Tabs defaultValue="email">
                <div style={{ borderBottom: '1px solid #CBD3CF', padding: '12px 16px 0' }}>
                  <TabsList className="h-9 p-1 gap-1" style={{ background: 'rgba(203,211,207,0.4)', borderRadius: 4, border: '1px solid #CBD3CF' }}>
                    <TabsTrigger value="email" className="text-sm font-medium px-3 gap-2 data-[state=active]:shadow-sm" style={{ borderRadius: 4, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                      <Mail className="h-3.5 w-3.5" /> Email
                    </TabsTrigger>
                    <TabsTrigger value="whatsapp" className="text-sm font-medium px-3 gap-2 data-[state=active]:shadow-sm" style={{ borderRadius: 4, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                      <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="email" className="p-5 space-y-4">
                  {emailAlert && <Alert type={emailAlert.type} msg={emailAlert.msg} />}
                  <div className="space-y-1.5">
                    <Label style={labelStyle}>Subject</Label>
                    <Input className="h-10 text-sm" style={inputStyle} placeholder="Your email subject..." value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label style={labelStyle}>Message</Label>
                    <Textarea className="text-sm resize-none" style={inputStyle} rows={8} placeholder="Write your email message..." value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} />
                  </div>
                  <button
                    className="h-10 px-5 gap-2 flex items-center font-semibold text-sm text-white"
                    style={{ background: '#1FB2A6', borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif", opacity: emailLoading ? 0.7 : 1 }}
                    onClick={handleSendEmail}
                    disabled={emailLoading}
                  >
                    {emailLoading
                      ? <><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                      : <><Mail className="h-3.5 w-3.5" /> Send Email</>}
                  </button>
                </TabsContent>

                <TabsContent value="whatsapp" className="p-5 space-y-4">
                  {waAlert && <Alert type={waAlert.type} msg={waAlert.msg} />}
                  <div className="space-y-1.5">
                    <Label style={labelStyle}>Phone Number</Label>
                    <Input className="h-10 text-sm" style={inputStyle} placeholder="+1234567890" value={waPhone} onChange={(e) => setWaPhone(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label style={labelStyle}>Message</Label>
                    <Textarea className="text-sm resize-none" style={inputStyle} rows={8} placeholder="Write your WhatsApp message..." value={waMessage} onChange={(e) => setWaMessage(e.target.value)} />
                  </div>
                  <button
                    className="h-10 px-5 gap-2 flex items-center font-semibold text-sm text-white"
                    style={{ background: '#C98A1E', borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif", opacity: waLoading ? 0.7 : 1 }}
                    onClick={handleSendWhatsApp}
                    disabled={waLoading}
                  >
                    {waLoading
                      ? <><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                      : <><MessageSquare className="h-3.5 w-3.5" /> Send WhatsApp</>}
                  </button>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#6E7D79' }}>{templates.length} template{templates.length !== 1 ? 's' : ''}</p>
            <button
              className="h-9 px-4 gap-2 flex items-center text-sm font-semibold text-white"
              style={{ background: '#1FB2A6', borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" }}
              onClick={() => setShowNewTemplate((v) => !v)}
            >
              <Plus className="h-3.5 w-3.5" /> New Template
            </button>
          </div>

          {showNewTemplate && (
            <div className="p-5 space-y-4" style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, borderTop: '3px solid #1FB2A6' }}>
              <h3 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, fontWeight: 600, textTransform: 'uppercase', color: '#1B1F2B' }}>New Email Template</h3>
              {tmplAlert && <Alert type={tmplAlert.type} msg={tmplAlert.msg} />}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label style={labelStyle}>Template Name *</Label>
                  <Input className="h-9 text-sm" style={inputStyle} placeholder="e.g. Cold Intro Email" value={tmplName} onChange={(e) => setTmplName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label style={labelStyle}>Category</Label>
                  <Select value={tmplCategory} onValueChange={setTmplCategory}>
                    <SelectTrigger className="h-9 text-sm" style={inputStyle}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ borderRadius: 4 }}>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c} className="capitalize">{c.replace('-', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label style={labelStyle}>Subject *</Label>
                <Input className="h-9 text-sm" style={inputStyle} placeholder="Email subject line..." value={tmplSubject} onChange={(e) => setTmplSubject(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label style={labelStyle}>Body *</Label>
                <Textarea className="text-sm resize-none" style={inputStyle} rows={8} placeholder="Email body..." value={tmplBody} onChange={(e) => setTmplBody(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <button
                  className="h-9 px-4 text-sm font-semibold text-white flex items-center"
                  style={{ background: '#1FB2A6', borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif", opacity: tmplSaving ? 0.7 : 1 }}
                  onClick={handleCreateTemplate}
                  disabled={tmplSaving}
                >
                  {tmplSaving ? 'Saving...' : 'Save Template'}
                </button>
                <button
                  className="h-9 px-4 text-sm font-semibold"
                  style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, color: '#6E7D79', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" }}
                  onClick={() => setShowNewTemplate(false)}
                >Cancel</button>
              </div>
            </div>
          )}

          {templatesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" style={{ borderRadius: 4 }} />)}
            </div>
          ) : templates.length === 0 ? (
            <div className="p-16 flex flex-col items-center gap-3" style={{ background: '#F1F4F0', border: '1px dashed #CBD3CF', borderRadius: 4 }}>
              <div className="h-14 w-14 flex items-center justify-center" style={{ background: 'rgba(31,178,166,0.08)', borderRadius: 4 }}>
                <Eye className="h-6 w-6" style={{ color: '#6E7D79' }} />
              </div>
              <p style={{ fontSize: 13, color: '#6E7D79' }}>No templates yet. Create one to reuse emails quickly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.map((tmpl) => {
                const catStyle = CATEGORY_STYLES[tmpl.category] || CATEGORY_STYLES.general;
                return (
                  <div key={tmpl._id} className="p-4 space-y-3" style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4 }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#1B1F2B', fontFamily: "'IBM Plex Sans', sans-serif" }}>{tmpl.name}</p>
                        <p className="text-xs truncate mt-0.5" style={{ color: '#6E7D79' }}>{tmpl.subject}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteTemplate(tmpl._id)}
                        className="h-7 w-7 flex items-center justify-center transition-colors shrink-0"
                        style={{ borderRadius: 4, background: 'rgba(194,59,46,0.08)', border: '1px solid rgba(194,59,46,0.2)', color: '#C23B2E', cursor: 'pointer' }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs line-clamp-3" style={{ color: '#6E7D79' }}>{tmpl.body}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span
                        className="text-xs font-medium px-2 py-0.5 capitalize"
                        style={{ borderRadius: 10, background: catStyle.bg, color: catStyle.text, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 }}
                      >
                        {tmpl.category.replace('-', ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: '#6E7D79' }}>Used {tmpl.usageCount}×</span>
                        <button
                          className="h-7 px-2.5 text-xs font-semibold text-white gap-1 flex items-center"
                          style={{ background: '#1FB2A6', borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" }}
                          onClick={() => handleUseTemplate(tmpl)}
                        >
                          <Mail className="h-3 w-3" /> Use
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-5 space-y-4">
          <div style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, overflow: 'hidden' }}>
            {/* Panel header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #CBD3CF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, fontWeight: 600, textTransform: 'uppercase', color: '#1B1F2B' }}>Outreach History</h3>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: '#6E7D79', marginTop: 2 }}>{histPagination.total} total records</p>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #CBD3CF', background: 'rgba(203,211,207,0.3)' }}>
                  {['Company', 'Type', 'Status', 'Subject', 'Tracking', 'Sent At'].map((h) => (
                    <th key={h} className="text-left px-5 py-3" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6E7D79' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {histLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #CBD3CF' }}>
                      {[...Array(6)].map((__, j) => (
                        <td key={j} className="px-5 py-3"><Skeleton className="h-4 w-full" style={{ borderRadius: 4 }} /></td>
                      ))}
                    </tr>
                  ))
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 flex items-center justify-center" style={{ background: 'rgba(31,178,166,0.08)', borderRadius: 4 }}>
                          <Send className="h-5 w-5" style={{ color: '#6E7D79' }} />
                        </div>
                        <p style={{ fontSize: 13, color: '#6E7D79' }}>No outreach history yet</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  history.map((item, idx) => {
                    const isEmail = item.type === 'email';
                    return (
                      <tr
                        key={item._id}
                        style={{
                          borderBottom: idx === history.length - 1 ? 'none' : '1px solid #CBD3CF',
                          transition: 'background 0.15s',
                          cursor: 'default',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(154,198,232,0.06)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td className="px-5 py-3 font-medium text-sm" style={{ color: '#1B1F2B', fontFamily: "'IBM Plex Sans', sans-serif" }}>{item.lead?.companyName || '—'}</td>
                        <td className="px-5 py-3">
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 capitalize"
                            style={{
                              borderRadius: 10,
                              background: isEmail ? 'rgba(31,178,166,0.12)' : 'rgba(201,138,30,0.14)',
                              color: isEmail ? '#1FB2A6' : '#C98A1E',
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontSize: 10.5,
                            }}
                          >
                            {isEmail ? <Mail className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                            {item.type}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1"
                            style={{
                              borderRadius: 10,
                              background: item.status === 'sent' ? 'rgba(62,142,90,0.12)' : 'rgba(194,59,46,0.12)',
                              color: item.status === 'sent' ? '#3E8E5A' : '#C23B2E',
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontSize: 10.5,
                              textTransform: 'uppercase',
                            }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: item.status === 'sent' ? '#3E8E5A' : '#C23B2E' }}
                            />
                            {item.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 max-w-xs truncate" style={{ color: '#6E7D79', fontSize: 13 }}>{item.subject || '—'}</td>
                        <td className="px-5 py-3">
                          {isEmail ? (
                            <div className="flex gap-1.5">
                              <span
                                className="text-[10px] font-medium px-1.5 py-0.5"
                                style={{
                                  borderRadius: 4,
                                  background: item.openedAt ? 'rgba(62,142,90,0.12)' : 'rgba(110,125,121,0.1)',
                                  color: item.openedAt ? '#3E8E5A' : '#6E7D79',
                                  fontFamily: "'IBM Plex Mono', monospace",
                                }}
                              >
                                {item.openedAt ? '✓ Opened' : 'Not opened'}
                              </span>
                              {item.clickedAt && (
                                <span
                                  className="text-[10px] font-medium px-1.5 py-0.5"
                                  style={{ borderRadius: 4, background: 'rgba(62,142,90,0.12)', color: '#3E8E5A', fontFamily: "'IBM Plex Mono', monospace" }}
                                >✓ Clicked</span>
                              )}
                            </div>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#6E7D79' }}>
                          {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {histPagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#6E7D79' }}>Page {histPage} of {histPagination.pages}</p>
              <div className="flex gap-1.5">
                <button
                  style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 600, padding: '0 12px', height: 30, borderRadius: 4, background: '#F1F4F0', border: '1px solid #CBD3CF', color: '#1B1F2B', cursor: 'pointer', opacity: histPage <= 1 ? 0.35 : 1 }}
                  disabled={histPage <= 1}
                  onClick={() => setHistPage((p) => p - 1)}
                >Previous</button>
                <button
                  style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 600, padding: '0 12px', height: 30, borderRadius: 4, background: '#F1F4F0', border: '1px solid #CBD3CF', color: '#1B1F2B', cursor: 'pointer', opacity: histPage >= histPagination.pages ? 0.35 : 1 }}
                  disabled={histPage >= histPagination.pages}
                  onClick={() => setHistPage((p) => p + 1)}
                >Next</button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

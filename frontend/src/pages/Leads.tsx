import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, Download, AtSign, Users, Flame, TrendingUp, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  status: string;
  source: string;
  industry?: string;
  budget?: string;
  description?: string;
  aiScore?: number;
  aiQualification?: 'hot' | 'warm' | 'cold';
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  new:           { bg: 'bg-cyan-50',    text: 'text-cyan-700',    dot: 'bg-cyan-400' },
  contacted:     { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400' },
  proposal_sent: { bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-400' },
  follow_up:     { bg: 'bg-indigo-50',  text: 'text-indigo-700',  dot: 'bg-indigo-400' },
  converted:     { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  lost:          { bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-400' },
};

const SOURCE_STYLES: Record<string, string> = {
  manual:    'bg-slate-100 text-slate-600',
  upwork:    'bg-green-50 text-green-700',
  freelancer: 'bg-blue-50 text-blue-700',
  crunchbase: 'bg-orange-50 text-orange-700',
  clutch:    'bg-red-50 text-red-700',
  linkedin:  'bg-sky-50 text-sky-700',
};

const SOURCES = ['manual', 'upwork', 'freelancer', 'crunchbase', 'clutch', 'linkedin'];
const STATUSES = ['new', 'contacted', 'proposal_sent', 'follow_up', 'converted', 'lost'];

const emptyForm = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  website: '',
  source: 'manual',
  industry: '',
  budget: '',
  description: '',
};

function getInitials(name: string) {
  return name?.slice(0, 2).toUpperCase() || '??';
}

function AiScoreBadge({ score, qualification }: { score: number; qualification?: string }) {
  const isHot  = qualification === 'hot'  || score >= 8;
  const isWarm = qualification === 'warm' || (score >= 5 && score < 8);

  const style = isHot
    ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
    : isWarm
    ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
    : 'bg-sky-50 text-sky-700 ring-1 ring-sky-200';

  const emoji = isHot ? '🔥' : isWarm ? '⚡' : '❄️';

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full', style)}>
      {emoji} {score}/10
    </span>
  );
}

export default function Leads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ ...emptyForm });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const [importOpen, setImportOpen] = useState(false);
  const [importSource, setImportSource] = useState('upwork');
  const [importQuery, setImportQuery] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importMsg, setImportMsg] = useState('');

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkEnrichLoading, setBulkEnrichLoading] = useState(false);
  const [bulkEnrichMsg, setBulkEnrichMsg] = useState('');

  const fetchLeads = useCallback(() => {
    setLoading(true);
    const params: Record<string, string | number> = { page, limit: 10, search };
    if (statusFilter !== 'all') params.status = statusFilter;
    api
      .get('/leads', { params })
      .then((res) => {
        setLeads(Array.isArray(res.data?.data) ? res.data.data : []);
        setPagination(res.data?.pagination || { total: 0, page: 1, limit: 10, pages: 1 });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleAdd = async () => {
    if (!addForm.companyName.trim()) { setAddError('Company name is required.'); return; }
    setAddLoading(true);
    setAddError('');
    try {
      await api.post('/leads', addForm);
      setAddOpen(false);
      setAddForm({ ...emptyForm });
      fetchLeads();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setAddError(err?.response?.data?.message || 'Failed to add lead.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importQuery.trim()) { setImportMsg('Please enter a search query.'); return; }
    setImportLoading(true);
    setImportMsg('');
    try {
      const res = await api.post('/leads/scrape', { source: importSource, query: importQuery });
      const count = res.data?.data?.length || 0;
      setImportMsg(`✓ Successfully imported ${count} lead(s).`);
      fetchLeads();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setImportMsg(err?.response?.data?.message || 'Import failed.');
    } finally {
      setImportLoading(false);
    }
  };

  const handleBulkEnrich = async () => {
    setBulkEnrichLoading(true);
    setBulkEnrichMsg('');
    try {
      const res = await api.post('/leads/bulk-enrich');
      setBulkEnrichMsg(res.data?.message || 'Enrichment started!');
      setTimeout(() => { setBulkEnrichMsg(''); fetchLeads(); }, 3000);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setBulkEnrichMsg(err?.response?.data?.message || 'Enrichment failed.');
    } finally {
      setBulkEnrichLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/leads/${deleteId}`);
      setDeleteId(null);
      fetchLeads();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteLoading(false);
    }
  };

  const hotLeads = leads.filter((l) => l.aiQualification === 'hot' || (l.aiScore ?? 0) >= 8).length;
  const convertedLeads = leads.filter((l) => l.status === 'converted').length;

  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div className="page-header">
        <div className="absolute inset-0 opacity-40 rounded-2xl"
             style={{ backgroundImage: 'radial-gradient(rgba(29,210,215,0.08) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary/70">Pipeline</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-gradient mb-1">Leads</h1>
            <p className="text-sm text-muted-foreground font-medium">
              {pagination.total} total leads
              {hotLeads > 0 && <> · <span className="text-rose-500 font-semibold">{hotLeads} 🔥 hot</span></>}
              {convertedLeads > 0 && <> · <span className="text-emerald-600 font-semibold">{convertedLeads} converted</span></>}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
          {bulkEnrichMsg && (
            <span className="text-xs font-medium text-cyan-700 bg-cyan-50 border border-cyan-200 px-3 py-1.5 rounded-xl self-center">
              {bulkEnrichMsg}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-xl border-border/60 gap-2 font-medium text-sm"
            onClick={handleBulkEnrich}
            disabled={bulkEnrichLoading}
          >
            <AtSign className="h-3.5 w-3.5" />
            {bulkEnrichLoading ? 'Finding...' : 'Find Emails'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-xl border-border/60 gap-2 font-medium text-sm"
            onClick={() => { setImportMsg(''); setImportOpen(true); }}
          >
            <Download className="h-3.5 w-3.5" />
            Auto Import
          </Button>
          <Button
            size="sm"
            className="h-9 rounded-xl gap-2 font-semibold text-sm text-white shadow-glow-teal"
            style={{ background: 'linear-gradient(135deg, #1DD2D7, #1DD7CE)' }}
            onClick={() => { setAddError(''); setAddForm({ ...emptyForm }); setAddOpen(true); }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Lead
          </Button>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Search by company, contact or email..."
            className="pl-9 h-10 rounded-xl border-border/60 bg-background text-sm"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl border-border/60 bg-background text-sm">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border border-border/60 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border) / 0.6)', background: 'hsl(var(--muted) / 0.4)' }}>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide">Company</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide">AI Score</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide">Source</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide w-10"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid hsl(var(--border) / 0.4)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-16 rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-16 rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-7 w-7 rounded-lg" /></td>
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className="h-14 w-14 rounded-2xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, rgba(29,210,215,0.1), rgba(159,141,212,0.1))' }}
                      >
                        <Users className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">No leads found</p>
                        <p className="text-xs text-muted-foreground mt-1">Try adjusting filters or add a new lead</p>
                      </div>
                      <Button
                        size="sm"
                        className="mt-1 h-8 rounded-xl gap-1.5 text-xs font-semibold text-white"
                        style={{ background: 'linear-gradient(135deg, #1DD2D7, #1DD7CE)' }}
                        onClick={() => { setAddError(''); setAddForm({ ...emptyForm }); setAddOpen(true); }}
                      >
                        <Plus className="h-3.5 w-3.5" /> Add First Lead
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead, idx) => {
                  const statusStyle = STATUS_STYLES[lead.status] || STATUS_STYLES.new;
                  const sourceStyle = SOURCE_STYLES[lead.source] || SOURCE_STYLES.manual;
                  const isLast = idx === leads.length - 1;
                  return (
                    <tr
                      key={lead._id}
                      className="group transition-colors duration-100 hover:bg-muted/40 cursor-pointer"
                      style={{ borderBottom: isLast ? 'none' : '1px solid hsl(var(--border) / 0.4)' }}
                      onClick={() => navigate(`/leads/${lead._id}`)}
                    >
                      {/* Company */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                            style={{ background: 'linear-gradient(135deg, #1DD2D7, #9F8DD4)' }}
                          >
                            {getInitials(lead.companyName)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                              {lead.companyName}
                            </p>
                            {lead.industry && (
                              <p className="text-xs text-muted-foreground truncate">{lead.industry}</p>
                            )}
                            {lead.website && (
                              <a
                                href={lead.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs text-primary/60 hover:text-primary flex items-center gap-0.5 truncate max-w-[140px]"
                              >
                                <ExternalLink className="h-2.5 w-2.5" />
                                {lead.website.replace(/^https?:\/\//, '')}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{lead.contactName || '—'}</p>
                          {lead.email && (
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">{lead.email}</p>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap',
                          statusStyle.bg, statusStyle.text,
                        )}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', statusStyle.dot)} />
                          {lead.status?.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* AI Score */}
                      <td className="px-4 py-3">
                        {lead.aiScore != null ? (
                          <AiScoreBadge score={lead.aiScore} qualification={lead.aiQualification} />
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex text-xs font-medium px-2.5 py-1 rounded-full capitalize',
                          sourceStyle,
                        )}>
                          {lead.source}
                        </span>
                      </td>

                      {/* Delete */}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 rounded-lg flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 text-muted-foreground/40"
                          onClick={() => setDeleteId(lead._id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * 10) + 1}–{Math.min(page * 10, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 rounded-lg text-xs border-border/60"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <Button
                  key={p}
                  variant={page === p ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'h-8 w-8 p-0 rounded-lg text-xs border-border/60',
                    page === p && 'text-white border-0',
                  )}
                  style={page === p ? { background: 'linear-gradient(135deg, #1DD2D7, #1DD7CE)' } : {}}
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 rounded-lg text-xs border-border/60"
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add Lead Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <span
                className="h-6 w-6 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #1DD2D7, #9F8DD4)' }}
              >
                <Plus className="h-3.5 w-3.5 text-white" />
              </span>
              Add New Lead
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1">
            {addError && (
              <div className="text-sm rounded-xl p-3 bg-rose-50 text-rose-700 border border-rose-200">
                {addError}
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Company Name *</Label>
              <Input
                className="h-9 rounded-xl border-border/60 text-sm"
                placeholder="Acme Corp"
                value={addForm.companyName}
                onChange={(e) => setAddForm((f) => ({ ...f, companyName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact Name</Label>
                <Input className="h-9 rounded-xl border-border/60 text-sm" placeholder="John Smith" value={addForm.contactName} onChange={(e) => setAddForm((f) => ({ ...f, contactName: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</Label>
                <Input className="h-9 rounded-xl border-border/60 text-sm" type="email" placeholder="john@acme.com" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone</Label>
                <Input className="h-9 rounded-xl border-border/60 text-sm" placeholder="+1 234 567 890" value={addForm.phone} onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Website</Label>
                <Input className="h-9 rounded-xl border-border/60 text-sm" placeholder="https://acme.com" value={addForm.website} onChange={(e) => setAddForm((f) => ({ ...f, website: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Source</Label>
              <Select value={addForm.source} onValueChange={(v) => setAddForm((f) => ({ ...f, source: v }))}>
                <SelectTrigger className="h-9 rounded-xl border-border/60 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {SOURCES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Industry</Label>
                <Input className="h-9 rounded-xl border-border/60 text-sm" placeholder="SaaS, E-commerce..." value={addForm.industry} onChange={(e) => setAddForm((f) => ({ ...f, industry: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Budget</Label>
                <Input className="h-9 rounded-xl border-border/60 text-sm" placeholder="$5k–$10k" value={addForm.budget} onChange={(e) => setAddForm((f) => ({ ...f, budget: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes / Description</Label>
              <Textarea className="rounded-xl border-border/60 text-sm resize-none" rows={3} placeholder="Any additional context..." value={addForm.description} onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl border-border/60 text-sm" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl text-sm font-semibold text-white gap-2"
              style={{ background: 'linear-gradient(135deg, #1DD2D7, #1DD7CE)' }}
              onClick={handleAdd}
              disabled={addLoading}
            >
              {addLoading ? (
                <><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Adding...</>
              ) : (
                <><Plus className="h-3.5 w-3.5" /> Add Lead</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto Import Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <span
                className="h-6 w-6 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #1DD2D7, #9F8DD4)' }}
              >
                <Download className="h-3.5 w-3.5 text-white" />
              </span>
              Auto Import Leads
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            {importMsg && (
              <div className={cn(
                'text-sm rounded-xl p-3 border',
                importMsg.startsWith('✓')
                  ? 'text-cyan-700 bg-cyan-50 border-cyan-200'
                  : 'text-rose-700 bg-rose-50 border-rose-200',
              )}>
                {importMsg}
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Platform</Label>
              <Select value={importSource} onValueChange={setImportSource}>
                <SelectTrigger className="h-9 rounded-xl border-border/60 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {SOURCES.filter((s) => s !== 'manual').map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Search Query</Label>
              <Input
                className="h-9 rounded-xl border-border/60 text-sm"
                placeholder="e.g. React developer New York"
                value={importQuery}
                onChange={(e) => setImportQuery(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl border-border/60 text-sm" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl text-sm font-semibold text-white gap-2"
              style={{ background: 'linear-gradient(135deg, #1DD2D7, #1DD7CE)' }}
              onClick={handleImport}
              disabled={importLoading}
            >
              {importLoading ? (
                <><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Importing...</>
              ) : (
                <><Download className="h-3.5 w-3.5" /> Import</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Delete Lead?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action is permanent and cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl border-border/60 text-sm" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

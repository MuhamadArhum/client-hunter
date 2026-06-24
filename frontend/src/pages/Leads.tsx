import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, Download, AtSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-cyan-100 text-cyan-700',
  contacted: 'bg-amber-100 text-amber-700',
  proposal_sent: 'bg-violet-100 text-violet-700',
  follow_up: 'bg-indigo-100 text-indigo-700',
  converted: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-rose-100 text-rose-700',
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

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

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
      setImportMsg(`Successfully imported ${count} lead(s).`);
      fetchLeads();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setImportMsg(err?.response?.data?.message || 'Import failed.');
    } finally {
      setImportLoading(false);
    }
  };

  const handleBulkEnrich = async () => {
    setBulkEnrichLoading(true); setBulkEnrichMsg('');
    try {
      const res = await api.post('/leads/bulk-enrich');
      setBulkEnrichMsg(res.data?.message || 'Enrichment started!');
      setTimeout(() => { setBulkEnrichMsg(''); fetchLeads(); }, 3000);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setBulkEnrichMsg(err?.response?.data?.message || 'Enrichment failed.');
    } finally { setBulkEnrichLoading(false); }
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

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground">{pagination.total} total leads</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {bulkEnrichMsg && (
            <span className="text-xs text-cyan-700 bg-cyan-50 px-2 py-1 rounded self-center">{bulkEnrichMsg}</span>
          )}
          <Button variant="outline" onClick={handleBulkEnrich} disabled={bulkEnrichLoading}>
            <AtSign className="mr-2 h-4 w-4" />
            {bulkEnrichLoading ? 'Finding Emails...' : 'Find Emails'}
          </Button>
          <Button variant="outline" onClick={() => { setImportMsg(''); setImportOpen(true); }}>
            <Download className="mr-2 h-4 w-4" />
            Auto Import
          </Button>
          <Button onClick={() => { setAddError(''); setAddForm({ ...emptyForm }); setAddOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            className="pl-9"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>AI Score</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(7)].map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    No leads found.
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead._id}>
                    <TableCell
                      className="font-medium text-primary cursor-pointer hover:underline"
                      onClick={() => navigate(`/leads/${lead._id}`)}
                    >
                      {lead.companyName}
                    </TableCell>
                    <TableCell>{lead.contactName || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{lead.email || '—'}</TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', STATUS_COLORS[lead.status] || '')}>
                        {lead.status?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {lead.aiScore != null ? (
                        <span className={cn(
                          'text-xs font-bold px-2 py-0.5 rounded-full',
                          lead.aiQualification === 'hot' ? 'bg-rose-100 text-rose-700' :
                          lead.aiQualification === 'warm' ? 'bg-amber-100 text-amber-700' :
                          'bg-sky-100 text-sky-700'
                        )}>
                          {lead.aiQualification === 'hot' ? '🔥' : lead.aiQualification === 'warm' ? '🟡' : '🔵'} {lead.aiScore}/10
                        </span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{lead.source}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(lead._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {addError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{addError}</p>
            )}
            <div className="space-y-1">
              <Label>Company Name *</Label>
              <Input
                value={addForm.companyName}
                onChange={(e) => setAddForm((f) => ({ ...f, companyName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Contact Name</Label>
                <Input
                  value={addForm.contactName}
                  onChange={(e) => setAddForm((f) => ({ ...f, contactName: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input
                  value={addForm.phone}
                  onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Website</Label>
                <Input
                  value={addForm.website}
                  onChange={(e) => setAddForm((f) => ({ ...f, website: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Source</Label>
              <Select
                value={addForm.source}
                onValueChange={(v) => setAddForm((f) => ({ ...f, source: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Industry</Label>
                <Input
                  value={addForm.industry}
                  onChange={(e) => setAddForm((f) => ({ ...f, industry: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Budget</Label>
                <Input
                  value={addForm.budget}
                  onChange={(e) => setAddForm((f) => ({ ...f, budget: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={addForm.description}
                onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={addLoading}>
              {addLoading ? 'Adding...' : 'Add Lead'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto Import Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Auto Import Leads</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {importMsg && (
              <p className={cn(
                'text-sm rounded p-2',
                importMsg.startsWith('Successfully')
                  ? 'text-cyan-700 bg-cyan-50'
                  : 'text-destructive bg-destructive/10',
              )}>
                {importMsg}
              </p>
            )}
            <div className="space-y-1">
              <Label>Source</Label>
              <Select value={importSource} onValueChange={setImportSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.filter((s) => s !== 'manual').map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Search Query</Label>
              <Input
                placeholder="e.g. React developer New York"
                value={importQuery}
                onChange={(e) => setImportQuery(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button onClick={handleImport} disabled={importLoading}>
              {importLoading ? 'Importing...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this lead? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

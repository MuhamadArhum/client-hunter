import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, Download, AtSign, Users, ExternalLink, Upload, FileDown, Tag, Eye, Mail, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
  tags?: string[];
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  new:           { bg: '#ECFDF5', text: '#065F46', dot: '#10B981', border: '#A7F3D0' },
  contacted:     { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B', border: '#FDE68A' },
  proposal_sent: { bg: '#F5F3FF', text: '#4C1D95', dot: '#8B5CF6', border: '#DDD6FE' },
  follow_up:     { bg: '#EEF2FF', text: '#3730A3', dot: '#6366F1', border: '#C7D2FE' },
  converted:     { bg: '#D1FAE5', text: '#064E3B', dot: '#21F6A8', border: '#6EE7B7' },
  lost:          { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444', border: '#FECACA' },
};

const SOURCE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  manual:     { bg: '#F8FAFC', color: '#475569', border: '#CBD5E1' },
  upwork:     { bg: '#F0FDF9', color: '#065F46', border: '#A7F3D0' },
  freelancer: { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  crunchbase: { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  clutch:     { bg: '#FFF1F2', color: '#BE123C', border: '#FECDD3' },
  linkedin:   { bg: '#F0F9FF', color: '#0369A1', border: '#BAE6FD' },
};

const SOURCES = ['manual', 'upwork', 'freelancer', 'crunchbase', 'clutch', 'linkedin'];
const STATUSES = ['new', 'contacted', 'proposal_sent', 'follow_up', 'converted', 'lost'];

const emptyForm = {
  companyName: '', contactName: '', email: '', phone: '',
  website: '', source: 'manual', industry: '', budget: '', description: '',
};

const CSV_TEMPLATE = `companyName,contactName,email,phone,website,source,industry,budget,description
Acme Corp,John Smith,john@acme.com,+1234567890,https://acme.com,manual,SaaS,$5k-$10k,Looking for a web redesign
Beta Inc,Jane Doe,jane@beta.com,+0987654321,https://beta.com,linkedin,E-commerce,$2k-$5k,Needs mobile app
`;

function getInitials(name: string) {
  return name?.slice(0, 2).toUpperCase() || '??';
}

function AiScoreBadge({ score, qualification }: { score: number; qualification?: string }) {
  const isHot  = qualification === 'hot'  || score >= 8;
  const isWarm = qualification === 'warm' || (score >= 5 && score < 8);

  const style = isHot
    ? { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' }
    : isWarm
    ? { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' }
    : { bg: '#EEF2FF', color: '#3730A3', border: '#C7D2FE' };

  const emoji = isHot ? '🔥' : isWarm ? '⚡' : '❄️';
  const label = isHot ? 'Hot' : isWarm ? 'Warm' : 'Cold';

  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg"
      style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
    >
      {emoji} {score}/10 <span className="font-medium">{label}</span>
    </span>
  );
}

function LightInput({ placeholder, value, onChange, type = 'text', className = '' }: {
  placeholder: string; value: string; onChange: (v: string) => void; type?: string; className?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full h-9 px-3 text-sm rounded-xl outline-none transition-all ${className}`}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        color: '#111827',
      }}
      onFocus={(e) => {
        e.target.style.borderColor = '#21F6A8';
        e.target.style.boxShadow = '0 0 0 3px rgba(33,246,168,0.12)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = '#E5E7EB';
        e.target.style.boxShadow = 'none';
      }}
    />
  );
}

type SortKey = 'companyName' | 'contactName' | 'status' | 'aiScore' | 'source';
type SortDir = 'asc' | 'desc';

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey | null; sortDir: SortDir }) {
  if (sortKey !== col) return <ChevronsUpDown className="h-3 w-3 ml-1 opacity-30" />;
  return sortDir === 'asc'
    ? <ChevronUp className="h-3 w-3 ml-1" style={{ color: '#21F6A8' }} />
    : <ChevronDown className="h-3 w-3 ml-1" style={{ color: '#21F6A8' }} />;
}

export default function Leads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

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

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState('');
  const [csvRowCount, setCsvRowCount] = useState(0);
  const [csvImportLoading, setCsvImportLoading] = useState(false);
  const [csvImportMsg, setCsvImportMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchLeads = useCallback(() => {
    setLoading(true);
    const params: Record<string, string | number> = { page, limit: 10, search };
    if (statusFilter !== 'all') params.status = statusFilter;
    if (sourceFilter !== 'all') params.source = sourceFilter;
    api
      .get('/leads', { params })
      .then((res) => {
        setLeads(Array.isArray(res.data?.data) ? res.data.data : []);
        setPagination(res.data?.pagination || { total: 0, page: 1, limit: 10, pages: 1 });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, statusFilter, sourceFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => { setSelectedIds(new Set()); }, [leads]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedLeads = [...leads].sort((a, b) => {
    if (!sortKey) return 0;
    let av: string | number = '';
    let bv: string | number = '';
    if (sortKey === 'aiScore') {
      av = a.aiScore ?? -1;
      bv = b.aiScore ?? -1;
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    }
    av = (a[sortKey] ?? '') as string;
    bv = (b[sortKey] ?? '') as string;
    return sortDir === 'asc'
      ? av.localeCompare(bv)
      : bv.localeCompare(av);
  });

  const handleAdd = async () => {
    if (!addForm.companyName.trim()) { setAddError('Company name is required.'); return; }
    setAddLoading(true); setAddError('');
    try {
      await api.post('/leads', addForm);
      setAddOpen(false); setAddForm({ ...emptyForm }); fetchLeads();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setAddError(err?.response?.data?.message || 'Failed to add lead.');
    } finally { setAddLoading(false); }
  };

  const handleImport = async () => {
    if (!importQuery.trim()) { setImportMsg('Please enter a search query.'); return; }
    setImportLoading(true); setImportMsg('');
    try {
      const res = await api.post('/leads/scrape', { source: importSource, query: importQuery });
      const count = res.data?.data?.length || 0;
      setImportMsg(`✓ Successfully imported ${count} lead(s).`);
      fetchLeads();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setImportMsg(err?.response?.data?.message || 'Import failed.');
    } finally { setImportLoading(false); }
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
      setDeleteId(null); fetchLeads();
    } catch (e) { console.error(e); }
    finally { setDeleteLoading(false); }
  };

  const allSelected = leads.length > 0 && leads.every((l) => selectedIds.has(l._id));
  const someSelected = selectedIds.size > 0;
  const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(leads.map((l) => l._id)));
  const toggleOne = (id: string) => setSelectedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleBulkDelete = async () => {
    setBulkDeleteLoading(true);
    try {
      await api.delete('/leads/bulk-delete', { data: { ids: [...selectedIds] } });
      setBulkDeleteOpen(false); setSelectedIds(new Set()); fetchLeads();
    } catch (e) { console.error(e); }
    finally { setBulkDeleteLoading(false); }
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search) params.set('search', search);
    const token = localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
    fetch(`${baseUrl}/leads/export/csv?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob()).then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'leads.csv'; a.click();
        URL.revokeObjectURL(url);
      }).catch(console.error);
  };

  const handleExportSelected = () => {
    const params = new URLSearchParams();
    [...selectedIds].forEach((id) => params.append('ids', id));
    const token = localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
    fetch(`${baseUrl}/leads/export/csv?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob()).then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'leads-selected.csv'; a.click();
        URL.revokeObjectURL(url);
      }).catch(console.error);
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file); setCsvImportMsg('');
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setCsvText(text);
      const rows = text.split('\n').filter((r) => r.trim().length > 0);
      setCsvRowCount(Math.max(0, rows.length - 1));
    };
    reader.readAsText(file);
  };

  const handleCsvImport = async () => {
    if (!csvText.trim()) { setCsvImportMsg('Please select a CSV file.'); return; }
    setCsvImportLoading(true); setCsvImportMsg('');
    try {
      const res = await api.post('/leads/import/csv', { csvText });
      const count = res.data?.data?.length || res.data?.count || 0;
      setCsvImportMsg(`✓ Successfully imported ${count} lead(s).`);
      fetchLeads();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setCsvImportMsg(err?.response?.data?.message || 'CSV import failed.');
    } finally { setCsvImportLoading(false); }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'leads-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const openCsvImport = () => {
    setCsvFile(null); setCsvText(''); setCsvRowCount(0); setCsvImportMsg(''); setCsvImportOpen(true);
  };

  const hotLeads = leads.filter((l) => l.aiQualification === 'hot' || (l.aiScore ?? 0) >= 8).length;
  const convertedLeads = leads.filter((l) => l.status === 'converted').length;

  const SORTABLE_COLS: { key: SortKey; label: string }[] = [
    { key: 'companyName', label: 'Company' },
    { key: 'contactName', label: 'Contact' },
    { key: 'status',      label: 'Status' },
    { key: 'aiScore',     label: 'AI Score' },
    { key: 'source',      label: 'Source' },
  ];

  return (
    <div className="page-content space-y-5 p-5">

      {/* ── Hero Header ── */}
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-5"
        style={{
          background: 'linear-gradient(135deg, rgba(33,246,168,0.06) 0%, rgba(16,185,129,0.03) 50%, #FFFFFF 100%)',
          border: '1px solid #E5E7EB',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
          style={{ background: 'linear-gradient(90deg, transparent 0%, #21F6A8 35%, #10B981 65%, transparent 100%)' }} />
        <div className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(rgba(33,246,168,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-3.5 w-3.5" style={{ color: '#10B981' }} />
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#0D9C6A' }}>Pipeline</span>
            </div>
            <h1 className="text-2xl font-extrabold mb-1" style={{ color: '#111827' }}>Leads</h1>
            <p className="text-sm font-medium" style={{ color: '#6B7280' }}>
              {pagination.total} total leads
              {hotLeads > 0 && <> · <span style={{ color: '#DC2626', fontWeight: 700 }}>{hotLeads} 🔥 hot</span></>}
              {convertedLeads > 0 && <> · <span style={{ color: '#065F46', fontWeight: 700 }}>{convertedLeads} converted</span></>}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {bulkEnrichMsg && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-xl self-center"
                style={{ background: '#F0FDF9', color: '#065F46', border: '1px solid #A7F3D0' }}>
                {bulkEnrichMsg}
              </span>
            )}
            {[
              { icon: AtSign,   label: bulkEnrichLoading ? 'Finding...' : 'Find Emails', onClick: handleBulkEnrich, disabled: bulkEnrichLoading },
              { icon: FileDown, label: 'Export CSV',   onClick: handleExportCSV,   disabled: false },
              { icon: Upload,   label: 'Import CSV',   onClick: openCsvImport,     disabled: false },
              { icon: Download, label: 'Auto Import',  onClick: () => { setImportMsg(''); setImportOpen(true); }, disabled: false },
            ].map(({ icon: Icon, label, onClick, disabled }) => (
              <button
                key={label}
                onClick={onClick}
                disabled={disabled}
                className="flex items-center gap-2 text-sm font-medium px-3 h-9 rounded-xl transition-all disabled:opacity-50"
                style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#4B5563' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#D1D5DB'; (e.currentTarget as HTMLButtonElement).style.color = '#111827'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLButtonElement).style.color = '#4B5563'; }}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
            <button
              onClick={() => { setAddError(''); setAddForm({ ...emptyForm }); setAddOpen(true); }}
              className="flex items-center gap-2 text-sm font-bold px-4 h-9 rounded-xl transition-all hover:brightness-105"
              style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)', color: '#0a0f0a', boxShadow: '0 4px 16px rgba(33,246,168,0.25)' }}
            >
              <Plus className="h-3.5 w-3.5" /> Add Lead
            </button>
          </div>
        </div>
      </div>

      {/* ── Bulk Action Bar ── */}
      {someSelected && (
        <div
          className="flex items-center justify-between rounded-xl px-4 py-2.5 gap-3"
          style={{ background: '#F0FDF9', border: '1px solid rgba(33,246,168,0.3)' }}
        >
          <span className="text-sm font-bold" style={{ color: '#065F46' }}>
            {selectedIds.size} lead{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportSelected}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 h-8 rounded-lg transition-colors"
              style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46' }}
            >
              <FileDown className="h-3.5 w-3.5" /> Export Selected
            </button>
            <button
              onClick={() => setBulkDeleteOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 h-8 rounded-lg transition-colors"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B' }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* ── Search + Status Chips + Source Filter ── */}
      <div className="space-y-3">
        {/* Search bar + source select */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none" style={{ color: '#9CA3AF' }} />
            <input
              placeholder="Search by company, contact or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-11 pl-10 pr-4 text-sm rounded-xl outline-none transition-all"
              style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#111827' }}
              onFocus={(e) => { e.target.style.borderColor = '#21F6A8'; e.target.style.boxShadow = '0 0 0 3px rgba(33,246,168,0.12)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-36 h-11 rounded-xl text-sm border-[#E5E7EB] bg-white text-[#111827]">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Sources</SelectItem>
              {SOURCES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Status filter chips */}
        <div className="flex flex-wrap gap-2">
          {['all', ...STATUSES].map((s) => {
            const isActive = statusFilter === s;
            const sStyle = s !== 'all' ? STATUS_STYLES[s] : null;
            return (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 h-7 rounded-full transition-all"
                style={isActive
                  ? sStyle
                    ? { background: sStyle.bg, color: sStyle.text, border: `1.5px solid ${sStyle.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                    : { background: '#111827', color: '#FFFFFF', border: '1.5px solid #111827' }
                  : { background: '#F9FAFB', color: '#6B7280', border: '1px solid #E5E7EB' }
                }
              >
                {isActive && sStyle && <span className="h-1.5 w-1.5 rounded-full" style={{ background: sStyle.dot }} />}
                {s === 'all' ? 'All Statuses' : s.replace(/_/g, ' ')}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Leads Table ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #F3F4F6', background: '#F9FAFB' }}>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded cursor-pointer accent-emerald-500"
                    checked={allSelected}
                    onChange={toggleAll}
                  />
                </th>
                {SORTABLE_COLS.map(({ key, label }) => (
                  <th
                    key={key}
                    className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap cursor-pointer select-none"
                    style={{ color: '#9CA3AF' }}
                    onClick={() => handleSort(key)}
                  >
                    <span className="inline-flex items-center">
                      {label}
                      <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td className="px-4 py-3.5">
                      <div className="h-4 w-4 rounded animate-pulse" style={{ background: '#F3F4F6' }} />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl shrink-0 animate-pulse" style={{ background: '#F3F4F6' }} />
                        <div className="space-y-2">
                          <div className="h-3.5 w-28 rounded animate-pulse" style={{ background: '#F3F4F6' }} />
                          <div className="h-3 w-20 rounded animate-pulse" style={{ background: '#F9FAFB' }} />
                        </div>
                      </div>
                    </td>
                    {[24, 20, 20, 16, 16].map((w, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className={`h-4 w-${w} rounded animate-pulse`} style={{ background: '#F3F4F6' }} />
                      </td>
                    ))}
                    <td className="px-4 py-3.5" />
                  </tr>
                ))
              ) : sortedLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: '#F0FDF9' }}>
                        <Users className="h-6 w-6" style={{ color: '#9CA3AF' }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#111827' }}>No leads found</p>
                        <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Try adjusting filters or add a new lead</p>
                      </div>
                      <button
                        className="mt-1 flex items-center gap-1.5 text-xs font-bold px-4 h-8 rounded-xl"
                        style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)', color: '#0a0f0a' }}
                        onClick={() => { setAddError(''); setAddForm({ ...emptyForm }); setAddOpen(true); }}
                      >
                        <Plus className="h-3.5 w-3.5" /> Add First Lead
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedLeads.map((lead, idx) => {
                  const statusStyle = STATUS_STYLES[lead.status] || STATUS_STYLES.new;
                  const sourceStyle = SOURCE_STYLES[lead.source] || SOURCE_STYLES.manual;
                  const isLast = idx === sortedLeads.length - 1;
                  const isSelected = selectedIds.has(lead._id);
                  return (
                    <tr
                      key={lead._id}
                      role="button"
                      tabIndex={0}
                      className="group cursor-pointer transition-colors duration-100"
                      style={{
                        borderBottom: isLast ? 'none' : '1px solid #F3F4F6',
                        background: isSelected ? 'rgba(33,246,168,0.04)' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = '#F9FAFB';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                      }}
                      onClick={() => navigate(`/leads/${lead._id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/leads/${lead._id}`); }
                      }}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded cursor-pointer accent-emerald-500"
                          checked={isSelected}
                          onChange={() => toggleOne(lead._id)}
                        />
                      </td>

                      {/* Company */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black"
                            style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)', color: '#0a0f0a' }}
                          >
                            {getInitials(lead.companyName)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate group-hover:text-[#10B981] transition-colors duration-100"
                              style={{ color: '#111827' }}>
                              {lead.companyName}
                            </p>
                            {lead.industry && (
                              <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>{lead.industry}</p>
                            )}
                            {lead.website && (
                              <a
                                href={lead.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-0.5 truncate max-w-[140px] text-xs transition-colors"
                                style={{ color: '#10B981' }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#065F46'; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#10B981'; }}
                              >
                                <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                                {lead.website.replace(/^https?:\/\//, '')}
                              </a>
                            )}
                            {(lead.tags?.length ?? 0) > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {lead.tags!.map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                                    style={{ background: '#F0FDF9', color: '#065F46', border: '1px solid #A7F3D0' }}
                                  >
                                    <Tag className="h-2.5 w-2.5" />{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact (with email below name) */}
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-medium whitespace-nowrap" style={{ color: '#374151' }}>
                          {lead.contactName || '—'}
                        </p>
                        {lead.email ? (
                          <a
                            href={`mailto:${lead.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-xs truncate max-w-[160px] mt-0.5 transition-colors"
                            style={{ color: '#10B981' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#065F46'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#10B981'; }}
                          >
                            <Mail className="h-2.5 w-2.5 shrink-0" />
                            {lead.email}
                          </a>
                        ) : (
                          <span className="text-xs mt-0.5 block" style={{ color: '#D1D5DB' }}>No email</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap capitalize"
                          style={{ background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}` }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusStyle.dot }} />
                          {lead.status?.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* AI Score */}
                      <td className="px-4 py-3.5">
                        {lead.aiScore != null ? (
                          <AiScoreBadge score={lead.aiScore} qualification={lead.aiQualification} />
                        ) : (
                          <span className="text-xs" style={{ color: '#D1D5DB' }}>—</span>
                        )}
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3.5">
                        <span
                          className="inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full capitalize"
                          style={{ background: sourceStyle.bg, color: sourceStyle.color, border: `1px solid ${sourceStyle.border}` }}
                        >
                          {lead.source}
                        </span>
                      </td>

                      {/* Quick Actions */}
                      <td className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button
                            title="Send Email"
                            className="h-7 w-7 rounded-lg flex items-center justify-center transition-all"
                            style={{ color: '#9CA3AF' }}
                            onClick={() => navigate(`/leads/${lead._id}`)}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#10B981'; (e.currentTarget as HTMLButtonElement).style.background = '#F0FDF9'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </button>
                          <button
                            title="View Detail"
                            className="h-7 w-7 rounded-lg flex items-center justify-center transition-all"
                            style={{ color: '#9CA3AF' }}
                            onClick={() => navigate(`/leads/${lead._id}`)}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#374151'; (e.currentTarget as HTMLButtonElement).style.background = '#F9FAFB'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            title="Delete"
                            className="h-7 w-7 rounded-lg flex items-center justify-center transition-all"
                            style={{ color: '#9CA3AF' }}
                            onClick={() => setDeleteId(lead._id)}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#DC2626'; (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: '#9CA3AF' }}>
            Showing {((page - 1) * 10) + 1}–{Math.min(page * 10, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
              className="text-xs font-semibold px-3 h-8 rounded-lg transition-all disabled:opacity-30"
              style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#4B5563' }}
            >
              Prev
            </button>
            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className="h-8 w-8 text-xs font-bold rounded-lg transition-all"
                style={page === p
                  ? { background: 'linear-gradient(135deg, #21F6A8, #10B981)', color: '#0a0f0a', border: 'none' }
                  : { background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#4B5563' }
                }
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pagination.pages}
              className="text-xs font-semibold px-3 h-8 rounded-lg transition-all disabled:opacity-30"
              style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#4B5563' }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ── Add Lead Dialog ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}>
                <Plus className="h-3.5 w-3.5 text-gray-900" />
              </span>
              Add New Lead
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            {addError && (
              <div className="text-sm rounded-xl p-3 bg-rose-50 text-rose-700 border border-rose-200">{addError}</div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Company Name *</Label>
              <LightInput placeholder="Acme Corp" value={addForm.companyName} onChange={(v) => setAddForm((f) => ({ ...f, companyName: v }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Contact Name</Label>
                <LightInput placeholder="John Smith" value={addForm.contactName} onChange={(v) => setAddForm((f) => ({ ...f, contactName: v }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Email</Label>
                <LightInput type="email" placeholder="john@acme.com" value={addForm.email} onChange={(v) => setAddForm((f) => ({ ...f, email: v }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Phone</Label>
                <LightInput placeholder="+1 234 567 890" value={addForm.phone} onChange={(v) => setAddForm((f) => ({ ...f, phone: v }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Website</Label>
                <LightInput placeholder="https://acme.com" value={addForm.website} onChange={(v) => setAddForm((f) => ({ ...f, website: v }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Source</Label>
              <Select value={addForm.source} onValueChange={(v) => setAddForm((f) => ({ ...f, source: v }))}>
                <SelectTrigger className="h-9 rounded-xl border-border/60 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {SOURCES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Industry</Label>
                <LightInput placeholder="SaaS, E-commerce..." value={addForm.industry} onChange={(v) => setAddForm((f) => ({ ...f, industry: v }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Budget</Label>
                <LightInput placeholder="$5k–$10k" value={addForm.budget} onChange={(v) => setAddForm((f) => ({ ...f, budget: v }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Notes / Description</Label>
              <Textarea
                className="rounded-xl border-border/60 text-sm resize-none"
                rows={3}
                placeholder="Any additional context..."
                value={addForm.description}
                onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl border-border/60 text-sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl text-sm font-bold text-gray-900 gap-2"
              style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}
              onClick={handleAdd} disabled={addLoading}
            >
              {addLoading
                ? <><span className="h-3.5 w-3.5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" /> Adding...</>
                : <><Plus className="h-3.5 w-3.5" /> Add Lead</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Auto Import Dialog ── */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}>
                <Download className="h-3.5 w-3.5 text-gray-900" />
              </span>
              Auto Import Leads
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            {importMsg && (
              <div className={`text-sm rounded-xl p-3 border ${importMsg.startsWith('✓') ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'}`}>
                {importMsg}
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Platform</Label>
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
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Search Query</Label>
              <LightInput
                placeholder="e.g. React developer New York"
                value={importQuery}
                onChange={setImportQuery}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl border-border/60 text-sm" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl text-sm font-bold text-gray-900 gap-2"
              style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}
              onClick={handleImport} disabled={importLoading}
            >
              {importLoading
                ? <><span className="h-3.5 w-3.5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" /> Importing...</>
                : <><Download className="h-3.5 w-3.5" /> Import</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── CSV Import Dialog ── */}
      <Dialog open={csvImportOpen} onOpenChange={setCsvImportOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}>
                <Upload className="h-3.5 w-3.5 text-gray-900" />
              </span>
              Import CSV
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            {csvImportMsg && (
              <div className={`text-sm rounded-xl p-3 border ${csvImportMsg.startsWith('✓') ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'}`}>
                {csvImportMsg}
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">CSV File</Label>
                <button className="text-xs font-semibold underline" style={{ color: '#10B981' }} onClick={handleDownloadTemplate}>
                  Download Template
                </button>
              </div>
              <div
                className="relative rounded-xl border-2 border-dashed border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer p-6 text-center"
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvFileChange} />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                {csvFile ? (
                  <div>
                    <p className="text-sm font-semibold text-foreground">{csvFile.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{csvRowCount} rows detected</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-foreground">Click to select a CSV file</p>
                    <p className="text-xs text-muted-foreground mt-1">Supports: companyName, contactName, email, phone, website, source, industry, budget</p>
                  </div>
                )}
              </div>
            </div>
            {csvFile && csvRowCount > 0 && (
              <div className="rounded-xl p-3" style={{ background: '#F0FDF9', border: '1px solid #A7F3D0' }}>
                <p className="text-xs font-semibold" style={{ color: '#065F46' }}>
                  Ready to import <span className="font-black">{csvRowCount}</span> lead{csvRowCount !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl border-border/60 text-sm" onClick={() => setCsvImportOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl text-sm font-bold text-gray-900 gap-2"
              style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}
              onClick={handleCsvImport} disabled={csvImportLoading || !csvText.trim()}
            >
              {csvImportLoading
                ? <><span className="h-3.5 w-3.5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" /> Importing...</>
                : <><Upload className="h-3.5 w-3.5" /> Import {csvRowCount > 0 ? `${csvRowCount} Leads` : ''}</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Delete Lead?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action is permanent and cannot be undone.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl border-border/60 text-sm" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              className="rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
              onClick={handleDelete} disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Delete Dialog ── */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Delete {selectedIds.size} Lead{selectedIds.size !== 1 ? 's' : ''}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete {selectedIds.size} selected lead{selectedIds.size !== 1 ? 's' : ''}. This cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl border-border/60 text-sm" onClick={() => setBulkDeleteOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl text-sm font-bold text-white gap-2"
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
              onClick={handleBulkDelete} disabled={bulkDeleteLoading}
            >
              {bulkDeleteLoading
                ? <><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Deleting...</>
                : `Delete ${selectedIds.size} Lead${selectedIds.size !== 1 ? 's' : ''}`
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

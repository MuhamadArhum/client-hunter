import { useEffect, useState, useCallback, useRef } from 'react';
import {
  LayoutTemplate, Plus, Trash2, Pencil, Copy, Check, Sparkles,
  X, Search, Tag, Clock, TrendingUp,
} from 'lucide-react';
import AppPagination, { type PaginationMeta } from '@/components/ui/AppPagination';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import api from '@/services/api';

type Category = 'cold-outreach' | 'follow-up' | 'proposal' | 'general';

interface Template {
  _id: string;
  name: string;
  subject: string;
  body: string;
  category: Category;
  usageCount: number;
  createdAt: string;
}

const CATEGORY_META: Record<Category | 'all', { label: string; color: string; bg: string }> = {
  all:             { label: 'All Templates', color: '#1B1F2B', bg: 'rgba(110,125,121,0.1)' },
  'cold-outreach': { label: 'Cold Outreach', color: '#1FB2A6', bg: 'rgba(31,178,166,0.12)' },
  'follow-up':     { label: 'Follow Up',     color: '#C98A1E', bg: 'rgba(201,138,30,0.14)' },
  proposal:        { label: 'Proposal',      color: '#3E8E5A', bg: 'rgba(62,142,90,0.12)'  },
  general:         { label: 'General',       color: '#6E7D79', bg: 'rgba(110,125,121,0.1)' },
};

const EMPTY_FORM = { name: '', subject: '', body: '', category: 'general' as Category };

const labelSt: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 10.5,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#6E7D79',
};

const inputSt: React.CSSProperties = { borderRadius: 4, border: '1px solid #CBD3CF', fontSize: 13 };

function CategoryBadge({ category }: { category: Category }) {
  const meta = CATEGORY_META[category];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold"
      style={{ background: meta.bg, color: meta.color, borderRadius: 10, fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase' }}
    >
      <Tag className="h-2.5 w-2.5" />
      {meta.label}
    </span>
  );
}

const DEFAULT_PAGINATION: PaginationMeta = { total: 0, page: 1, limit: 12, pages: 1 };

export default function Templates() {
  const [templates, setTemplates]   = useState<Template[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filterCat, setFilterCat]   = useState<'all' | Category>('all');
  const [search, setSearch]         = useState('');
  const [pagination, setPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [catCounts, setCatCounts]   = useState<Record<string, number>>({ all: 0 });
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState<Template | null>(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [aiLoading, setAiLoading]   = useState(false);
  const [copied, setCopied]         = useState<string | null>(null);
  const [deleting, setDeleting]     = useState<string | null>(null);
  const [error, setError]           = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const fetchTemplates = useCallback(async (page = 1, cat = filterCat, q = search) => {
    setLoading(true);
    try {
      const res = await api.get('/templates', {
        params: { page, limit: 12, category: cat !== 'all' ? cat : undefined, search: q || undefined },
      });
      setTemplates(Array.isArray(res.data?.data) ? res.data.data : []);
      setPagination(res.data?.pagination || DEFAULT_PAGINATION);
      if (res.data?.categoryCounts) setCatCounts(res.data.categoryCounts);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [filterCat, search]);

  useEffect(() => { fetchTemplates(1, filterCat, search); }, [filterCat]);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchTemplates(1, filterCat, search), 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const handleCatChange = (cat: 'all' | Category) => { setFilterCat(cat); };

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setError(''); setModalOpen(true); };
  const openEdit = (t: Template) => {
    setEditing(t);
    setForm({ name: t.name, subject: t.subject, body: t.body, category: t.category });
    setError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) { setError('All fields are required.'); return; }
    setSaving(true); setError('');
    try {
      if (editing) await api.put(`/templates/${editing._id}`, form);
      else await api.post('/templates', form);
      setModalOpen(false);
      fetchTemplates();
    } catch {
      setError('Failed to save template. Please try again.');
    } finally { setSaving(false); }
  };

  const handlePageChange = (p: number) => fetchTemplates(p, filterCat, search);
  const handleLimitChange = (l: number) => { setPagination((prev) => ({ ...prev, limit: l })); fetchTemplates(1, filterCat, search); };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try { await api.delete(`/templates/${id}`); setTemplates((prev) => prev.filter((t) => t._id !== id)); }
    catch {} finally { setDeleting(null); }
  };

  const handleCopy = async (t: Template) => {
    const text = `Subject: ${t.subject}\n\n${t.body}`;
    await navigator.clipboard.writeText(text);
    setCopied(t._id);
    await api.post(`/templates/${t._id}/use`).catch(() => {});
    setTemplates((prev) => prev.map((x) => x._id === t._id ? { ...x, usageCount: x.usageCount + 1 } : x));
    setTimeout(() => setCopied(null), 2000);
  };

  const handleAiGenerate = async () => {
    if (!form.category) return;
    setAiLoading(true); setError('');
    try {
      const prompt = `Write a professional email template for "${CATEGORY_META[form.category as Category].label}" outreach for a software agency. Return JSON with keys: subject, body. No markdown fences.`;
      const res = await api.post('/chat', { message: prompt });
      const raw: string = res.data?.data?.message || res.data?.reply || '';
      const jsonStr = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      if (parsed.subject) setForm((f) => ({ ...f, subject: parsed.subject, body: parsed.body || f.body }));
    } catch {
      setError('AI generation failed. Please try again or write manually.');
    } finally { setAiLoading(false); }
  };

  return (
    <div className="space-y-5 p-6" style={{ background: '#E6E9E5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, borderTop: '3px solid #1FB2A6', padding: '20px 24px' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutTemplate className="h-4 w-4" style={{ color: '#1FB2A6' }} />
              <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1FB2A6' }}>Templates</span>
            </div>
            <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1B1F2B', marginBottom: 4 }}>Email Templates</h1>
            <p style={{ fontSize: 13, color: '#6E7D79' }}>
              {pagination.total.toLocaleString()} template{pagination.total !== 1 ? 's' : ''} — reuse your best outreach messages
            </p>
          </div>
          <button
            onClick={openCreate}
            className="h-9 px-4 gap-2 flex items-center text-sm font-semibold text-white"
            style={{ background: '#1FB2A6', borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" }}
          >
            <Plus className="h-4 w-4" /> New Template
          </button>
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(Object.keys(CATEGORY_META) as (keyof typeof CATEGORY_META)[]).map((cat) => {
          const meta = CATEGORY_META[cat];
          const active = filterCat === cat;
          return (
            <button
              key={cat}
              onClick={() => handleCatChange(cat as 'all' | Category)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all"
              style={active ? {
                background: meta.bg, color: meta.color,
                border: `1px solid ${meta.color}60`, borderRadius: 4,
                fontFamily: "'IBM Plex Mono', monospace",
              } : {
                background: '#F1F4F0', color: '#6E7D79',
                border: '1px solid #CBD3CF', borderRadius: 4,
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              {meta.label}
              <span
                className="px-1.5 py-0.5 text-[10px] font-bold"
                style={active
                  ? { background: `${meta.color}20`, color: meta.color, borderRadius: 10 }
                  : { background: '#E6E9E5', color: '#6E7D79', borderRadius: 10 }}
              >
                {catCounts[cat] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: '#9CADB0' }} />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates..."
          className="pl-8 h-9 text-sm"
          style={inputSt}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#9CADB0', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Templates grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-5 animate-pulse space-y-3" style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, borderTop: '3px solid #CBD3CF' }}>
              <div className="h-4 rounded w-2/3" style={{ background: '#CBD3CF' }} />
              <div className="h-3 rounded w-1/3" style={{ background: '#CBD3CF' }} />
              <div className="h-16 rounded" style={{ background: '#CBD3CF' }} />
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center" style={{ background: '#F1F4F0', border: '1px dashed #CBD3CF', borderRadius: 4 }}>
          <div className="flex h-14 w-14 items-center justify-center mb-4" style={{ background: 'rgba(31,178,166,0.08)', borderRadius: 4 }}>
            <LayoutTemplate className="h-6 w-6" style={{ color: '#6E7D79' }} />
          </div>
          <h3 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 16, fontWeight: 600, textTransform: 'uppercase', color: '#1B1F2B', marginBottom: 4 }}>No templates found</h3>
          <p style={{ fontSize: 13, color: '#6E7D79', marginBottom: 16 }}>
            {search ? 'Try a different search term.' : 'Create your first email template to get started.'}
          </p>
          {!search && (
            <button
              onClick={openCreate}
              className="h-9 px-4 gap-2 flex items-center text-sm font-semibold text-white"
              style={{ background: '#1FB2A6', borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" }}
            >
              <Plus className="h-3.5 w-3.5" /> Create Template
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {templates.map((t) => (
              <TemplateCard
                key={t._id}
                template={t}
                onEdit={openEdit}
                onDelete={handleDelete}
                onCopy={handleCopy}
                deleting={deleting === t._id}
                copied={copied === t._id}
              />
            ))}
          </div>
          <AppPagination
            pagination={pagination}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            limitOptions={[12, 24, 48, 96]}
            className="mt-2"
          />
        </>
      )}

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ borderRadius: 4 }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="h-6 w-6 flex items-center justify-center" style={{ background: '#1FB2A6', borderRadius: 4 }}>
                <LayoutTemplate className="h-3.5 w-3.5 text-white" />
              </span>
              <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 15, fontWeight: 600, textTransform: 'uppercase', color: '#1B1F2B' }}>
                {editing ? 'Edit Template' : 'New Template'}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {error && (
              <div className="text-sm p-3" style={{ background: 'rgba(194,59,46,0.08)', border: '1px solid rgba(194,59,46,0.25)', borderRadius: 4, color: '#C23B2E' }}>
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label style={labelSt}>Template Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Cold Email v1"
                  className="h-9 text-sm"
                  style={inputSt}
                />
              </div>
              <div className="space-y-1.5">
                <Label style={labelSt}>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as Category }))}>
                  <SelectTrigger className="h-9 text-sm" style={inputSt}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ borderRadius: 4 }}>
                    <SelectItem value="cold-outreach">Cold Outreach</SelectItem>
                    <SelectItem value="follow-up">Follow Up</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label style={labelSt}>Subject Line</Label>
                <button
                  className="h-7 px-2.5 gap-1.5 text-xs font-semibold flex items-center"
                  style={{ background: 'rgba(31,178,166,0.08)', border: '1px solid rgba(31,178,166,0.25)', borderRadius: 4, color: '#1FB2A6', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif", opacity: aiLoading ? 0.7 : 1 }}
                  onClick={handleAiGenerate}
                  disabled={aiLoading}
                >
                  {aiLoading
                    ? <><span className="h-3 w-3 border-2 border-teal-300/30 border-t-teal-500 rounded-full animate-spin" /> Generating...</>
                    : <><Sparkles className="h-3 w-3" /> AI Generate</>
                  }
                </button>
              </div>
              <Input
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="e.g. Quick question about [Company]'s growth"
                className="h-9 text-sm"
                style={inputSt}
              />
            </div>

            <div className="space-y-1.5">
              <Label style={labelSt}>
                Email Body
                <span className="ml-2 normal-case font-normal" style={{ color: '#9CADB0', fontSize: 10 }}>Use {'{name}'}, {'{company}'} as placeholders</span>
              </Label>
              <Textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Write your email body here..."
                className="min-h-[200px] text-sm resize-none"
                style={inputSt}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <button
              style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, fontWeight: 600, padding: '0 16px', height: 34, borderRadius: 4, background: '#F1F4F0', border: '1px solid #CBD3CF', color: '#6E7D79', cursor: 'pointer' }}
              onClick={() => setModalOpen(false)}
            >Cancel</button>
            <button
              className="gap-2 flex items-center"
              style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, fontWeight: 700, padding: '0 16px', height: 34, borderRadius: 4, background: '#1FB2A6', border: 'none', color: '#fff', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? <><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                : editing ? 'Update Template' : 'Save Template'
              }
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TemplateCard({
  template, onEdit, onDelete, onCopy, deleting, copied,
}: {
  template: Template;
  onEdit: (t: Template) => void;
  onDelete: (id: string) => void;
  onCopy: (t: Template) => void;
  deleting: boolean;
  copied: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = CATEGORY_META[template.category];

  return (
    <div className="flex flex-col overflow-hidden" style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, borderTop: `3px solid ${meta.color}` }}>
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1B1F2B', fontFamily: "'IBM Plex Sans', sans-serif" }} className="truncate">{template.name}</p>
            <p style={{ fontSize: 11, color: '#6E7D79', marginTop: 2 }} className="truncate">{template.subject}</p>
          </div>
          <CategoryBadge category={template.category} />
        </div>

        {/* Body preview */}
        <div
          className={!expanded ? 'line-clamp-4' : ''}
          style={{ fontSize: 11, color: '#6E7D79', lineHeight: 1.6, background: 'rgba(203,211,207,0.25)', padding: '10px 12px', borderRadius: 4, cursor: 'pointer' }}
          onClick={() => setExpanded((v) => !v)}
        >
          {template.body}
        </div>
        {template.body.length > 200 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#189187', background: 'none', border: 'none', cursor: 'pointer', alignSelf: 'flex-start', marginTop: -4 }}
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-auto">
          <div className="flex items-center gap-1" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#9CADB0' }}>
            <TrendingUp className="h-3 w-3" />
            <span>{template.usageCount} uses</span>
          </div>
          <div className="flex items-center gap-1" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#9CADB0' }}>
            <Clock className="h-3 w-3" />
            <span>{new Date(template.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1" style={{ borderTop: '1px solid #CBD3CF' }}>
          <button
            onClick={() => onCopy(template)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold flex-1 justify-center"
            style={{
              borderRadius: 4,
              background: copied ? 'rgba(62,142,90,0.12)' : 'rgba(31,178,166,0.1)',
              color: copied ? '#3E8E5A' : '#1FB2A6',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            {copied ? <><Check className="h-3.5 w-3.5" /> Copied!</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
          </button>
          <button
            onClick={() => onEdit(template)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
            style={{ borderRadius: 4, background: '#F1F4F0', border: '1px solid #CBD3CF', color: '#6E7D79', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" }}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            onClick={() => onDelete(template._id)}
            disabled={deleting}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold"
            style={{ borderRadius: 4, background: 'rgba(194,59,46,0.08)', border: '1px solid rgba(194,59,46,0.2)', color: '#C23B2E', cursor: 'pointer', opacity: deleting ? 0.5 : 1, fontFamily: "'IBM Plex Sans', sans-serif" }}
          >
            {deleting
              ? <span className="h-3.5 w-3.5 border-2 border-red-300/30 border-t-red-400 rounded-full animate-spin" />
              : <Trash2 className="h-3.5 w-3.5" />
            }
          </button>
        </div>
      </div>
    </div>
  );
}

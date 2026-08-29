import { useEffect, useState, useCallback } from 'react';
import {
  LayoutTemplate, Plus, Trash2, Pencil, Copy, Check, Sparkles,
  X, Search, Tag, Clock, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
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
  all:            { label: 'All Templates', color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
  'cold-outreach':{ label: 'Cold Outreach',  color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  'follow-up':    { label: 'Follow Up',      color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  proposal:       { label: 'Proposal',       color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  general:        { label: 'General',        color: '#14B8A6', bg: 'rgba(20,184,166,0.1)' },
};

const EMPTY_FORM = { name: '', subject: '', body: '', category: 'general' as Category };

function CategoryBadge({ category }: { category: Category }) {
  const meta = CATEGORY_META[category];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: meta.bg, color: meta.color }}
    >
      <Tag className="h-2.5 w-2.5" />
      {meta.label}
    </span>
  );
}

export default function Templates() {
  const [templates, setTemplates]   = useState<Template[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filterCat, setFilterCat]   = useState<'all' | Category>('all');
  const [search, setSearch]         = useState('');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState<Template | null>(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [aiLoading, setAiLoading]   = useState(false);
  const [copied, setCopied]         = useState<string | null>(null);
  const [deleting, setDeleting]     = useState<string | null>(null);
  const [error, setError]           = useState('');

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/templates');
      setTemplates(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    setForm({ name: t.name, subject: t.subject, body: t.body, category: t.category });
    setError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) {
      setError('All fields are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await api.put(`/templates/${editing._id}`, form);
      } else {
        await api.post('/templates', form);
      }
      setModalOpen(false);
      fetchTemplates();
    } catch {
      setError('Failed to save template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await api.delete(`/templates/${id}`);
      setTemplates((prev) => prev.filter((t) => t._id !== id));
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
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
    setAiLoading(true);
    setError('');
    try {
      const prompt = `Write a professional email template for "${CATEGORY_META[form.category as Category].label}" outreach for a software agency. Return JSON with keys: subject, body. No markdown fences.`;
      const res = await api.post('/chat', { message: prompt });
      const raw: string = res.data?.data?.message || res.data?.reply || '';
      const jsonStr = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      if (parsed.subject) setForm((f) => ({ ...f, subject: parsed.subject, body: parsed.body || f.body }));
    } catch {
      setError('AI generation failed. Please try again or write manually.');
    } finally {
      setAiLoading(false);
    }
  };

  const filtered = templates.filter((t) => {
    const matchCat = filterCat === 'all' || t.category === filterCat;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const catCounts: Record<string, number> = { all: templates.length };
  templates.forEach((t) => { catCounts[t.category] = (catCounts[t.category] || 0) + 1; });

  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div className="page-header">
        <div className="absolute inset-0 opacity-40 rounded-2xl"
             style={{ backgroundImage: 'radial-gradient(rgba(99,102,241,0.08) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutTemplate className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary/70">Templates</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-gradient mb-1">Email Templates</h1>
            <p className="text-sm text-muted-foreground font-medium">
              {templates.length} template{templates.length !== 1 ? 's' : ''} — reuse your best outreach messages
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="h-9 gap-2 text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', color: '#fff' }}
          >
            <Plus className="h-4 w-4" /> New Template
          </Button>
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
              onClick={() => setFilterCat(cat as 'all' | Category)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={active ? {
                background: meta.bg, color: meta.color,
                border: `1px solid ${meta.color}40`,
              } : {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--muted-foreground))',
                border: '1px solid hsl(var(--border) / 0.6)',
              }}
            >
              {meta.label}
              <span
                className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={active ? { background: `${meta.color}20`, color: meta.color } : { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
              >
                {catCounts[cat] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates..."
          className="pl-8 h-9 text-sm rounded-lg border-border/60"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Templates grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-card p-5 animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-1/3" />
              <div className="h-16 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
               style={{ background: 'rgba(99,102,241,0.1)' }}>
            <LayoutTemplate className="h-6 w-6" style={{ color: '#6366F1' }} />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">No templates found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {search ? 'Try a different search term.' : 'Create your first email template to get started.'}
          </p>
          {!search && (
            <Button onClick={openCreate} size="sm" className="gap-2"
                    style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', color: '#fff' }}>
              <Plus className="h-3.5 w-3.5" /> Create Template
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((t) => (
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
      )}

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <LayoutTemplate className="h-4 w-4 text-primary" />
              {editing ? 'Edit Template' : 'New Template'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {error && (
              <div className="flex items-center gap-2 text-sm rounded-lg p-3 border bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Template Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Cold Email v1"
                  className="h-9 text-sm rounded-lg border-border/70"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as Category }))}>
                  <SelectTrigger className="h-9 text-sm rounded-lg border-border/70">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Subject Line</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/10"
                  onClick={handleAiGenerate}
                  disabled={aiLoading}
                >
                  {aiLoading
                    ? <><span className="h-3 w-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> Generating...</>
                    : <><Sparkles className="h-3 w-3" /> AI Generate</>
                  }
                </Button>
              </div>
              <Input
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="e.g. Quick question about [Company]'s growth"
                className="h-9 text-sm rounded-lg border-border/70"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Email Body
                <span className="ml-2 text-muted-foreground/60 normal-case font-normal">Use {'{name}'}, {'{company}'} as placeholders</span>
              </Label>
              <Textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Write your email body here..."
                className="min-h-[200px] text-sm rounded-lg border-border/70 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="h-9 text-sm rounded-lg">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-9 text-sm font-semibold gap-2 rounded-lg"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', color: '#fff' }}
            >
              {saving
                ? <><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                : editing ? 'Update Template' : 'Save Template'
              }
            </Button>
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

  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-sm flex flex-col overflow-hidden transition-all hover:shadow-md hover:border-border">
      {/* Card top color strip by category */}
      <div
        className="h-0.5 shrink-0"
        style={{ background: CATEGORY_META[template.category].color }}
      />

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground truncate">{template.name}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{template.subject}</p>
          </div>
          <CategoryBadge category={template.category} />
        </div>

        {/* Body preview */}
        <div
          className={cn(
            'text-xs text-muted-foreground leading-relaxed rounded-lg bg-muted/40 p-3 cursor-pointer select-none',
            !expanded && 'line-clamp-4',
          )}
          onClick={() => setExpanded((v) => !v)}
        >
          {template.body}
        </div>
        {template.body.length > 200 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[11px] text-primary hover:underline self-start -mt-1"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-auto">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
            <TrendingUp className="h-3 w-3" />
            <span>{template.usageCount} uses</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
            <Clock className="h-3 w-3" />
            <span>{new Date(template.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 border-t border-border/40">
          <button
            onClick={() => onCopy(template)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-1 justify-center',
              copied
                ? 'bg-primary/10 text-primary'
                : 'bg-primary/10 text-primary hover:bg-primary/20',
            )}
          >
            {copied ? <><Check className="h-3.5 w-3.5" /> Copied!</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
          </button>
          <button
            onClick={() => onEdit(template)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted/60 text-muted-foreground hover:bg-muted transition-all"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            onClick={() => onDelete(template._id)}
            disabled={deleting}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all disabled:opacity-50"
          >
            {deleting
              ? <span className="h-3.5 w-3.5 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
              : <Trash2 className="h-3.5 w-3.5" />
            }
          </button>
        </div>
      </div>
    </div>
  );
}

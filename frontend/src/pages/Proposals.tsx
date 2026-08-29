import { useEffect, useState, useCallback } from 'react';
import { FileText, Trash2, Eye, Sparkles, Calendar, Building2, Share2, Copy, X, Pencil, Clock, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import api from '@/services/api';
import { cn } from '@/lib/utils';

interface Proposal {
  _id: string;
  title?: string;
  content: string;
  status: string;
  lead?: { _id: string; companyName: string } | string;
  createdAt: string;
}

interface Lead {
  _id: string;
  companyName: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  draft:    { bg: 'rgba(110,125,121,0.1)', text: '#6E7D79', dot: '#6E7D79' },
  sent:     { bg: 'rgba(31,178,166,0.12)', text: '#1FB2A6', dot: '#1FB2A6' },
  accepted: { bg: 'rgba(62,142,90,0.12)',  text: '#3E8E5A', dot: '#3E8E5A' },
  rejected: { bg: 'rgba(194,59,46,0.12)', text: '#C23B2E', dot: '#C23B2E' },
};

function getCompanyName(lead: Proposal['lead']): string {
  if (!lead || typeof lead === 'string') return '—';
  return lead.companyName || '—';
}

function ProposalCardSkeleton() {
  return (
    <div className="p-5 space-y-3" style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, borderTop: '3px solid #CBD3CF' }}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>
        <Skeleton className="h-6 w-16" style={{ borderRadius: 10 }} />
      </div>
      <Skeleton className="h-20 w-full" style={{ borderRadius: 4 }} />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" style={{ borderRadius: 4 }} />
        <Skeleton className="h-8 w-20" style={{ borderRadius: 4 }} />
      </div>
    </div>
  );
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function Proposals() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [genLeadId, setGenLeadId] = useState('');
  const [genInstructions, setGenInstructions] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState('');
  const [viewProposal, setViewProposal] = useState<Proposal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [shareCopied, setShareCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [editProposal, setEditProposal] = useState<Proposal | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchProposals = useCallback(() => {
    setLoading(true);
    api
      .get('/proposals', { params: { page, limit: 10 } })
      .then((res) => {
        setProposals(Array.isArray(res.data?.data) ? res.data.data : []);
        setPagination(res.data?.pagination || { total: 0, page: 1, limit: 10, pages: 1 });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [page]);

  const handleOpenGenerate = () => {
    api.get('/leads', { params: { limit: 100 } })
      .then((res) => setLeads(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(console.error);
    setGenLeadId(''); setGenInstructions(''); setGenError('');
    setGenerateOpen(true);
  };

  const handleGenerate = async () => {
    if (!genLeadId) { setGenError('Please select a lead.'); return; }
    setGenLoading(true); setGenError('');
    try {
      await api.post('/proposals/generate', { leadId: genLeadId, customInstructions: genInstructions });
      setGenerateOpen(false);
      fetchProposals();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setGenError(err?.response?.data?.message || 'Generation failed.');
    } finally { setGenLoading(false); }
  };

  const handleShare = async (id: string) => {
    setShareLoading(true);
    setSharingId(id);
    setShareUrl('');
    setShareCopied(false);
    try {
      const res = await api.post(`/proposals/${id}/share`);
      const token = res.data?.data?.publicToken || res.data?.publicToken;
      setShareUrl(`${window.location.origin}/proposal/${token}`);
    } catch (e) { console.error(e); }
    finally { setShareLoading(false); }
  };

  const handleRevokeShare = async (id: string) => {
    try {
      await api.delete(`/proposals/${id}/share`);
      setSharingId(null);
      setShareUrl('');
    } catch (e) { console.error(e); }
  };

  const handleCopyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  const handleEdit = async () => {
    if (!editProposal) return;
    setEditLoading(true); setEditError('');
    try {
      await api.put(`/proposals/${editProposal._id}`, { title: editTitle, content: editContent });
      setEditProposal(null);
      fetchProposals();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setEditError(err?.response?.data?.message || 'Update failed.');
    } finally { setEditLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/proposals/${deleteId}`);
      setDeleteId(null);
      if (proposals.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchProposals();
    } catch (e) { console.error(e); }
    finally { setDeleteLoading(false); }
  };

  const handleDownloadPDF = (proposal: Proposal) => {
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${proposal.title || 'Proposal'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, sans-serif; color: #1a1a2e; background: #fff; padding: 48px; max-width: 800px; margin: 0 auto; }
    .header { border-bottom: 3px solid #2563EB; padding-bottom: 24px; margin-bottom: 32px; }
    .brand { font-size: 12px; font-weight: 700; color: #2563EB; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px; }
    .title { font-size: 28px; font-weight: 800; color: #0f172a; line-height: 1.2; }
    .meta { margin-top: 12px; display: flex; gap: 24px; font-size: 13px; color: #64748b; }
    .meta span { display: flex; align-items: center; gap: 4px; }
    .content { font-size: 15px; line-height: 1.8; color: #334155; white-space: pre-wrap; }
    .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; display: flex; justify-content: space-between; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: #dbeafe; color: #1d4ed8; }
    @media print { body { padding: 24px; } @page { margin: 1cm; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">Abyte Sol — Proposal</div>
    <div class="title">${proposal.title || 'Business Proposal'}</div>
    <div class="meta">
      <span>📅 ${new Date(proposal.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      <span class="status-badge">${proposal.status}</span>
    </div>
  </div>
  <div class="content">${proposal.content}</div>
  <div class="footer">
    <span>Generated by Abyte Hunt · AI Client Agent</span>
    <span>Abyte Sol</span>
  </div>
</body>
</html>`;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(htmlContent);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 500);
  };

  return (
    <div className="space-y-5 p-6" style={{ background: '#E6E9E5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, borderTop: '3px solid #1FB2A6', padding: '20px 24px' }}>
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4" style={{ color: '#1FB2A6' }} />
              <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1FB2A6' }}>AI-Generated</span>
            </div>
            <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1B1F2B', marginBottom: 4 }}>Proposals</h1>
            <p style={{ fontSize: 13, color: '#6E7D79' }}>{pagination.total} proposal{pagination.total !== 1 ? 's' : ''} generated</p>
          </div>
          <Button
            size="sm"
            className="h-9 gap-2 font-semibold text-sm text-white shrink-0"
            style={{ background: '#1FB2A6', borderRadius: 4 }}
            onClick={handleOpenGenerate}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Generate with AI
          </Button>
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => <ProposalCardSkeleton key={i} />)}
        </div>
      ) : proposals.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 text-center"
          style={{ background: '#F1F4F0', border: '1px dashed #CBD3CF', borderRadius: 4 }}
        >
          <div
            className="h-16 w-16 flex items-center justify-center mb-4"
            style={{ background: 'rgba(31,178,166,0.08)', border: '1px solid rgba(31,178,166,0.2)', borderRadius: 4 }}
          >
            <FileText className="h-7 w-7" style={{ color: '#6E7D79' }} />
          </div>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 16, fontWeight: 600, textTransform: 'uppercase', color: '#1B1F2B' }}>No proposals yet</h2>
          <p style={{ fontSize: 13, color: '#6E7D79', marginTop: 4, marginBottom: 20 }}>
            Use AI to generate your first proposal from a lead
          </p>
          <Button
            size="sm"
            className="h-9 gap-2 font-semibold text-sm text-white"
            style={{ background: '#1FB2A6', borderRadius: 4 }}
            onClick={handleOpenGenerate}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Generate First Proposal
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {proposals.map((proposal) => {
            const st = STATUS_STYLES[proposal.status] || STATUS_STYLES.draft;
            const company = getCompanyName(proposal.lead);
            const initials = company.slice(0, 2).toUpperCase();
            return (
              <div
                key={proposal._id}
                className="flex flex-col overflow-hidden"
                style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, borderTop: `3px solid ${st.dot}` }}
              >
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center text-xs font-bold text-white"
                      style={{ background: '#1FB2A6', borderRadius: 4, fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {proposal.title || `Proposal for ${company}`}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Building2 className="h-3 w-3 text-muted-foreground/60" />
                        <p className="text-xs text-muted-foreground">{company}</p>
                      </div>
                    </div>
                    <span style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 10.5,
                      textTransform: 'uppercase' as const,
                      padding: '3px 9px',
                      borderRadius: 10,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      whiteSpace: 'nowrap' as const,
                      background: st.bg,
                      color: st.text,
                      flexShrink: 0,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot, display: 'inline-block' }} />
                      {proposal.status}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-3 p-3 leading-relaxed" style={{ background: 'rgba(203,211,207,0.25)', borderRadius: 4 }}>
                    {proposal.content}
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                      <Calendar className="h-3 w-3" />
                      {new Date(proposal.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex gap-2">
                      {proposal.status === 'draft' && (
                        <button
                          className="h-8 px-2.5 text-xs font-semibold gap-1.5 flex items-center"
                          style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, color: '#1B1F2B', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" }}
                          onClick={() => { setEditProposal(proposal); setEditTitle(proposal.title || ''); setEditContent(proposal.content); setEditError(''); }}
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                      )}
                      <button
                        className="h-8 px-2.5 text-xs font-semibold gap-1.5 flex items-center"
                        style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, color: '#1B1F2B', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" }}
                        onClick={() => setViewProposal(proposal)}
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                      <button
                        className="h-8 px-2.5 text-xs font-semibold gap-1.5 flex items-center"
                        style={{ background: 'rgba(31,178,166,0.08)', border: '1px solid rgba(31,178,166,0.25)', borderRadius: 4, color: '#1FB2A6', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" }}
                        onClick={() => handleShare(proposal._id)}
                      >
                        <Share2 className="h-3.5 w-3.5" /> Share
                      </button>
                      <button
                        className="h-8 px-2.5 text-xs font-semibold gap-1.5 flex items-center"
                        style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, color: '#6E7D79', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" }}
                        onClick={() => handleDownloadPDF(proposal)}
                      >
                        <FileDown className="h-3.5 w-3.5" /> PDF
                      </button>
                      <button
                        className="h-8 px-2.5 text-xs font-semibold gap-1.5 flex items-center"
                        style={{ background: 'rgba(194,59,46,0.08)', border: '1px solid rgba(194,59,46,0.25)', borderRadius: 4, color: '#C23B2E', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" }}
                        onClick={() => setDeleteId(proposal._id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#6E7D79' }}>
            Showing {((page - 1) * 10) + 1}–{Math.min(page * 10, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 600, padding: '0 10px', height: 30, borderRadius: 4, background: '#F1F4F0', border: '1px solid #CBD3CF', color: '#1B1F2B', cursor: 'pointer', opacity: page <= 1 ? 0.35 : 1 }}
            >
              Prev
            </button>
            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, width: 30, height: 30, borderRadius: 4, background: page === p ? '#1FB2A6' : '#F1F4F0', border: page === p ? '1px solid #1FB2A6' : '1px solid #CBD3CF', color: page === p ? '#fff' : '#1B1F2B', cursor: 'pointer' }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pagination.pages}
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 600, padding: '0 10px', height: 30, borderRadius: 4, background: '#F1F4F0', border: '1px solid #CBD3CF', color: '#1B1F2B', cursor: 'pointer', opacity: page >= pagination.pages ? 0.35 : 1 }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Generate Dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-w-md" style={{ borderRadius: 4 }}>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <span className="h-6 w-6 flex items-center justify-center" style={{ background: '#1FB2A6', borderRadius: 4 }}>
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </span>
              <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 15, fontWeight: 600, textTransform: 'uppercase', color: '#1B1F2B' }}>Generate Proposal with AI</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            {genError && (
              <div className="text-sm p-3" style={{ background: 'rgba(194,59,46,0.08)', border: '1px solid rgba(194,59,46,0.25)', borderRadius: 4, color: '#C23B2E' }}>{genError}</div>
            )}
            {genLoading && (
              <div className="flex items-center gap-3 text-sm p-3" style={{ background: 'rgba(31,178,166,0.06)', border: '1px solid rgba(31,178,166,0.2)', borderRadius: 4 }}>
                <Sparkles className="h-4 w-4 animate-pulse" style={{ color: '#1FB2A6' }} />
                <span style={{ color: '#6E7D79' }}>AI is crafting your proposal, please wait...</span>
              </div>
            )}
            <div className="space-y-1.5">
              <Label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6E7D79' }}>Select Lead</Label>
              <Select value={genLeadId} onValueChange={setGenLeadId} disabled={genLoading}>
                <SelectTrigger className="h-9 text-sm" style={{ borderRadius: 4, border: '1px solid #CBD3CF' }}>
                  <SelectValue placeholder="Choose a lead..." />
                </SelectTrigger>
                <SelectContent style={{ borderRadius: 4 }}>
                  {leads.map((lead) => (
                    <SelectItem key={lead._id} value={lead._id}>{lead.companyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6E7D79' }}>Custom Instructions <span style={{ fontWeight: 400 }}>(optional)</span></Label>
              <Textarea
                className="text-sm resize-none"
                style={{ borderRadius: 4, border: '1px solid #CBD3CF' }}
                rows={4}
                placeholder="e.g. Focus on mobile app development, mention our React expertise..."
                value={genInstructions}
                onChange={(e) => setGenInstructions(e.target.value)}
                disabled={genLoading}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button
              className="text-sm font-semibold px-4 h-9"
              style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, color: '#6E7D79', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" }}
              onClick={() => setGenerateOpen(false)}
              disabled={genLoading}
            >Cancel</button>
            <button
              className="text-sm font-semibold h-9 px-4 gap-2 flex items-center"
              style={{ background: '#1FB2A6', borderRadius: 4, color: '#fff', cursor: 'pointer', border: 'none', fontFamily: "'IBM Plex Sans', sans-serif", opacity: genLoading ? 0.7 : 1 }}
              onClick={handleGenerate}
              disabled={genLoading}
            >
              {genLoading
                ? <><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
                : <><Sparkles className="h-3.5 w-3.5" /> Generate</>}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewProposal} onOpenChange={() => setViewProposal(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" style={{ borderRadius: 4 }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Oswald', sans-serif", fontSize: 15, fontWeight: 600, textTransform: 'uppercase', color: '#1B1F2B' }}>
              {viewProposal?.title || `Proposal — ${getCompanyName(viewProposal?.lead)}`}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className="p-4 text-sm leading-relaxed whitespace-pre-wrap" style={{ background: 'rgba(203,211,207,0.2)', borderRadius: 4, border: '1px solid #CBD3CF', color: '#1B1F2B' }}>
              {viewProposal?.content}
            </div>
          </div>
          <DialogFooter>
            <button
              style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, fontWeight: 600, padding: '0 16px', height: 34, borderRadius: 4, background: '#F1F4F0', border: '1px solid #CBD3CF', color: '#6E7D79', cursor: 'pointer' }}
              onClick={() => setViewProposal(null)}
            >Close</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={!!sharingId} onOpenChange={(open) => { if (!open) { setSharingId(null); setShareUrl(''); setShareCopied(false); } }}>
        <DialogContent className="max-w-md" style={{ borderRadius: 4 }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="h-6 w-6 flex items-center justify-center" style={{ background: '#1FB2A6', borderRadius: 4 }}>
                <Share2 className="h-3.5 w-3.5 text-white" />
              </span>
              <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 15, fontWeight: 600, textTransform: 'uppercase', color: '#1B1F2B' }}>Share Proposal</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <p style={{ fontSize: 13, color: '#6E7D79' }}>
              Generate a public link so your client can view and respond to this proposal without logging in.
            </p>
            {shareLoading && (
              <div className="flex items-center gap-3 text-sm p-3" style={{ background: 'rgba(31,178,166,0.06)', border: '1px solid rgba(31,178,166,0.2)', borderRadius: 4 }}>
                <span className="h-3.5 w-3.5 border-2 border-teal-300/40 border-t-teal-500 rounded-full animate-spin shrink-0" />
                <span style={{ color: '#6E7D79' }}>Generating share link...</span>
              </div>
            )}
            {shareUrl && !shareLoading && (
              <div className="space-y-2">
                <Label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6E7D79' }}>Share URL</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={shareUrl}
                    className="h-9 text-xs font-mono"
                    style={{ borderRadius: 4, border: '1px solid #CBD3CF', background: 'rgba(203,211,207,0.2)' }}
                  />
                  <button
                    className="h-9 px-3 text-xs font-semibold text-white shrink-0 gap-1.5 flex items-center"
                    style={{ background: shareCopied ? '#3E8E5A' : '#1FB2A6', borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" }}
                    onClick={handleCopyShareUrl}
                  >
                    {shareCopied ? '✓ Copied' : <><Copy className="h-3 w-3" /> Copy</>}
                  </button>
                </div>
                <p style={{ fontSize: 12, color: '#6E7D79' }}>Anyone with this link can view and respond to the proposal.</p>
                <p className="flex items-center gap-1.5 mt-1" style={{ fontSize: 12, color: '#9CADB0' }}>
                  <Clock className="h-3 w-3" />
                  Generated just now · Revoke to invalidate
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            {shareUrl && sharingId && (
              <button
                className="text-sm font-semibold px-3 h-9 gap-1.5 flex items-center"
                style={{ background: 'rgba(194,59,46,0.08)', border: '1px solid rgba(194,59,46,0.25)', borderRadius: 4, color: '#C23B2E', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" }}
                onClick={() => handleRevokeShare(sharingId)}
              >
                <X className="h-3.5 w-3.5" /> Revoke Link
              </button>
            )}
            <button
              style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, fontWeight: 600, padding: '0 16px', height: 34, borderRadius: 4, background: '#F1F4F0', border: '1px solid #CBD3CF', color: '#6E7D79', cursor: 'pointer' }}
              onClick={() => { setSharingId(null); setShareUrl(''); setShareCopied(false); }}
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm" style={{ borderRadius: 4 }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Oswald', sans-serif", fontSize: 15, fontWeight: 600, textTransform: 'uppercase', color: '#1B1F2B' }}>Delete Proposal?</DialogTitle>
          </DialogHeader>
          <p style={{ fontSize: 13, color: '#6E7D79' }}>This action is permanent and cannot be undone.</p>
          <DialogFooter className="gap-2">
            <button
              style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, fontWeight: 600, padding: '0 16px', height: 34, borderRadius: 4, background: '#F1F4F0', border: '1px solid #CBD3CF', color: '#6E7D79', cursor: 'pointer' }}
              onClick={() => setDeleteId(null)}
            >Cancel</button>
            <button
              style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, fontWeight: 600, padding: '0 16px', height: 34, borderRadius: 4, background: '#C23B2E', border: 'none', color: '#fff', cursor: 'pointer', opacity: deleteLoading ? 0.7 : 1 }}
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Draft Dialog */}
      <Dialog open={!!editProposal} onOpenChange={(open) => { if (!open) setEditProposal(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" style={{ borderRadius: 4 }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="h-6 w-6 flex items-center justify-center" style={{ background: '#1FB2A6', borderRadius: 4 }}>
                <Pencil className="h-3.5 w-3.5 text-white" />
              </span>
              <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 15, fontWeight: 600, textTransform: 'uppercase', color: '#1B1F2B' }}>Edit Draft Proposal</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            {editError && (
              <div className="text-sm p-3" style={{ background: 'rgba(194,59,46,0.08)', border: '1px solid rgba(194,59,46,0.25)', borderRadius: 4, color: '#C23B2E' }}>{editError}</div>
            )}
            <div className="space-y-1.5">
              <Label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6E7D79' }}>Title</Label>
              <Input
                className="h-9 text-sm"
                style={{ borderRadius: 4, border: '1px solid #CBD3CF' }}
                placeholder="Proposal title..."
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6E7D79' }}>Content</Label>
              <Textarea
                className="text-sm resize-none"
                style={{ borderRadius: 4, border: '1px solid #CBD3CF' }}
                rows={14}
                placeholder="Proposal content..."
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button
              style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, fontWeight: 600, padding: '0 16px', height: 34, borderRadius: 4, background: '#F1F4F0', border: '1px solid #CBD3CF', color: '#6E7D79', cursor: 'pointer' }}
              onClick={() => setEditProposal(null)}
            >Cancel</button>
            <button
              className="gap-2 flex items-center"
              style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, fontWeight: 700, padding: '0 16px', height: 34, borderRadius: 4, background: '#1FB2A6', border: 'none', color: '#fff', cursor: 'pointer', opacity: (editLoading || !editContent.trim()) ? 0.6 : 1 }}
              onClick={handleEdit}
              disabled={editLoading || !editContent.trim()}
            >
              {editLoading
                ? <><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                : 'Save Changes'
              }
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

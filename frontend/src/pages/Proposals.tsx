import { useEffect, useState, useCallback } from 'react';
import { FileText, Trash2, Eye, Sparkles, Calendar, Building2, Share2, Copy, X } from 'lucide-react';
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
  leadId?: { _id: string; companyName: string } | string;
  createdAt: string;
}

interface Lead {
  _id: string;
  companyName: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  draft:    { bg: 'bg-slate-100',   text: 'text-slate-600',   dot: 'bg-slate-400' },
  sent:     { bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-400' },
  accepted: { bg: 'bg-green-50',    text: 'text-green-700',   dot: 'bg-green-400' },
  rejected: { bg: 'bg-rose-50',     text: 'text-rose-700',    dot: 'bg-rose-400' },
};

function getCompanyName(lead: Proposal['leadId']): string {
  if (!lead || typeof lead === 'string') return '—';
  return lead.companyName || '—';
}

function ProposalCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-20 w-full rounded-lg" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
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

  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div className="page-header">
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4" style={{ color: '#0D9C6A' }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#0D9C6A' }}>AI-Generated</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-gradient mb-1">Proposals</h1>
            <p className="text-sm text-muted-foreground font-medium">{pagination.total} proposal{pagination.total !== 1 ? 's' : ''} generated</p>
          </div>
          <Button
            size="sm"
            className="h-9 rounded-xl gap-2 font-semibold text-sm text-gray-900 shrink-0"
            style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}
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
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <div
            className="h-16 w-16 rounded-xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(33,246,168,0.08)', border: '1px solid rgba(33,246,168,0.2)' }}
          >
            <FileText className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <h2 className="text-base font-semibold text-foreground">No proposals yet</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            Use AI to generate your first proposal from a lead
          </p>
          <Button
            size="sm"
            className="h-9 rounded-xl gap-2 font-semibold text-sm text-gray-900"
            style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}
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
            const company = getCompanyName(proposal.leadId);
            const initials = company.slice(0, 2).toUpperCase();
            return (
              <div
                key={proposal._id}
                className="rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden"
              >
                <div
                  className="h-0.5 w-full"
                  style={{ background: proposal.status === 'accepted' ? 'linear-gradient(90deg, #21F6A8, #10B981)' : proposal.status === 'sent' ? 'linear-gradient(90deg, #10B981, #059669)' : proposal.status === 'rejected' ? 'linear-gradient(90deg, #f43f5e, #fb7185)' : 'linear-gradient(90deg, #94a3b8, #cbd5e1)' }}
                />
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-gray-900"
                      style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}
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
                    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full shrink-0', st.bg, st.text)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />
                      {proposal.status}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-3 bg-muted/40 rounded-xl p-3 leading-relaxed">
                    {proposal.content}
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                      <Calendar className="h-3 w-3" />
                      {new Date(proposal.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg text-xs border-border/60 gap-1.5"
                        onClick={() => setViewProposal(proposal)}
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg text-xs border-border/60 gap-1.5 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200"
                        style={{ color: '#0D9C6A' }}
                        onClick={() => handleShare(proposal._id)}
                      >
                        <Share2 className="h-3.5 w-3.5" /> Share
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg text-xs border-border/60 gap-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                        onClick={() => setDeleteId(proposal._id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
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

      {/* Generate Dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}>
                <Sparkles className="h-3.5 w-3.5 text-gray-900" />
              </span>
              Generate Proposal with AI
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            {genError && (
              <div className="text-sm rounded-xl p-3 bg-rose-50 text-rose-700 border border-rose-200">{genError}</div>
            )}
            {genLoading && (
              <div className="flex items-center gap-3 text-sm rounded-xl p-3" style={{ background: 'rgba(33,246,168,0.06)', border: '1px solid rgba(33,246,168,0.2)' }}>
                <Sparkles className="h-4 w-4 animate-pulse" style={{ color: '#0D9C6A' }} />
                <span className="text-muted-foreground">AI is crafting your proposal, please wait...</span>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Select Lead</Label>
              <Select value={genLeadId} onValueChange={setGenLeadId} disabled={genLoading}>
                <SelectTrigger className="h-9 rounded-xl border-border/60 text-sm">
                  <SelectValue placeholder="Choose a lead..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {leads.map((lead) => (
                    <SelectItem key={lead._id} value={lead._id}>{lead.companyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Custom Instructions <span className="font-normal">(optional)</span></Label>
              <Textarea
                className="rounded-xl border-border/60 text-sm resize-none"
                rows={4}
                placeholder="e.g. Focus on mobile app development, mention our React expertise..."
                value={genInstructions}
                onChange={(e) => setGenInstructions(e.target.value)}
                disabled={genLoading}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl border-border/60 text-sm" onClick={() => setGenerateOpen(false)} disabled={genLoading}>Cancel</Button>
            <Button
              className="rounded-xl text-sm font-semibold text-gray-900 gap-2"
              style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}
              onClick={handleGenerate}
              disabled={genLoading}
            >
              {genLoading
                ? <><span className="h-3.5 w-3.5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" /> Generating...</>
                : <><Sparkles className="h-3.5 w-3.5" /> Generate</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewProposal} onOpenChange={() => setViewProposal(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {viewProposal?.title || `Proposal — ${getCompanyName(viewProposal?.leadId)}`}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className="rounded-xl bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground/80 border border-border/40">
              {viewProposal?.content}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl border-border/60 text-sm" onClick={() => setViewProposal(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={!!sharingId} onOpenChange={(open) => { if (!open) { setSharingId(null); setShareUrl(''); setShareCopied(false); } }}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}>
                <Share2 className="h-3.5 w-3.5 text-gray-900" />
              </span>
              Share Proposal
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <p className="text-sm text-muted-foreground">
              Generate a public link so your client can view and respond to this proposal without logging in.
            </p>
            {shareLoading && (
              <div className="flex items-center gap-3 text-sm rounded-xl p-3" style={{ background: 'rgba(33,246,168,0.06)', border: '1px solid rgba(33,246,168,0.2)' }}>
                <span className="h-3.5 w-3.5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin shrink-0" />
                <span className="text-muted-foreground">Generating share link...</span>
              </div>
            )}
            {shareUrl && !shareLoading && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Share URL</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={shareUrl}
                    className="h-9 rounded-xl border-border/60 text-xs font-mono bg-muted/40"
                  />
                  <Button
                    size="sm"
                    className="h-9 px-3 rounded-xl text-xs font-semibold text-gray-900 shrink-0 gap-1.5"
                    style={{ background: shareCopied ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #21F6A8, #10B981)' }}
                    onClick={handleCopyShareUrl}
                  >
                    {shareCopied ? '✓ Copied' : <><Copy className="h-3 w-3" /> Copy</>}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Anyone with this link can view and respond to the proposal.</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            {shareUrl && sharingId && (
              <Button
                variant="outline"
                className="rounded-xl border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 text-sm gap-1.5"
                onClick={() => handleRevokeShare(sharingId)}
              >
                <X className="h-3.5 w-3.5" /> Revoke Link
              </Button>
            )}
            <Button variant="outline" className="rounded-xl border-border/60 text-sm" onClick={() => { setSharingId(null); setShareUrl(''); setShareCopied(false); }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader><DialogTitle className="text-base font-semibold">Delete Proposal?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action is permanent and cannot be undone.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl border-border/60 text-sm" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button className="rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

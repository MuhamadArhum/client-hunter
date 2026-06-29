import { useEffect, useState, useCallback } from 'react';
import { FileText, Trash2, Eye, Sparkles, Plus, Calendar, Building2, Share2, Copy, X } from 'lucide-react';
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
  sent:     { bg: 'bg-cyan-50',     text: 'text-cyan-700',    dot: 'bg-cyan-400' },
  accepted: { bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-400' },
  rejected: { bg: 'bg-rose-50',     text: 'text-rose-700',    dot: 'bg-rose-400' },
};

function getCompanyName(lead: Proposal['leadId']): string {
  if (!lead || typeof lead === 'string') return '—';
  return lead.companyName || '—';
}

function ProposalCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card shadow-card p-5 space-y-3">
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

export default function Proposals() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
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
      .get('/proposals')
      .then((res) => setProposals(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);

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
      fetchProposals();
    } catch (e) { console.error(e); }
    finally { setDeleteLoading(false); }
  };

  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div className="page-header">
        <div className="absolute inset-0 opacity-40 rounded-2xl"
             style={{ backgroundImage: 'radial-gradient(rgba(159,141,212,0.08) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary/70">AI-Generated</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-gradient mb-1">Proposals</h1>
            <p className="text-sm text-muted-foreground font-medium">{proposals.length} proposal(s) generated</p>
          </div>
          <Button
            size="sm"
            className="h-9 rounded-xl gap-2 font-semibold text-sm text-white shadow-glow-teal shrink-0"
            style={{ background: 'linear-gradient(135deg, #9F8DD4, #1DD2D7)' }}
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
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, rgba(29,210,215,0.1), rgba(159,141,212,0.1))' }}
          >
            <FileText className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <h2 className="text-base font-semibold text-foreground">No proposals yet</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            Use AI to generate your first proposal from a lead
          </p>
          <Button
            size="sm"
            className="h-9 rounded-xl gap-2 font-semibold text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #1DD2D7, #1DD7CE)' }}
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
                className="rounded-2xl border border-border/50 bg-card shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col overflow-hidden"
              >
                {/* Top accent */}
                <div
                  className="h-0.5 w-full"
                  style={{ background: proposal.status === 'accepted' ? 'linear-gradient(90deg, #10b981, #34d399)' : proposal.status === 'sent' ? 'linear-gradient(90deg, #1DD2D7, #1DD7CE)' : proposal.status === 'rejected' ? 'linear-gradient(90deg, #f43f5e, #fb7185)' : 'linear-gradient(90deg, #94a3b8, #cbd5e1)' }}
                />
                <div className="p-5 flex flex-col gap-3 flex-1">
                  {/* Header row */}
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #1DD2D7, #9F8DD4)' }}
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

                  {/* Preview */}
                  <p className="text-sm text-muted-foreground line-clamp-3 bg-muted/40 rounded-xl p-3 leading-relaxed">
                    {proposal.content}
                  </p>

                  {/* Footer */}
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
                        className="h-8 rounded-lg text-xs border-border/60 gap-1.5 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 hover:border-cyan-200"
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

      {/* Generate Dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1DD2D7, #9F8DD4)' }}>
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </span>
              Generate Proposal with AI
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            {genError && (
              <div className="text-sm rounded-xl p-3 bg-rose-50 text-rose-700 border border-rose-200">{genError}</div>
            )}
            {genLoading && (
              <div className="flex items-center gap-3 text-sm rounded-xl p-3" style={{ background: 'rgba(29,210,215,0.08)', border: '1px solid rgba(29,210,215,0.2)' }}>
                <Sparkles className="h-4 w-4 animate-pulse" style={{ color: '#1DD2D7' }} />
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
              className="rounded-xl text-sm font-semibold text-white gap-2"
              style={{ background: 'linear-gradient(135deg, #1DD2D7, #1DD7CE)' }}
              onClick={handleGenerate}
              disabled={genLoading}
            >
              {genLoading
                ? <><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
                : <><Sparkles className="h-3.5 w-3.5" /> Generate</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewProposal} onOpenChange={() => setViewProposal(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl">
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
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1DD2D7, #9F8DD4)' }}>
                <Share2 className="h-3.5 w-3.5 text-white" />
              </span>
              Share Proposal
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <p className="text-sm text-muted-foreground">
              Generate a public link so your client can view and respond to this proposal without logging in.
            </p>
            {shareLoading && (
              <div className="flex items-center gap-3 text-sm rounded-xl p-3" style={{ background: 'rgba(29,210,215,0.08)', border: '1px solid rgba(29,210,215,0.2)' }}>
                <span className="h-3.5 w-3.5 border-2 border-[#1DD2D7]/30 border-t-[#1DD2D7] rounded-full animate-spin shrink-0" />
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
                    className="h-9 px-3 rounded-xl text-xs font-semibold text-white shrink-0 gap-1.5"
                    style={{ background: shareCopied ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #1DD2D7, #1DD7CE)' }}
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
        <DialogContent className="max-w-sm rounded-2xl">
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

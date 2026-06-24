import { useEffect, useState, useCallback } from 'react';
import { FileText, Trash2, Eye, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-cyan-100 text-cyan-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};

function ProposalCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

function getCompanyName(lead: Proposal['leadId']): string {
  if (!lead) return '—';
  if (typeof lead === 'string') return '—';
  return lead.companyName || '—';
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

  const fetchProposals = useCallback(() => {
    setLoading(true);
    api
      .get('/proposals')
      .then((res) => setProposals(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  const fetchLeads = () => {
    api
      .get('/leads', { params: { limit: 100 } })
      .then((res) => setLeads(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(console.error);
  };

  const handleOpenGenerate = () => {
    fetchLeads();
    setGenLeadId('');
    setGenInstructions('');
    setGenError('');
    setGenerateOpen(true);
  };

  const handleGenerate = async () => {
    if (!genLeadId) { setGenError('Please select a lead.'); return; }
    setGenLoading(true);
    setGenError('');
    try {
      await api.post('/proposals/generate', {
        leadId: genLeadId,
        customInstructions: genInstructions,
      });
      setGenerateOpen(false);
      fetchProposals();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setGenError(err?.response?.data?.message || 'Generation failed.');
    } finally {
      setGenLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/proposals/${deleteId}`);
      setDeleteId(null);
      fetchProposals();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proposals</h1>
          <p className="text-sm text-muted-foreground">{proposals.length} proposal(s)</p>
        </div>
        <Button onClick={handleOpenGenerate}>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate with AI
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => <ProposalCardSkeleton key={i} />)}
        </div>
      ) : proposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="text-lg font-semibold">No proposals yet</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Use AI to generate your first proposal from a lead.
          </p>
          <Button onClick={handleOpenGenerate}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate First Proposal
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {proposals.map((proposal) => (
            <Card key={proposal._id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      {proposal.title || `Proposal for ${getCompanyName(proposal.leadId)}`}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {getCompanyName(proposal.leadId)}
                    </p>
                  </div>
                  <Badge className={cn('text-xs shrink-0', STATUS_COLORS[proposal.status] || '')}>
                    {proposal.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3">
                <p className="text-sm text-muted-foreground line-clamp-4">
                  {proposal.content}
                </p>
                <p className="text-xs text-muted-foreground mt-auto">
                  {new Date(proposal.createdAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewProposal(proposal)}
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(proposal._id)}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Generate Dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Proposal with AI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {genError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{genError}</p>
            )}
            {genLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded p-3">
                <Sparkles className="h-4 w-4 animate-pulse" />
                AI is crafting your proposal...
              </div>
            )}
            <div className="space-y-1">
              <Label>Select Lead</Label>
              <Select value={genLeadId} onValueChange={setGenLeadId} disabled={genLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a lead..." />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((lead) => (
                    <SelectItem key={lead._id} value={lead._id}>
                      {lead.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Custom Instructions (optional)</Label>
              <Textarea
                rows={4}
                placeholder="Add specific instructions for the AI..."
                value={genInstructions}
                onChange={(e) => setGenInstructions(e.target.value)}
                disabled={genLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateOpen(false)} disabled={genLoading}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={genLoading}>
              <Sparkles className="mr-2 h-4 w-4" />
              {genLoading ? 'Generating...' : 'Generate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewProposal} onOpenChange={() => setViewProposal(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewProposal?.title || `Proposal — ${getCompanyName(viewProposal?.leadId)}`}
            </DialogTitle>
          </DialogHeader>
          <div className="whitespace-pre-wrap text-sm leading-relaxed py-2">
            {viewProposal?.content}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewProposal(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Proposal</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this proposal? This cannot be undone.
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

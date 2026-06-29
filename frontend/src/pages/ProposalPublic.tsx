import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import axios from 'axios';

const publicApi = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });

interface Proposal {
  _id: string;
  title: string;
  content: string;
  status: string;
  clientDecision: string;
  clientMessage: string;
  lead?: { companyName?: string };
  createdAt: string;
}

export default function ProposalPublic() {
  const { token } = useParams<{ token: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [decision, setDecision] = useState<'accepted' | 'rejected' | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!token) return;
    publicApi.get(`/proposals/public/${token}`)
      .then((res) => setProposal(res.data?.data))
      .catch(() => setError('This proposal link is invalid or has expired.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleRespond = async () => {
    if (!decision || !token) return;
    setSubmitting(true);
    try {
      await publicApi.post(`/proposals/public/${token}/respond`, { decision, message });
      setSubmitted(true);
    } catch {
      setError('Failed to submit response. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f1629 0%, #1a1f35 50%, #0f1629 100%)' }}>
      <div className="h-10 w-10 rounded-full border-2 border-[#1DD2D7] border-t-transparent animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #0f1629 0%, #1a1f35 50%, #0f1629 100%)' }}>
      <div className="text-center space-y-4">
        <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <XCircle className="h-8 w-8 text-rose-400" />
        </div>
        <p className="text-white font-semibold">{error}</p>
      </div>
    </div>
  );

  if (submitted || (proposal?.clientDecision && proposal.clientDecision !== 'pending')) {
    const isAccepted = decision === 'accepted' || proposal?.clientDecision === 'accepted';
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #0f1629 0%, #1a1f35 50%, #0f1629 100%)' }}>
        <div className="text-center space-y-4 max-w-sm">
          <div className="h-20 w-20 rounded-3xl flex items-center justify-center mx-auto" style={{ background: isAccepted ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${isAccepted ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
            {isAccepted ? <CheckCircle className="h-10 w-10 text-emerald-400" /> : <XCircle className="h-10 w-10 text-rose-400" />}
          </div>
          <h2 className="text-2xl font-black text-white">{isAccepted ? 'Proposal Accepted!' : 'Proposal Declined'}</h2>
          <p className="text-sm" style={{ color: 'rgba(210,220,235,0.6)' }}>
            {isAccepted ? "Thank you! We'll be in touch shortly to move forward." : 'Thank you for your response. We appreciate your time.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, #0f1629 0%, #1a1f35 50%, #0f1629 100%)' }}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #1DD2D7 0%, #9F8DD4 100%)' }}>
              <Zap className="h-4 w-4 text-white" fill="white" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ background: 'linear-gradient(135deg, #1DD7CE, #c4b8f0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Abyte Hunt
              </p>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(210,220,235,0.3)' }}>by Abyte Sol</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ background: 'rgba(29,210,215,0.1)', color: '#1DD7CE', border: '1px solid rgba(29,210,215,0.2)' }}>
            <Clock className="h-3 w-3" />
            Awaiting your response
          </div>
        </div>

        {/* Proposal Card */}
        <div className="rounded-3xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
          {/* Top bar */}
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #1DD2D7, #9F8DD4, #1DD7CE)' }} />

          <div className="p-8 space-y-6">
            <div>
              {proposal?.lead?.companyName && (
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#1DD7CE' }}>
                  Prepared for {proposal.lead.companyName}
                </p>
              )}
              <h1 className="text-3xl font-black text-white">{proposal?.title}</h1>
              <p className="text-xs mt-2" style={{ color: 'rgba(210,220,235,0.4)' }}>
                Shared on {proposal?.createdAt ? new Date(proposal.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
              </p>
            </div>

            <div className="h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />

            <div className="prose prose-invert max-w-none">
              <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(210,225,240,0.85)' }}>
                {proposal?.content}
              </div>
            </div>
          </div>
        </div>

        {/* Response Section */}
        {proposal?.status !== 'accepted' && proposal?.status !== 'rejected' && (
          <div className="rounded-3xl p-6 space-y-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
            <h2 className="text-lg font-bold text-white">Your Response</h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDecision('accepted')}
                className="rounded-2xl p-4 border-2 transition-all text-left space-y-1"
                style={{
                  background: decision === 'accepted' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
                  borderColor: decision === 'accepted' ? 'rgba(16,185,129,0.6)' : 'rgba(255,255,255,0.08)',
                }}
              >
                <CheckCircle className={`h-6 w-6 ${decision === 'accepted' ? 'text-emerald-400' : 'text-white/30'}`} />
                <p className="text-sm font-semibold text-white">Accept Proposal</p>
                <p className="text-xs" style={{ color: 'rgba(210,220,235,0.5)' }}>I'm interested in moving forward</p>
              </button>

              <button
                onClick={() => setDecision('rejected')}
                className="rounded-2xl p-4 border-2 transition-all text-left space-y-1"
                style={{
                  background: decision === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)',
                  borderColor: decision === 'rejected' ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)',
                }}
              >
                <XCircle className={`h-6 w-6 ${decision === 'rejected' ? 'text-rose-400' : 'text-white/30'}`} />
                <p className="text-sm font-semibold text-white">Decline Proposal</p>
                <p className="text-xs" style={{ color: 'rgba(210,220,235,0.5)' }}>Not the right fit at this time</p>
              </button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(210,220,235,0.5)' }}>Message (optional)</Label>
              <Textarea
                className="rounded-xl text-sm resize-none text-white placeholder:text-white/25"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                rows={3}
                placeholder="Any feedback or questions..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <Button
              className="w-full h-11 rounded-xl font-semibold text-white"
              style={{ background: decision === 'accepted' ? 'linear-gradient(135deg, #10B981, #059669)' : decision === 'rejected' ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 'rgba(255,255,255,0.1)' }}
              disabled={!decision || submitting}
              onClick={handleRespond}
            >
              {submitting ? 'Submitting...' : decision === 'accepted' ? '✓ Accept & Move Forward' : decision === 'rejected' ? '✕ Decline Proposal' : 'Select a response above'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

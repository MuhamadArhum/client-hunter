import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const statusBadge = { draft: 'badge-secondary', sent: 'badge-primary', accepted: 'badge-success', rejected: 'badge-danger' };

export default function ProposalsPage() {
  const [proposals, setProposals] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [viewProposal, setViewProposal] = useState(null);
  const [form, setForm] = useState({ leadId: '', projectType: '', budget: '', requirements: '' });

  useEffect(() => {
    Promise.all([
      api.get('/proposals').catch(() => ({ data: { data: [] } })),
      api.get('/leads?limit=100&status=new,contacted,proposal_sent,follow_up').catch(() => ({ data: { data: [] } })),
    ]).then(([pRes, lRes]) => {
      setProposals(pRes.data.data || []);
      setLeads(lRes.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.leadId) { toast.error('Select a lead'); return; }
    setGenerating(true);
    try {
      const res = await api.post('/proposals/generate', form);
      toast.success('Proposal generated!');
      setProposals(p => [res.data.data, ...p]);
      setShowModal(false);
      setForm({ leadId: '', projectType: '', budget: '', requirements: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to generate'); }
    finally { setGenerating(false); }
  };

  const handleSend = async (id) => {
    try {
      await api.post(`/proposals/${id}/send`);
      toast.success('Proposal sent!');
      setProposals(p => p.map(pr => pr._id === id ? { ...pr, status: 'sent' } : pr));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="row">
      <div className="col-12">
        <div className="content-header row">
          <div className="content-header-left col-12 mb-2 mt-1">
            <h3 className="content-header-title">Proposals</h3>
          </div>
        </div>
      </div>

      <div className="col-12">
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">All Proposals</h4>
            <button onClick={() => setShowModal(true)} className="btn btn-sm btn-info">
              <i className="ft-zap mr-1"></i>Generate Proposal
            </button>
          </div>
          <div className="card-content">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Lead</th>
                      <th>Project Type</th>
                      <th>Budget</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className="text-center py-3 text-muted">Loading...</td></tr>
                    ) : proposals.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-3 text-muted">No proposals yet</td></tr>
                    ) : proposals.map(p => (
                      <tr key={p._id}>
                        <td className="font-weight-bold">{p.lead?.companyName || '—'}</td>
                        <td className="text-capitalize">{p.projectType || '—'}</td>
                        <td>{p.budget ? `$${p.budget}` : '—'}</td>
                        <td><span className={`badge ${statusBadge[p.status] || 'badge-secondary'}`}>{p.status}</span></td>
                        <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</td>
                        <td>
                          <button onClick={() => setViewProposal(p)} className="btn btn-sm btn-icon btn-outline-primary mr-1" title="View">
                            <i className="ft-eye"></i>
                          </button>
                          {p.status === 'draft' && (
                            <button onClick={() => handleSend(p._id)} className="btn btn-sm btn-icon btn-outline-success" title="Send">
                              <i className="ft-send"></i>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Generate Proposal</h5>
                <button type="button" className="close" onClick={() => setShowModal(false)}><span>&times;</span></button>
              </div>
              <form onSubmit={handleGenerate}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Select Lead *</label>
                    <select className="form-control" required value={form.leadId} onChange={e => setForm(p => ({ ...p, leadId: e.target.value }))}>
                      <option value="">Choose lead...</option>
                      {leads.map(l => <option key={l._id} value={l._id}>{l.companyName}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Project Type *</label>
                    <input className="form-control" placeholder="e.g. Web Development" required value={form.projectType} onChange={e => setForm(p => ({ ...p, projectType: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Budget ($)</label>
                    <input type="number" className="form-control" placeholder="5000" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Requirements</label>
                    <textarea className="form-control" rows={3} placeholder="Describe project requirements..." value={form.requirements} onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" disabled={generating} className="btn btn-info">
                    {generating ? <span><span className="spinner-border spinner-border-sm mr-1"></span>Generating...</span> : 'Generate'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Proposal Modal */}
      {viewProposal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Proposal — {viewProposal.lead?.companyName}</h5>
                <button type="button" className="close" onClick={() => setViewProposal(null)}><span>&times;</span></button>
              </div>
              <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 14 }}>{viewProposal.content}</pre>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setViewProposal(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

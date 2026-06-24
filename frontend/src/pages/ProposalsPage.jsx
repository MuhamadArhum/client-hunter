import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

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
    ]).then(([pRes, lRes]) => { setProposals(pRes.data.data || []); setLeads(lRes.data.data || []); }).finally(() => setLoading(false));
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
    try { await api.post(`/proposals/${id}/send`); toast.success('Proposal sent!'); setProposals(p => p.map(pr => pr._id === id ? { ...pr, status: 'sent' } : pr)); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to send'); }
  };

  const statusBadge = (s) => ({ draft: 'bg-blueGray-100 text-blueGray-600', sent: 'bg-violet-100 text-violet-700', accepted: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700' }[s] || 'bg-blueGray-100 text-blueGray-600');

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-blueGray-700">Proposals</h2>
        <button onClick={() => setShowModal(true)} className="bg-violet-500 text-white text-xs font-bold uppercase px-4 py-2 rounded shadow hover:bg-violet-600 transition-colors">
          <i className="fas fa-magic mr-2"></i>Generate Proposal
        </button>
      </div>

      <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
        <div className="block w-full overflow-x-auto">
          <table className="items-center w-full bg-transparent border-collapse">
            <thead>
              <tr>
                {['Lead', 'Project Type', 'Budget', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="px-6 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center py-8 text-blueGray-400">Loading...</td></tr>
                : proposals.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-blueGray-400">No proposals yet</td></tr>
                : proposals.map(p => (
                  <tr key={p._id} className="hover:bg-blueGray-50">
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 font-bold text-blueGray-700">{p.lead?.companyName || '—'}</td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-blueGray-600 capitalize">{p.projectType || '—'}</td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-blueGray-600">{p.budget ? `$${p.budget}` : '—'}</td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      <span className={`text-xs font-semibold inline-block py-1 px-2 rounded-full uppercase ${statusBadge(p.status)}`}>{p.status}</span>
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-blueGray-500">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 flex gap-2">
                      <button onClick={() => setViewProposal(p)} className="text-violet-500 hover:text-violet-700 text-xs font-bold uppercase"><i className="fas fa-eye mr-1"></i>View</button>
                      {p.status === 'draft' && <button onClick={() => handleSend(p._id)} className="text-emerald-500 hover:text-emerald-700 text-xs font-bold uppercase"><i className="fas fa-paper-plane mr-1"></i>Send</button>}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-blueGray-200">
              <h3 className="font-bold text-blueGray-700 text-lg">Generate Proposal</h3>
              <button onClick={() => setShowModal(false)} className="text-blueGray-400 hover:text-blueGray-600"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleGenerate} className="px-6 py-4 space-y-3">
              <div>
                <label className="block uppercase text-blueGray-600 text-xs font-bold mb-1">Select Lead</label>
                <select value={form.leadId} onChange={e => setForm(p => ({ ...p, leadId: e.target.value }))} required
                  className="border-0 px-3 py-2 text-blueGray-600 bg-blueGray-100 rounded text-sm w-full focus:outline-none focus:ring">
                  <option value="">Choose lead...</option>
                  {leads.map(l => <option key={l._id} value={l._id}>{l.companyName}</option>)}
                </select>
              </div>
              <div>
                <label className="block uppercase text-blueGray-600 text-xs font-bold mb-1">Project Type</label>
                <input value={form.projectType} onChange={e => setForm(p => ({ ...p, projectType: e.target.value }))} placeholder="e.g. Web Development" required
                  className="border-0 px-3 py-2 placeholder-blueGray-300 text-blueGray-600 bg-blueGray-100 rounded text-sm w-full focus:outline-none focus:ring" />
              </div>
              <div>
                <label className="block uppercase text-blueGray-600 text-xs font-bold mb-1">Budget ($)</label>
                <input type="number" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} placeholder="5000"
                  className="border-0 px-3 py-2 placeholder-blueGray-300 text-blueGray-600 bg-blueGray-100 rounded text-sm w-full focus:outline-none focus:ring" />
              </div>
              <div>
                <label className="block uppercase text-blueGray-600 text-xs font-bold mb-1">Requirements</label>
                <textarea value={form.requirements} onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))} rows={3} placeholder="Describe project requirements..."
                  className="border-0 px-3 py-2 placeholder-blueGray-300 text-blueGray-600 bg-blueGray-100 rounded text-sm w-full focus:outline-none focus:ring" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-blueGray-200 text-blueGray-700 text-xs font-bold uppercase px-4 py-2 rounded hover:bg-blueGray-300">Cancel</button>
                <button type="submit" disabled={generating} className="flex-1 bg-violet-500 text-white text-xs font-bold uppercase px-4 py-2 rounded hover:bg-violet-600 disabled:opacity-60">
                  {generating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Proposal Modal */}
      {viewProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-blueGray-200">
              <h3 className="font-bold text-blueGray-700">Proposal — {viewProposal.lead?.companyName}</h3>
              <button onClick={() => setViewProposal(null)} className="text-blueGray-400 hover:text-blueGray-600"><i className="fas fa-times"></i></button>
            </div>
            <div className="px-6 py-4">
              <pre className="text-sm text-blueGray-700 whitespace-pre-wrap font-sans leading-relaxed">{viewProposal.content}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

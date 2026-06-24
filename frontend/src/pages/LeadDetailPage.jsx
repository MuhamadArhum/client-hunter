import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const statusColors = { new: 'bg-violet-100 text-violet-700', contacted: 'bg-orange-100 text-orange-700', proposal_sent: 'bg-purple-100 text-purple-700', follow_up: 'bg-yellow-100 text-yellow-700', closed_won: 'bg-emerald-100 text-emerald-700', closed_lost: 'bg-red-100 text-red-700' };
const STATUSES = ['new', 'contacted', 'proposal_sent', 'follow_up', 'closed_won', 'closed_lost'];

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    Promise.all([api.get(`/leads/${id}`), api.get(`/outreach/history/${id}`).catch(() => ({ data: { data: [] } }))])
      .then(([leadRes, histRes]) => { setLead(leadRes.data.data); setStatus(leadRes.data.data.status); setHistory(histRes.data.data || []); })
      .catch(() => { toast.error('Lead not found'); navigate('/leads'); })
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (newStatus) => {
    try { await api.put(`/leads/${id}`, { status: newStatus }); setStatus(newStatus); setLead(p => ({ ...p, status: newStatus })); toast.success('Status updated'); }
    catch { toast.error('Failed to update status'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-blueGray-400">Loading...</p></div>;
  if (!lead) return null;

  return (
    <div className="w-full">
      <div className="mb-4">
        <Link to="/leads" className="text-violet-500 text-sm hover:text-violet-700"><i className="fas fa-arrow-left mr-1"></i> Back to Leads</Link>
      </div>

      <div className="flex flex-wrap">
        {/* Lead Info */}
        <div className="w-full lg:w-8/12 px-4 mb-6">
          <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
            <div className="px-6 py-4 border-b border-blueGray-200 flex items-center justify-between">
              <h3 className="font-bold text-xl text-blueGray-700">{lead.companyName}</h3>
              <span className={`text-xs font-semibold inline-block py-1 px-3 rounded-full uppercase ${statusColors[status] || 'bg-blueGray-100 text-blueGray-600'}`}>{status?.replace(/_/g, ' ')}</span>
            </div>
            <div className="px-6 py-4 grid grid-cols-2 gap-4">
              {[['Contact', lead.contactName], ['Email', lead.email], ['Phone', lead.phone], ['Website', lead.website], ['Industry', lead.industry], ['Source', lead.source]].map(([label, value]) => value ? (
                <div key={label}>
                  <p className="text-xs uppercase text-blueGray-400 font-bold mb-1">{label}</p>
                  <p className="text-sm text-blueGray-700">{label === 'Website' ? <a href={value} target="_blank" rel="noreferrer" className="text-violet-500 hover:underline">{value}</a> : value}</p>
                </div>
              ) : null)}
            </div>
            {lead.notes && <div className="px-6 pb-4"><p className="text-xs uppercase text-blueGray-400 font-bold mb-1">Notes</p><p className="text-sm text-blueGray-600">{lead.notes}</p></div>}
          </div>
        </div>

        {/* Status + History */}
        <div className="w-full lg:w-4/12 px-4">
          <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
            <div className="px-6 py-4 border-b border-blueGray-200"><h4 className="font-bold text-blueGray-700">Update Status</h4></div>
            <div className="px-6 py-4 space-y-2">
              {STATUSES.map(s => (
                <button key={s} onClick={() => updateStatus(s)}
                  className={`w-full text-left text-xs font-bold uppercase px-3 py-2 rounded transition-colors ${status === s ? 'bg-violet-500 text-white' : 'bg-blueGray-100 text-blueGray-600 hover:bg-blueGray-200'}`}>
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
            <div className="px-6 py-4 border-b border-blueGray-200"><h4 className="font-bold text-blueGray-700">Outreach History</h4></div>
            <div className="px-6 py-4">
              {history.length === 0 ? <p className="text-sm text-blueGray-400">No outreach history</p> : (
                <div className="space-y-3">
                  {history.map((h) => (
                    <div key={h._id} className="border-l-4 border-violet-400 pl-3">
                      <p className="text-xs font-bold uppercase text-blueGray-500">{h.type} — <span className={`${h.status === 'sent' ? 'text-emerald-500' : h.status === 'pending' ? 'text-orange-500' : 'text-blueGray-400'}`}>{h.status}</span></p>
                      <p className="text-xs text-blueGray-600 mt-1 line-clamp-2">{h.message}</p>
                      <p className="text-xs text-blueGray-400 mt-1">{h.createdAt ? new Date(h.createdAt).toLocaleDateString() : ''}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

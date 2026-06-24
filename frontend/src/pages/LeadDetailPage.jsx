import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const STATUSES = ['new', 'contacted', 'proposal_sent', 'follow_up', 'closed_won', 'closed_lost'];
const statusColors = {
  new: 'badge-info', contacted: 'badge-warning', proposal_sent: 'badge-primary',
  follow_up: 'badge-secondary', closed_won: 'badge-success', closed_lost: 'badge-danger',
};

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/leads/${id}`),
      api.get(`/outreach/history/${id}`).catch(() => ({ data: { data: [] } }))
    ]).then(([lRes, hRes]) => {
      setLead(lRes.data.data);
      setStatus(lRes.data.data.status);
      setHistory(hRes.data.data || []);
    }).catch(() => { toast.error('Lead not found'); navigate('/leads'); })
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (newStatus) => {
    try {
      await api.put(`/leads/${id}`, { status: newStatus });
      setStatus(newStatus);
      setLead(p => ({ ...p, status: newStatus }));
      toast.success('Status updated');
    } catch { toast.error('Failed to update'); }
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: 200 }}>
      <div className="spinner-border text-warning" role="status"></div>
    </div>
  );
  if (!lead) return null;

  return (
    <div className="row">
      <div className="col-12 mb-2">
        <Link to="/leads" className="text-info">
          <i className="ft-arrow-left mr-1"></i> Back to Leads
        </Link>
      </div>

      {/* Lead Info */}
      <div className="col-lg-8">
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">{lead.companyName}</h4>
            <span className={`badge ${statusColors[status] || 'badge-secondary'} float-right`} style={{ fontSize: 12 }}>
              {status?.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="card-content">
            <div className="card-body">
              <div className="row">
                {[
                  ['Contact', lead.contactName],
                  ['Email', lead.email],
                  ['Phone', lead.phone],
                  ['Industry', lead.industry],
                  ['Source', lead.source],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} className="col-md-6 mb-2">
                    <p className="text-muted font-small-2 mb-0">{label}</p>
                    <p className="font-weight-bold mb-0">{value}</p>
                  </div>
                ))}
                {lead.website && (
                  <div className="col-md-6 mb-2">
                    <p className="text-muted font-small-2 mb-0">Website</p>
                    <a href={lead.website} target="_blank" rel="noreferrer" className="text-info">{lead.website}</a>
                  </div>
                )}
              </div>
              {lead.notes && (
                <div className="mt-2">
                  <p className="text-muted font-small-2 mb-1">Notes</p>
                  <p>{lead.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status + History */}
      <div className="col-lg-4">
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Update Status</h4>
          </div>
          <div className="card-content">
            <div className="card-body">
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  className={`btn btn-block mb-1 btn-sm ${status === s ? 'btn-info' : 'btn-outline-secondary'}`}
                >
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Outreach History</h4>
          </div>
          <div className="card-content">
            <div className="card-body">
              {history.length === 0 ? (
                <p className="text-muted text-center">No outreach history</p>
              ) : (
                history.map(h => (
                  <div key={h._id} className="border-left border-info pl-2 mb-2">
                    <p className="mb-0">
                      <strong className="text-uppercase font-small-2">{h.type}</strong>
                      <span className={`badge ml-1 ${h.status === 'sent' ? 'badge-success' : h.status === 'pending' ? 'badge-warning' : 'badge-secondary'}`}>
                        {h.status}
                      </span>
                    </p>
                    <p className="text-muted font-small-2 mb-0">{h.message?.substring(0, 80)}...</p>
                    <p className="text-muted font-small-2 mb-0">{h.createdAt ? new Date(h.createdAt).toLocaleDateString() : ''}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

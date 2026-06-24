import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const statusColors = {
  new: 'badge-info',
  contacted: 'badge-warning',
  proposal_sent: 'badge-primary',
  follow_up: 'badge-secondary',
  closed_won: 'badge-success',
  closed_lost: 'badge-danger',
};

const statCards = [
  { title: 'Total Leads',  key: 'totalLeads', icon: 'ft-users',     cls: 'bg-gradient-x-purple' },
  { title: 'New Leads',    key: 'newLeads',   icon: 'ft-user-plus', cls: 'bg-gradient-x-blue'   },
  { title: 'Proposals',    key: 'proposals',  icon: 'ft-file-text', cls: 'bg-gradient-x-teal'   },
  { title: 'Closed Won',   key: 'closedWon',  icon: 'ft-award',     cls: 'bg-gradient-x-pink'   },
];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview').catch(() => ({ data: {} })),
      api.get('/leads?limit=5&sort=-createdAt').catch(() => ({ data: { data: [] } })),
    ]).then(([statsRes, leadsRes]) => {
      setStats(statsRes.data.data || statsRes.data);
      setRecentLeads(leadsRes.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="row">
      <div className="col-12">
        <div className="content-header row">
          <div className="content-header-left col-12 mb-2 mt-1">
            <h3 className="content-header-title">Dashboard</h3>
            <div className="row breadcrumbs-top">
              <div className="breadcrumb-wrapper col-12">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item active">Overview</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {statCards.map((s) => (
        <div key={s.key} className="col-xl-3 col-lg-6 col-md-6 col-sm-12">
          <div className={`card ${s.cls} text-white`}>
            <div className="card-content">
              <div className="card-body">
                <div className="media d-flex">
                  <div className="align-self-center">
                    <i className={`${s.icon} white font-large-2 float-left`}></i>
                  </div>
                  <div className="media-body text-right">
                    <h3 className="white mb-0">{loading ? '—' : (stats?.[s.key] ?? 0)}</h3>
                    <span>{s.title}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="col-12 mt-1">
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Recent Leads</h4>
            <Link to="/leads" className="btn btn-sm btn-info float-right">View All</Link>
          </div>
          <div className="card-content">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Company</th><th>Contact</th><th>Status</th><th>Source</th><th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} className="text-center py-3 text-muted">Loading...</td></tr>
                    ) : recentLeads.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-3 text-muted">
                        No leads yet. <Link to="/leads" className="text-info">Add your first lead</Link>
                      </td></tr>
                    ) : recentLeads.map(lead => (
                      <tr key={lead._id}>
                        <td><Link to={`/leads/${lead._id}`} className="text-info font-weight-bold">{lead.companyName}</Link></td>
                        <td>{lead.contactName || '—'}</td>
                        <td><span className={`badge ${statusColors[lead.status] || 'badge-secondary'}`}>{lead.status?.replace(/_/g, ' ')}</span></td>
                        <td className="text-capitalize">{lead.source || '—'}</td>
                        <td>{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

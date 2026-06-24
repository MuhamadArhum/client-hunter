import React, { useState, useEffect } from 'react';
import api from '../services/api';

const statCards = [
  { title: 'Total Leads', key: 'totalLeads', icon: 'ft-users',     cls: 'bg-gradient-x-purple' },
  { title: 'New Leads',   key: 'newLeads',   icon: 'ft-user-plus', cls: 'bg-gradient-x-blue'   },
  { title: 'Proposals',   key: 'proposals',  icon: 'ft-file-text', cls: 'bg-gradient-x-teal'   },
  { title: 'Closed Won',  key: 'closedWon',  icon: 'ft-award',     cls: 'bg-gradient-x-pink'   },
];

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/overview').then(r => setData(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: 200 }}>
      <div className="spinner-border text-info" role="status"></div>
    </div>
  );

  return (
    <div className="row">
      <div className="col-12">
        <div className="content-header row">
          <div className="content-header-left col-12 mb-2 mt-1">
            <h3 className="content-header-title">Analytics</h3>
          </div>
        </div>
      </div>

      {statCards.map(s => (
        <div key={s.key} className="col-xl-3 col-lg-6 col-md-6 col-sm-12">
          <div className={`card ${s.cls} text-white`}>
            <div className="card-content">
              <div className="card-body">
                <div className="media d-flex">
                  <div className="align-self-center">
                    <i className={`${s.icon} white font-large-2 float-left`}></i>
                  </div>
                  <div className="media-body text-right">
                    <h3 className="white mb-0">{data?.[s.key] ?? '—'}</h3>
                    <span>{s.title}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {data?.statusBreakdown && (
        <div className="col-md-6 mt-1">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Leads by Status</h4>
            </div>
            <div className="card-content">
              <div className="card-body">
                <div className="row">
                  {Object.entries(data.statusBreakdown).map(([status, count]) => (
                    <div key={status} className="col-6 col-md-4 mb-2">
                      <div className="border rounded p-2 text-center">
                        <h4 className="text-info font-weight-bold mb-0">{count}</h4>
                        <p className="text-muted font-small-2 mb-0 text-uppercase">{status.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {data?.sourceBreakdown && (
        <div className="col-md-6 mt-1">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Leads by Source</h4>
            </div>
            <div className="card-content">
              <div className="card-body">
                <div className="row">
                  {Object.entries(data.sourceBreakdown).map(([source, count]) => (
                    <div key={source} className="col-6 col-md-4 mb-2">
                      <div className="border rounded p-2 text-center">
                        <h4 className="text-purple font-weight-bold mb-0">{count}</h4>
                        <p className="text-muted font-small-2 mb-0 text-uppercase">{source}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

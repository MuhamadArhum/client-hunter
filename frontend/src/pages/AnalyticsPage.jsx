import React, { useState, useEffect } from 'react';
import api from '../services/api';

function StatCard({ title, value, icon, iconBg, sub }) {
  return (
    <div className="relative flex flex-col min-w-0 break-words bg-white rounded mb-6 xl:mb-0 shadow-lg">
      <div className="flex-auto p-4">
        <div className="flex flex-wrap">
          <div className="relative w-full pr-4 max-w-full flex-grow flex-1">
            <h5 className="text-blueGray-400 uppercase font-bold text-xs">{title}</h5>
            <span className="font-semibold text-xl text-blueGray-700">{value ?? '—'}</span>
          </div>
          <div className="relative w-auto pl-4 flex-initial">
            <div className={`text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-full ${iconBg}`}>
              <i className={icon}></i>
            </div>
          </div>
        </div>
        {sub && <p className="text-sm text-blueGray-400 mt-4">{sub}</p>}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/overview').then(r => setData(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="px-4 md:px-10 mx-auto w-full pt-4 text-center py-12 text-blueGray-400">Loading analytics...</div>;

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-blueGray-700 mb-6">Analytics</h2>

      {/* Stats grid */}
      <div className="flex flex-wrap">
        {[
          { title: 'Total Leads', value: data?.totalLeads, icon: 'fas fa-users', iconBg: 'bg-red-500', sub: 'All time' },
          { title: 'New Leads', value: data?.newLeads, icon: 'fas fa-user-plus', iconBg: 'bg-orange-500', sub: 'Status: new' },
          { title: 'Proposals', value: data?.proposals, icon: 'fas fa-file-alt', iconBg: 'bg-pink-500', sub: 'Total generated' },
          { title: 'Closed Won', value: data?.closedWon, icon: 'fas fa-trophy', iconBg: 'bg-emerald-500', sub: 'Won deals' },
        ].map((s, i) => (
          <div key={i} className="w-full lg:w-6/12 xl:w-3/12 px-4">
            <StatCard {...s} />
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      {data?.statusBreakdown && (
        <div className="flex flex-wrap mt-6">
          <div className="w-full px-4">
            <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
              <div className="px-6 py-4 border-b border-blueGray-200">
                <h3 className="font-bold text-blueGray-700">Leads by Status</h3>
              </div>
              <div className="px-6 py-4">
                <div className="flex flex-wrap gap-4">
                  {Object.entries(data.statusBreakdown).map(([status, count]) => (
                    <div key={status} className="bg-blueGray-50 rounded-lg px-4 py-3 text-center min-w-24">
                      <p className="text-2xl font-bold text-blueGray-700">{count}</p>
                      <p className="text-xs text-blueGray-500 uppercase font-semibold mt-1">{status.replace(/_/g, ' ')}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Source breakdown */}
      {data?.sourceBreakdown && (
        <div className="flex flex-wrap">
          <div className="w-full px-4">
            <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
              <div className="px-6 py-4 border-b border-blueGray-200">
                <h3 className="font-bold text-blueGray-700">Leads by Source</h3>
              </div>
              <div className="px-6 py-4">
                <div className="flex flex-wrap gap-4">
                  {Object.entries(data.sourceBreakdown).map(([source, count]) => (
                    <div key={source} className="bg-blueGray-50 rounded-lg px-4 py-3 text-center min-w-24">
                      <p className="text-2xl font-bold text-blueGray-700">{count}</p>
                      <p className="text-xs text-blueGray-500 uppercase font-semibold mt-1">{source}</p>
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

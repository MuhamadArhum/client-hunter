import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const statusColors = {
  new: 'bg-violet-100 text-violet-700',
  contacted: 'bg-orange-100 text-orange-700',
  proposal_sent: 'bg-purple-100 text-purple-700',
  follow_up: 'bg-yellow-100 text-yellow-700',
  closed_won: 'bg-emerald-100 text-emerald-700',
  closed_lost: 'bg-red-100 text-red-700',
};

const SOURCES = ['manual', 'apify', 'linkedin', 'upwork', 'google_maps', 'other'];
const STATUSES = ['new', 'contacted', 'proposal_sent', 'follow_up', 'closed_won', 'closed_lost'];

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState({ companyName: '', contactName: '', email: '', phone: '', website: '', industry: '', source: 'manual', status: 'new', notes: '' });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      const res = await api.get(`/leads?${params}`);
      setLeads(res.data.data || []);
    } catch { toast.error('Failed to load leads'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLeads(); }, [search, filterStatus]);

  const handleScrape = async () => {
    setScraping(true);
    try {
      const res = await api.post('/leads/scrape', { query: 'web development agencies', location: 'United States', limit: 10 });
      toast.success(`Scraped ${res.data.count || 0} new leads!`);
      fetchLeads();
    } catch (err) { toast.error(err.response?.data?.message || 'Scraping failed'); }
    finally { setScraping(false); }
  };

  const openAdd = () => { setEditLead(null); setForm({ companyName: '', contactName: '', email: '', phone: '', website: '', industry: '', source: 'manual', status: 'new', notes: '' }); setShowModal(true); };
  const openEdit = (lead) => { setEditLead(lead); setForm({ companyName: lead.companyName, contactName: lead.contactName || '', email: lead.email || '', phone: lead.phone || '', website: lead.website || '', industry: lead.industry || '', source: lead.source || 'manual', status: lead.status || 'new', notes: lead.notes || '' }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editLead) { await api.put(`/leads/${editLead._id}`, form); toast.success('Lead updated!'); }
      else { await api.post('/leads', form); toast.success('Lead added!'); }
      setShowModal(false); fetchLeads();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    try { await api.delete(`/leads/${id}`); toast.success('Deleted'); fetchLeads(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-blueGray-700">Leads</h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleScrape} disabled={scraping} className="bg-emerald-500 text-white text-xs font-bold uppercase px-4 py-2 rounded shadow hover:bg-emerald-600 transition-colors disabled:opacity-60">
            <i className="fas fa-robot mr-2"></i>{scraping ? 'Scraping...' : 'Scrape Leads'}
          </button>
          <button onClick={openAdd} className="bg-violet-500 text-white text-xs font-bold uppercase px-4 py-2 rounded shadow hover:bg-violet-600 transition-colors">
            <i className="fas fa-plus mr-2"></i>Add Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text" placeholder="Search leads..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-0 px-3 py-2 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring"
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="border-0 px-3 py-2 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
        <div className="block w-full overflow-x-auto">
          <table className="items-center w-full bg-transparent border-collapse">
            <thead>
              <tr>
                {['Company', 'Contact', 'Email', 'Status', 'Source', 'Actions'].map(h => (
                  <th key={h} className="px-6 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-blueGray-400">Loading...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-blueGray-400">No leads found</td></tr>
              ) : leads.map((lead) => (
                <tr key={lead._id} className="hover:bg-blueGray-50">
                  <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                    <Link to={`/leads/${lead._id}`} className="font-bold text-blueGray-700 hover:text-violet-500">{lead.companyName}</Link>
                  </td>
                  <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-blueGray-600">{lead.contactName || '—'}</td>
                  <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-blueGray-500">{lead.email || '—'}</td>
                  <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                    <span className={`text-xs font-semibold inline-block py-1 px-2 rounded-full uppercase ${statusColors[lead.status] || 'bg-blueGray-100 text-blueGray-600'}`}>
                      {lead.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-blueGray-500 capitalize">{lead.source || '—'}</td>
                  <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                    <button onClick={() => openEdit(lead)} className="text-violet-500 hover:text-violet-700 mr-3"><i className="fas fa-edit"></i></button>
                    <button onClick={() => handleDelete(lead._id)} className="text-red-400 hover:text-red-600"><i className="fas fa-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-blueGray-200">
              <h3 className="font-bold text-blueGray-700 text-lg">{editLead ? 'Edit Lead' : 'Add Lead'}</h3>
              <button onClick={() => setShowModal(false)} className="text-blueGray-400 hover:text-blueGray-600"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-3">
              {[['companyName', 'Company Name', 'text', true], ['contactName', 'Contact Name', 'text', false], ['email', 'Email', 'email', false], ['phone', 'Phone', 'text', false], ['website', 'Website', 'url', false], ['industry', 'Industry', 'text', false]].map(([field, label, type, req]) => (
                <div key={field}>
                  <label className="block uppercase text-blueGray-600 text-xs font-bold mb-1">{label}</label>
                  <input type={type} required={req} value={form[field]} onChange={(e) => setForm(p => ({ ...p, [field]: e.target.value }))}
                    className="border-0 px-3 py-2 placeholder-blueGray-300 text-blueGray-600 bg-blueGray-100 rounded text-sm w-full focus:outline-none focus:ring" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-blueGray-600 text-xs font-bold mb-1">Source</label>
                  <select value={form.source} onChange={(e) => setForm(p => ({ ...p, source: e.target.value }))}
                    className="border-0 px-3 py-2 text-blueGray-600 bg-blueGray-100 rounded text-sm w-full focus:outline-none focus:ring">
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block uppercase text-blueGray-600 text-xs font-bold mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))}
                    className="border-0 px-3 py-2 text-blueGray-600 bg-blueGray-100 rounded text-sm w-full focus:outline-none focus:ring">
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block uppercase text-blueGray-600 text-xs font-bold mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} rows={3}
                  className="border-0 px-3 py-2 placeholder-blueGray-300 text-blueGray-600 bg-blueGray-100 rounded text-sm w-full focus:outline-none focus:ring" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-blueGray-200 text-blueGray-700 text-xs font-bold uppercase px-4 py-2 rounded hover:bg-blueGray-300">Cancel</button>
                <button type="submit" className="flex-1 bg-violet-500 text-white text-xs font-bold uppercase px-4 py-2 rounded hover:bg-violet-600">{editLead ? 'Update' : 'Add Lead'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

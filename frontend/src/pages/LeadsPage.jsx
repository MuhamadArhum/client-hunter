import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const statusColors = {
  new: 'badge-info',
  contacted: 'badge-warning',
  proposal_sent: 'badge-primary',
  follow_up: 'badge-secondary',
  closed_won: 'badge-success',
  closed_lost: 'badge-danger',
};

const SOURCES = ['manual', 'apify', 'linkedin', 'upwork', 'google_maps', 'other'];
const STATUSES = ['new', 'contacted', 'proposal_sent', 'follow_up', 'closed_won', 'closed_lost'];
const emptyForm = { companyName: '', contactName: '', email: '', phone: '', website: '', industry: '', source: 'manual', status: 'new', notes: '' };

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState(emptyForm);

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

  const openAdd = () => { setEditLead(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (lead) => {
    setEditLead(lead);
    setForm({ companyName: lead.companyName, contactName: lead.contactName || '', email: lead.email || '', phone: lead.phone || '', website: lead.website || '', industry: lead.industry || '', source: lead.source || 'manual', status: lead.status || 'new', notes: lead.notes || '' });
    setShowModal(true);
  };

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
    <div className="row">
      <div className="col-12">
        <div className="content-header row">
          <div className="content-header-left col-12 mb-2 mt-1">
            <h3 className="content-header-title">Leads</h3>
          </div>
        </div>
      </div>

      <div className="col-12">
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">All Leads</h4>
            <div className="heading-elements">
              <button onClick={handleScrape} disabled={scraping} className="btn btn-sm btn-success mr-1">
                <i className="ft-zap mr-1"></i>{scraping ? 'Scraping...' : 'Scrape Leads'}
              </button>
              <button onClick={openAdd} className="btn btn-sm btn-info">
                <i className="ft-plus mr-1"></i>Add Lead
              </button>
            </div>
          </div>

          <div className="card-content">
            <div className="card-body">
              <div className="row mb-2">
                <div className="col-md-4">
                  <input type="text" className="form-control" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="col-md-3">
                  <select className="form-control" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">All Statuses</option>
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Contact</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Source</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className="text-center py-3 text-muted">Loading...</td></tr>
                    ) : leads.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-3 text-muted">No leads found</td></tr>
                    ) : leads.map(lead => (
                      <tr key={lead._id}>
                        <td>
                          <Link to={`/leads/${lead._id}`} className="text-info font-weight-bold">
                            {lead.companyName}
                          </Link>
                        </td>
                        <td>{lead.contactName || '—'}</td>
                        <td>{lead.email || '—'}</td>
                        <td><span className={`badge ${statusColors[lead.status] || 'badge-secondary'}`}>{lead.status?.replace(/_/g, ' ')}</span></td>
                        <td className="text-capitalize">{lead.source || '—'}</td>
                        <td>
                          <button onClick={() => openEdit(lead)} className="btn btn-sm btn-icon btn-info mr-1" title="Edit">
                            <i className="ft-edit"></i>
                          </button>
                          <button onClick={() => handleDelete(lead._id)} className="btn btn-sm btn-icon btn-danger" title="Delete">
                            <i className="ft-trash-2"></i>
                          </button>
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

      {showModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editLead ? 'Edit Lead' : 'Add Lead'}</h5>
                <button type="button" className="close" onClick={() => setShowModal(false)}><span>&times;</span></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Company Name *</label>
                        <input type="text" className="form-control" required value={form.companyName} onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Contact Name</label>
                        <input type="text" className="form-control" value={form.contactName} onChange={e => setForm(p => ({ ...p, contactName: e.target.value }))} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Email</label>
                        <input type="email" className="form-control" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Phone</label>
                        <input type="text" className="form-control" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Website</label>
                        <input type="url" className="form-control" value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Industry</label>
                        <input type="text" className="form-control" value={form.industry} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Source</label>
                        <select className="form-control" value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}>
                          {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Status</label>
                        <select className="form-control" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-group">
                        <label>Notes</label>
                        <textarea className="form-control" rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-danger" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-info">{editLead ? 'Update' : 'Add Lead'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

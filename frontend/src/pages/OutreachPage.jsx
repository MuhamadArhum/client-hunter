import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function OutreachPage() {
  const [leads, setLeads] = useState([]);
  const [activeTab, setActiveTab] = useState('email');
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [emailForm, setEmailForm] = useState({ subject: '', message: '' });
  const [waForm, setWaForm] = useState({ message: '' });
  const [sendLoading, setSendLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ leadId: '', type: 'email', subject: '', message: '', scheduledAt: '' });
  const [pendingFollowUps, setPendingFollowUps] = useState([]);

  useEffect(() => {
    api.get('/leads?limit=100&status=new,contacted,proposal_sent,follow_up').then(r => setLeads(r.data.data || [])).catch(() => {});
    fetchFollowUps();
  }, []);

  const fetchFollowUps = async () => {
    try {
      const res = await api.get('/leads?limit=20');
      const allLeads = res.data.data || [];
      const followUps = [];
      for (const lead of allLeads.slice(0, 10)) {
        try {
          const logRes = await api.get(`/outreach/history/${lead._id}`);
          const pending = (logRes.data.data || []).filter(l => l.status === 'pending');
          pending.forEach(log => followUps.push({ ...log, leadName: lead.companyName }));
        } catch {}
      }
      followUps.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
      setPendingFollowUps(followUps);
    } catch {}
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!selectedLeadId) { toast.error('Select a lead'); return; }
    setSendLoading(true);
    try {
      await api.post('/outreach/email', { leadId: selectedLeadId, ...emailForm });
      toast.success('Email sent!');
      setEmailForm({ subject: '', message: '' });
      setSelectedLeadId('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send'); }
    finally { setSendLoading(false); }
  };

  const handleSendWA = async (e) => {
    e.preventDefault();
    if (!selectedLeadId) { toast.error('Select a lead'); return; }
    setSendLoading(true);
    try {
      await api.post('/outreach/whatsapp', { leadId: selectedLeadId, ...waForm });
      toast.success('WhatsApp sent!');
      setWaForm({ message: '' });
      setSelectedLeadId('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send'); }
    finally { setSendLoading(false); }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    setSendLoading(true);
    try {
      await api.post('/outreach/schedule', scheduleForm);
      toast.success('Follow-up scheduled!');
      setShowScheduleModal(false);
      fetchFollowUps();
      setScheduleForm({ leadId: '', type: 'email', subject: '', message: '', scheduledAt: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSendLoading(false); }
  };

  return (
    <div className="row">
      <div className="col-12">
        <div className="content-header row">
          <div className="content-header-left col-12 mb-2 mt-1">
            <h3 className="content-header-title">Outreach</h3>
          </div>
        </div>
      </div>

      {/* Send Panel */}
      <div className="col-lg-8">
        <div className="card">
          <div className="card-header">
            <ul className="nav nav-tabs card-header-tabs">
              <li className="nav-item">
                <a className={`nav-link ${activeTab === 'email' ? 'active' : ''}`} href="#!" onClick={e => { e.preventDefault(); setActiveTab('email'); }}>
                  <i className="ft-mail mr-1"></i>Email
                </a>
              </li>
              <li className="nav-item">
                <a className={`nav-link ${activeTab === 'whatsapp' ? 'active' : ''}`} href="#!" onClick={e => { e.preventDefault(); setActiveTab('whatsapp'); }}>
                  <i className="fa fa-whatsapp mr-1"></i>WhatsApp
                </a>
              </li>
            </ul>
          </div>
          <div className="card-content">
            <div className="card-body">
              <div className="form-group">
                <label>Select Lead</label>
                <select className="form-control" value={selectedLeadId} onChange={e => setSelectedLeadId(e.target.value)}>
                  <option value="">Choose a lead...</option>
                  {leads.map(l => <option key={l._id} value={l._id}>{l.companyName}{l.contactName ? ` (${l.contactName})` : ''}</option>)}
                </select>
              </div>

              {activeTab === 'email' ? (
                <form onSubmit={handleSendEmail}>
                  <div className="form-group">
                    <label>Subject</label>
                    <input className="form-control" required placeholder="Partnership Opportunity" value={emailForm.subject} onChange={e => setEmailForm(p => ({ ...p, subject: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Message</label>
                    <textarea className="form-control" required rows={7} placeholder="Dear [Name],&#10;&#10;I'm reaching out from AbyteHunt..." value={emailForm.message} onChange={e => setEmailForm(p => ({ ...p, message: e.target.value }))} />
                  </div>
                  <button type="submit" disabled={sendLoading} className="btn btn-info btn-block">
                    <i className="ft-send mr-1"></i>{sendLoading ? 'Sending...' : 'Send Email'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSendWA}>
                  <div className="form-group">
                    <label>Message</label>
                    <textarea className="form-control" required rows={7} placeholder="Hi [Name], I'm reaching out from AbyteHunt..." value={waForm.message} onChange={e => setWaForm(p => ({ ...p, message: e.target.value }))} />
                  </div>
                  <button type="submit" disabled={sendLoading} className="btn btn-success btn-block">
                    <i className="fa fa-whatsapp mr-1"></i>{sendLoading ? 'Sending...' : 'Send WhatsApp'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Follow-ups sidebar */}
      <div className="col-lg-4">
        <div className="card">
          <div className="card-header">
            <h4 className="card-title"><i className="ft-clock mr-1 text-warning"></i>Scheduled Follow-ups</h4>
            <button onClick={() => setShowScheduleModal(true)} className="btn btn-sm btn-info">
              <i className="ft-plus"></i>
            </button>
          </div>
          <div className="card-content">
            <div className="card-body">
              {pendingFollowUps.length === 0 ? (
                <p className="text-muted text-center">No scheduled follow-ups</p>
              ) : (
                pendingFollowUps.map(log => (
                  <div key={log._id} className="border rounded p-2 mb-2">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <strong className="font-small-3">{log.leadName}</strong>
                      <span className={`badge ${log.type === 'email' ? 'badge-primary' : 'badge-success'}`}>{log.type}</span>
                    </div>
                    <p className="text-muted font-small-2 mb-1">{log.message?.substring(0, 60)}...</p>
                    {log.scheduledAt && (
                      <p className="text-warning font-small-2 mb-0">
                        <i className="ft-clock mr-1"></i>{new Date(log.scheduledAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Schedule Follow-up</h5>
                <button type="button" className="close" onClick={() => setShowScheduleModal(false)}><span>&times;</span></button>
              </div>
              <form onSubmit={handleSchedule}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Lead *</label>
                    <select className="form-control" required value={scheduleForm.leadId} onChange={e => setScheduleForm(p => ({ ...p, leadId: e.target.value }))}>
                      <option value="">Select lead...</option>
                      {leads.map(l => <option key={l._id} value={l._id}>{l.companyName}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select className="form-control" value={scheduleForm.type} onChange={e => setScheduleForm(p => ({ ...p, type: e.target.value }))}>
                      <option value="email">Email</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="manual">Manual</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Subject (optional)</label>
                    <input className="form-control" placeholder="Follow-up subject" value={scheduleForm.subject} onChange={e => setScheduleForm(p => ({ ...p, subject: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Message *</label>
                    <textarea className="form-control" required rows={3} placeholder="Your follow-up message..." value={scheduleForm.message} onChange={e => setScheduleForm(p => ({ ...p, message: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Scheduled Date & Time *</label>
                    <input type="datetime-local" className="form-control" required value={scheduleForm.scheduledAt} onChange={e => setScheduleForm(p => ({ ...p, scheduledAt: e.target.value }))} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowScheduleModal(false)}>Cancel</button>
                  <button type="submit" disabled={sendLoading} className="btn btn-info">
                    {sendLoading ? 'Scheduling...' : 'Schedule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

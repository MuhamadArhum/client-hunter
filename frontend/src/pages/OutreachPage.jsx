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
    try { await api.post('/outreach/email', { leadId: selectedLeadId, ...emailForm }); toast.success('Email sent!'); setEmailForm({ subject: '', message: '' }); setSelectedLeadId(''); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to send'); }
    finally { setSendLoading(false); }
  };

  const handleSendWA = async (e) => {
    e.preventDefault();
    if (!selectedLeadId) { toast.error('Select a lead'); return; }
    setSendLoading(true);
    try { await api.post('/outreach/whatsapp', { leadId: selectedLeadId, ...waForm }); toast.success('WhatsApp sent!'); setWaForm({ message: '' }); setSelectedLeadId(''); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to send'); }
    finally { setSendLoading(false); }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    setSendLoading(true);
    try { await api.post('/outreach/schedule', scheduleForm); toast.success('Follow-up scheduled!'); setShowScheduleModal(false); fetchFollowUps(); setScheduleForm({ leadId: '', type: 'email', subject: '', message: '', scheduledAt: '' }); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSendLoading(false); }
  };

  const inputCls = "border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150";
  const labelCls = "block uppercase text-blueGray-600 text-xs font-bold mb-2";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-blueGray-700">Outreach</h2>
      </div>

      <div className="flex flex-wrap">
        {/* Send Panel */}
        <div className="w-full lg:w-8/12 px-4 mb-6">
          <div className="relative flex flex-col min-w-0 break-words bg-white w-full shadow-lg rounded">
            {/* Tabs */}
            <div className="px-6 py-3 border-b border-blueGray-200 flex gap-4">
              {['email', 'whatsapp'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`text-xs font-bold uppercase py-2 px-4 rounded transition-colors ${activeTab === tab ? 'bg-violet-500 text-white' : 'text-blueGray-500 hover:text-blueGray-700'}`}>
                  <i className={`${tab === 'email' ? 'fas fa-envelope' : 'fab fa-whatsapp'} mr-2`}></i>{tab}
                </button>
              ))}
            </div>

            <div className="px-6 py-6">
              <div className="relative w-full mb-4">
                <label className={labelCls}>Select Lead</label>
                <select value={selectedLeadId} onChange={e => setSelectedLeadId(e.target.value)} className={inputCls}>
                  <option value="">Choose a lead...</option>
                  {leads.map(l => <option key={l._id} value={l._id}>{l.companyName}{l.contactName ? ` (${l.contactName})` : ''}</option>)}
                </select>
              </div>

              {activeTab === 'email' ? (
                <form onSubmit={handleSendEmail}>
                  <div className="relative w-full mb-3">
                    <label className={labelCls}>Subject</label>
                    <input value={emailForm.subject} onChange={e => setEmailForm(p => ({ ...p, subject: e.target.value }))} required placeholder="Partnership Opportunity with AbyteHunt" className={inputCls} />
                  </div>
                  <div className="relative w-full mb-4">
                    <label className={labelCls}>Message</label>
                    <textarea value={emailForm.message} onChange={e => setEmailForm(p => ({ ...p, message: e.target.value }))} required rows={8} placeholder="Dear [Name],&#10;&#10;I'm reaching out from AbyteHunt..." className={inputCls} />
                  </div>
                  <button type="submit" disabled={sendLoading} className="bg-violet-500 text-white text-sm font-bold uppercase px-6 py-3 rounded shadow hover:bg-violet-600 w-full disabled:opacity-60">
                    <i className="fas fa-envelope mr-2"></i>{sendLoading ? 'Sending...' : 'Send Email'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSendWA}>
                  <div className="relative w-full mb-4">
                    <label className={labelCls}>Message</label>
                    <textarea value={waForm.message} onChange={e => setWaForm(p => ({ ...p, message: e.target.value }))} required rows={8} placeholder="Hi [Name], I'm reaching out from AbyteHunt..." className={inputCls} />
                  </div>
                  <button type="submit" disabled={sendLoading} className="bg-emerald-500 text-white text-sm font-bold uppercase px-6 py-3 rounded shadow hover:bg-emerald-600 w-full disabled:opacity-60">
                    <i className="fab fa-whatsapp mr-2"></i>{sendLoading ? 'Sending...' : 'Send WhatsApp'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Follow-ups sidebar */}
        <div className="w-full lg:w-4/12 px-4">
          <div className="relative flex flex-col min-w-0 break-words bg-white w-full shadow-lg rounded">
            <div className="px-6 py-4 border-b border-blueGray-200 flex items-center justify-between">
              <h4 className="font-bold text-blueGray-700"><i className="fas fa-clock mr-2 text-orange-400"></i>Scheduled Follow-ups</h4>
              <button onClick={() => setShowScheduleModal(true)} className="bg-violet-500 text-white text-xs font-bold px-2 py-1 rounded hover:bg-violet-600">
                <i className="fas fa-plus"></i>
              </button>
            </div>
            <div className="px-6 py-4">
              {pendingFollowUps.length === 0 ? (
                <p className="text-sm text-blueGray-400 text-center py-4">No scheduled follow-ups</p>
              ) : (
                <div className="space-y-3">
                  {pendingFollowUps.map(log => (
                    <div key={log._id} className="bg-blueGray-50 rounded p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-blueGray-700">{log.leadName}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${log.type === 'email' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>{log.type}</span>
                      </div>
                      <p className="text-xs text-blueGray-500 line-clamp-2">{log.message}</p>
                      {log.scheduledAt && <p className="text-xs text-orange-500 mt-1"><i className="fas fa-clock mr-1"></i>{new Date(log.scheduledAt).toLocaleDateString()}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-blueGray-200">
              <h3 className="font-bold text-blueGray-700">Schedule Follow-up</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-blueGray-400 hover:text-blueGray-600"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSchedule} className="px-6 py-4 space-y-3">
              <div>
                <label className={labelCls}>Lead</label>
                <select value={scheduleForm.leadId} onChange={e => setScheduleForm(p => ({ ...p, leadId: e.target.value }))} required className="border-0 px-3 py-2 text-blueGray-600 bg-blueGray-100 rounded text-sm w-full focus:outline-none focus:ring">
                  <option value="">Select lead...</option>
                  {leads.map(l => <option key={l._id} value={l._id}>{l.companyName}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Type</label>
                <select value={scheduleForm.type} onChange={e => setScheduleForm(p => ({ ...p, type: e.target.value }))} className="border-0 px-3 py-2 text-blueGray-600 bg-blueGray-100 rounded text-sm w-full focus:outline-none focus:ring">
                  <option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="manual">Manual</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Subject (optional)</label>
                <input value={scheduleForm.subject} onChange={e => setScheduleForm(p => ({ ...p, subject: e.target.value }))} placeholder="Follow-up subject" className="border-0 px-3 py-2 placeholder-blueGray-300 text-blueGray-600 bg-blueGray-100 rounded text-sm w-full focus:outline-none focus:ring" />
              </div>
              <div>
                <label className={labelCls}>Message</label>
                <textarea value={scheduleForm.message} onChange={e => setScheduleForm(p => ({ ...p, message: e.target.value }))} required rows={3} placeholder="Your follow-up message..." className="border-0 px-3 py-2 placeholder-blueGray-300 text-blueGray-600 bg-blueGray-100 rounded text-sm w-full focus:outline-none focus:ring" />
              </div>
              <div>
                <label className={labelCls}>Scheduled Date & Time</label>
                <input type="datetime-local" value={scheduleForm.scheduledAt} onChange={e => setScheduleForm(p => ({ ...p, scheduledAt: e.target.value }))} required className="border-0 px-3 py-2 text-blueGray-600 bg-blueGray-100 rounded text-sm w-full focus:outline-none focus:ring" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="flex-1 bg-blueGray-200 text-blueGray-700 text-xs font-bold uppercase px-4 py-2 rounded hover:bg-blueGray-300">Cancel</button>
                <button type="submit" disabled={sendLoading} className="flex-1 bg-violet-500 text-white text-xs font-bold uppercase px-4 py-2 rounded hover:bg-violet-600 disabled:opacity-60">{sendLoading ? 'Scheduling...' : 'Schedule'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

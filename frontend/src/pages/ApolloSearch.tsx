import { useState } from 'react';
import { Search, UserPlus, Building2, Globe, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/services/api';

interface ApolloContact {
  apolloId: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  companyName: string;
  website: string;
  industry: string;
  city: string;
  country: string;
  linkedin: string;
}

const labelStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 10.5,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#6E7D79',
};

const inputStyle: React.CSSProperties = {
  borderRadius: 4,
  border: '1px solid #CBD3CF',
  fontSize: 13,
};

export default function ApolloSearch() {
  const [company, setCompany] = useState('');
  const [keywords, setKeywords] = useState('');
  const [title, setTitle] = useState('');
  const [results, setResults] = useState<ApolloContact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleSearch = async () => {
    if (!company && !keywords && !title) {
      setAlert({ type: 'error', msg: 'Enter at least one search filter.' });
      return;
    }
    setLoading(true); setAlert(null); setSelected(new Set());
    try {
      const res = await api.post('/apollo/search', {
        q_organization_name: company || undefined,
        q_keywords: keywords || undefined,
        person_titles: title || undefined,
      });
      setResults(res.data?.data || []);
      setTotal(res.data?.total || 0);
      if ((res.data?.data || []).length === 0) {
        setAlert({ type: 'error', msg: 'No results found. Try different search terms.' });
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setAlert({ type: 'error', msg: err?.response?.data?.message || 'Search failed. Check Apollo API key in Settings.' });
    } finally { setLoading(false); }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleImport = async () => {
    const contacts = results.filter((r) => selected.has(r.apolloId));
    if (contacts.length === 0) { setAlert({ type: 'error', msg: 'Select at least one contact to import.' }); return; }
    setImporting(true); setAlert(null);
    try {
      const res = await api.post('/apollo/import', { contacts });
      setAlert({ type: 'success', msg: res.data?.message || 'Import complete!' });
      setSelected(new Set());
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setAlert({ type: 'error', msg: err?.response?.data?.message || 'Import failed.' });
    } finally { setImporting(false); }
  };

  return (
    <div className="space-y-5 p-6" style={{ background: '#E6E9E5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, borderTop: '3px solid #7C3AED', padding: '20px 24px' }}>
        <div className="flex items-center gap-2 mb-1">
          <Search className="h-4 w-4" style={{ color: '#7C3AED' }} />
          <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7C3AED' }}>Lead Discovery</span>
        </div>
        <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1B1F2B', marginBottom: 4 }}>Apollo.io Search</h1>
        <p style={{ fontSize: 13, color: '#6E7D79' }}>Search and import leads from Apollo.io's 275M+ contact database</p>
      </div>

      {/* Search filters */}
      <div className="p-5 space-y-4" style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4 }}>
        <h3 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 13, fontWeight: 600, textTransform: 'uppercase', color: '#1B1F2B' }}>Search Filters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label style={labelStyle}>Company Name</Label>
            <Input
              className="h-10 text-sm" style={inputStyle}
              placeholder="e.g. Acme Corp"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="space-y-1.5">
            <Label style={labelStyle}>Keywords</Label>
            <Input
              className="h-10 text-sm" style={inputStyle}
              placeholder="e.g. SaaS, fintech"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="space-y-1.5">
            <Label style={labelStyle}>Job Title</Label>
            <Input
              className="h-10 text-sm" style={inputStyle}
              placeholder="e.g. CEO, Founder, CTO"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="h-10 px-5 gap-2 flex items-center font-semibold text-sm text-white"
          style={{ background: '#7C3AED', borderRadius: 4, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'IBM Plex Sans', sans-serif", opacity: loading ? 0.7 : 1 }}
        >
          {loading
            ? <><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Searching...</>
            : <><Search className="h-3.5 w-3.5" /> Search Apollo</>}
        </button>
      </div>

      {/* Alert */}
      {alert && (
        <div
          className="flex items-center gap-2.5 text-sm p-3"
          style={{
            borderRadius: 4,
            border: alert.type === 'success' ? '1px solid rgba(62,142,90,0.3)' : '1px solid rgba(194,59,46,0.25)',
            background: alert.type === 'success' ? 'rgba(62,142,90,0.08)' : 'rgba(194,59,46,0.08)',
            color: alert.type === 'success' ? '#3E8E5A' : '#C23B2E',
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}
        >
          {alert.msg}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div style={{ background: '#F1F4F0', border: '1px solid #CBD3CF', borderRadius: 4, overflow: 'hidden' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #CBD3CF' }}>
            <div>
              <h3 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, fontWeight: 600, textTransform: 'uppercase', color: '#1B1F2B' }}>Results</h3>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: '#6E7D79', marginTop: 2 }}>
                {total.toLocaleString()} total — showing {results.length}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelected(new Set(results.map((r) => r.apolloId)))}
                className="h-8 px-3 text-xs font-semibold"
                style={{ borderRadius: 4, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', color: '#7C3AED', cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace" }}
              >
                <Users className="h-3 w-3 inline mr-1" />Select All ({results.length})
              </button>
              {selected.size > 0 && (
                <>
                  <button
                    onClick={() => setSelected(new Set())}
                    className="h-8 px-3 text-xs font-semibold"
                    style={{ borderRadius: 4, background: 'rgba(110,125,121,0.1)', border: '1px solid #CBD3CF', color: '#6E7D79', cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace" }}
                  >Clear</button>
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="h-8 px-3 gap-1.5 flex items-center text-xs font-semibold text-white"
                    style={{ borderRadius: 4, background: '#3E8E5A', border: 'none', cursor: importing ? 'not-allowed' : 'pointer', fontFamily: "'IBM Plex Sans', sans-serif", opacity: importing ? 0.7 : 1 }}
                  >
                    {importing
                      ? <><span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Importing...</>
                      : <><UserPlus className="h-3.5 w-3.5" /> Import {selected.size}</>}
                  </button>
                </>
              )}
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #CBD3CF', background: 'rgba(203,211,207,0.3)' }}>
                <th className="px-5 py-3 w-10" />
                {['Name / Title', 'Company', 'Email', 'Location'].map((h) => (
                  <th key={h} className="text-left px-4 py-3" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6E7D79' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((r, idx) => (
                <tr
                  key={r.apolloId}
                  onClick={() => toggleSelect(r.apolloId)}
                  style={{
                    borderBottom: idx === results.length - 1 ? 'none' : '1px solid #CBD3CF',
                    background: selected.has(r.apolloId) ? 'rgba(124,58,237,0.05)' : 'transparent',
                    transition: 'background 0.15s',
                    cursor: 'pointer',
                  }}
                >
                  <td className="px-5 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(r.apolloId)}
                      onChange={() => toggleSelect(r.apolloId)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ accentColor: '#7C3AED', cursor: 'pointer' }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-sm" style={{ color: '#1B1F2B', fontFamily: "'IBM Plex Sans', sans-serif" }}>{r.name || '—'}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#6E7D79' }}>{r.title || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 shrink-0" style={{ color: '#6E7D79' }} />
                      <span className="text-sm font-medium" style={{ color: '#1B1F2B' }}>{r.companyName || '—'}</span>
                    </div>
                    {r.website && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Globe className="h-3 w-3 shrink-0" style={{ color: '#9CADB0' }} />
                        <span className="text-xs" style={{ color: '#6E7D79' }}>{r.website}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p style={{ color: r.email ? '#1B1F2B' : '#9CADB0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5 }}>
                      {r.email || 'Hidden'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm" style={{ color: '#6E7D79' }}>
                      {[r.city, r.country].filter(Boolean).join(', ') || '—'}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

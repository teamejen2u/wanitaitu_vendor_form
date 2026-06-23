import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Search, 
  Download, 
  Eye, 
  Users, 
  Ticket, 
  Sparkles, 
  X, 
  Unlock, 
  RefreshCw,
  LogOut,
  Mail
} from 'lucide-react';
import { supabase, isSupabaseConfigured, mockDb } from '../supabaseClient';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(isSupabaseConfigured);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Supabase Auth credentials (used when Supabase is configured)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Local-dev passcode (used only when Supabase is NOT configured)
  const [passcode, setPasscode] = useState('');

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Default passcode for local-dev fallback (no Supabase keys set)
  const REQUIRED_PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE || 'wanitaitu';

  // --- Supabase Auth login (email/password) ---
  const handleSupabaseLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (signInErr) {
        setAuthError(signInErr.message || 'Login failed. Check your credentials.');
        return;
      }
      // onAuthStateChange will flip isAuthenticated to true
      setPassword('');
    } catch (err) {
      setAuthError(err.message || 'An unexpected error occurred during login.');
    } finally {
      setAuthLoading(false);
    }
  };

  // --- Local-dev passcode login (mock mode only) ---
  const handlePasscodeLogin = (e) => {
    e.preventDefault();
    if (passcode === REQUIRED_PASSCODE) {
      setIsAuthenticated(true);
      setAuthError('');
      sessionStorage.setItem('admin_auth', 'true');
    } else {
      setAuthError('Incorrect passcode. Please try again.');
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
      // onAuthStateChange will flip isAuthenticated to false
    } else {
      setIsAuthenticated(false);
      sessionStorage.removeItem('admin_auth');
    }
    setPasscode('');
    setEmail('');
    setPassword('');
  };

  // Check auth session on mount
  useEffect(() => {
    if (isSupabaseConfigured) {
      // Restore existing Supabase session, then subscribe to changes
      supabase.auth.getSession().then(({ data }) => {
        setIsAuthenticated(!!data.session);
        setAuthChecking(false);
      });

      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsAuthenticated(!!session);
        setAuthChecking(false);
      });

      return () => {
        listener?.subscription?.unsubscribe();
      };
    }

    // Mock mode: restore passcode session from sessionStorage
    const isAuthed = sessionStorage.getItem('admin_auth');
    if (isAuthed === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch submissions from Supabase or Mock DB
  const fetchSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      let result;
      if (isSupabaseConfigured) {
        result = await supabase
          .from('vendor_submissions')
          .select('*')
          .order('created_at', { ascending: false });
      } else {
        result = await mockDb.selectSubmissions();
      }

      if (result.error) throw result.error;
      setSubmissions(result.data || []);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError('Could not retrieve submissions: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubmissions();
    }
  }, [isAuthenticated]);

  // Escape a CSV value: wrap in quotes if it contains commas, quotes, or newlines
  const csvEscape = (val) => {
    if (val == null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Export to CSV Function
  const exportToCSV = () => {
    if (submissions.length === 0) return;

    // Headers
    const headers = [
      'Submission ID',
      'Date Submitted',
      'Vendor/Brand Name',
      'Contact Person',
      'Contact Phone',
      'Logo URL',
      'Offers Discount Coupon',
      'Coupon Type',
      'Coupon Value',
      'Coupon Limit Type',
      'Coupon Limit Value',
      'Offers Scratch & Win',
      'Scratch & Win Prize',
      'Scratch Win Limit Type',
      'Scratch Win Limit Value'
    ];

    // Rows — every value passed through csvEscape so commas, quotes, and newlines are handled
    const rows = submissions.map(sub => [
      csvEscape(sub.id),
      csvEscape(new Date(sub.created_at).toLocaleString()),
      csvEscape(sub.vendor_name),
      csvEscape(sub.contact_name),
      csvEscape(sub.contact_phone),
      csvEscape(sub.logo_url || ''),
      csvEscape(sub.join_coupon ? 'YES' : 'NO'),
      csvEscape(sub.coupon_type || ''),
      csvEscape(sub.coupon_value || ''),
      csvEscape(sub.coupon_limit_type || ''),
      csvEscape(sub.coupon_limit_value || ''),
      csvEscape(sub.join_scratch_win ? 'YES' : 'NO'),
      csvEscape(sub.scratch_win_prize || ''),
      csvEscape(sub.scratch_win_limit_type || ''),
      csvEscape(sub.scratch_win_limit_value || '')
    ]);

    // Build CSV with BOM so Excel opens it correctly as UTF-8
    const csvString = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `wanitaitu_vendor_promotions_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter submissions by search query
  const filteredSubmissions = submissions.filter(sub => 
    sub.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.contact_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute analytics
  const totalSubmissions = submissions.length;
  const couponCount = submissions.filter(sub => sub.join_coupon).length;
  const scratchCount = submissions.filter(sub => sub.join_scratch_win).length;

  // Render Passcode / Auth Gate
  if (!isAuthenticated) {
    // While restoring a Supabase session, avoid flashing the login form
    if (authChecking) {
      return (
        <div className="admin-auth-container">
          <RefreshCw size={32} className="spin-animation" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }} />
          <p>Checking session...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }

    // Supabase Auth: email/password login
    if (isSupabaseConfigured) {
      return (
        <div className="admin-auth-container">
          <div className="admin-auth-icon">
            <Lock size={32} />
          </div>
          <h2>Admin Dashboard</h2>
          <p>Sign in with your organizer account to view vendor promotional offers.</p>

          <form onSubmit={handleSupabaseLogin}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <input
                type="email"
                className="form-input"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <input
                type="password"
                className="form-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              {authError && <div className="auth-error">{authError}</div>}
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={authLoading}
            >
              {authLoading ? (
                <RefreshCw size={18} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Mail size={18} />
              )}
              <span>{authLoading ? 'Signing in...' : 'Sign In'}</span>
            </button>
          </form>
          <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
            Organizer accounts are managed in Supabase. Contact the system administrator for access.
          </p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }

    // Local-dev fallback: passcode gate (mock mode, no Supabase keys)
    return (
      <div className="admin-auth-container">
        <div className="admin-auth-icon">
          <Lock size={32} />
        </div>
        <h2>Admin Dashboard</h2>
        <p>Enter the organizer access passcode to view vendor promotional offers details.</p>
        
        <form onSubmit={handlePasscodeLogin}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <input 
              type="password"
              className="form-input"
              placeholder="Passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.1em' }}
              autoFocus
            />
            {authError && <div className="auth-error">{authError}</div>}
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            <Unlock size={18} />
            <span>Unlock Dashboard</span>
          </button>
        </form>
        <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
          Local-dev mode (Supabase not configured). Default passcode is <code>wanitaitu</code> unless VITE_ADMIN_PASSCODE env key is set.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-title-area">
          <h2>Organizer Dashboard</h2>
          <p>Review promotional campaigns registered by the event vendors</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={fetchSubmissions} 
            className="btn btn-secondary" 
            title="Reload database"
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? 'spin-animation' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span className="hide-mobile">Refresh</span>
          </button>
          <button onClick={exportToCSV} className="btn btn-secondary" disabled={submissions.length === 0}>
            <Download size={18} />
            <span>Export CSV</span>
          </button>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ color: 'var(--rose-500)', borderColor: 'var(--rose-200)' }}>
            <LogOut size={18} />
            <span className="hide-mobile">Lock</span>
          </button>
        </div>
      </div>

      {/* Analytics widgets */}
      <div className="admin-stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--rose-50)', color: 'var(--rose-500)' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>Registered Vendors</h3>
            <p>{totalSubmissions}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--purple-100)', color: 'var(--purple-500)' }}>
            <Ticket size={24} />
          </div>
          <div className="stat-info">
            <h3>Discount Coupons</h3>
            <p>{couponCount}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--gold-100)', color: 'var(--gold-600)' }}>
            <Sparkles size={24} />
          </div>
          <div className="stat-info">
            <h3>Gores & Menang</h3>
            <p>{scratchCount}</p>
          </div>
        </div>
      </div>

      {/* Main List */}
      <div>
        <div className="table-controls">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search vendor or contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: 500 }}>
            Showing {filteredSubmissions.length} of {totalSubmissions} submissions
          </div>
        </div>

        {error && (
          <div className="auth-error" style={{ padding: '1rem', backgroundColor: 'var(--rose-50)', border: '1px solid var(--rose-200)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {loading && submissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate-500)' }}>
            <RefreshCw size={32} className="spin-animation" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }} />
            <p>Loading database submissions...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)', color: 'var(--slate-500)' }}>
            <p style={{ fontWeight: 600, color: 'var(--slate-800)' }}>No submissions found</p>
            <p style={{ fontSize: '0.85rem' }}>Try refining your search query or refresh the database.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Logo</th>
                  <th>Brand / Vendor Name</th>
                  <th>Contact Person</th>
                  <th>WhatsApp / Phone</th>
                  <th>Selected Campaigns</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      {sub.logo_url ? (
                        <img src={sub.logo_url} alt="Vendor Logo" className="table-logo" />
                      ) : (
                        <div className="table-logo-fallback">
                          {sub.vendor_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{sub.vendor_name}</td>
                    <td>{sub.contact_name}</td>
                    <td>
                      <a 
                        href={`https://wa.me/${sub.contact_phone.replace(/[^0-9]/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: 'var(--rose-500)', textDecoration: 'none', fontWeight: 500 }}
                      >
                        {sub.contact_phone}
                      </a>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {sub.join_coupon && (
                          <span className="badge badge-coupon">
                            <Ticket size={12} />
                            Discount Coupon
                          </span>
                        )}
                        {sub.join_scratch_win && (
                          <span className="badge badge-scratch">
                            <Sparkles size={12} />
                            Gores & Menang
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button 
                        onClick={() => setSelectedSubmission(sub)} 
                        className="action-btn"
                      >
                        <Eye size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                        <span>View Offer</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal overlay */}
      {selectedSubmission && (
        <div className="modal-overlay" onClick={() => setSelectedSubmission(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Vendor Campaign Details</h3>
              <button className="modal-close-btn" onClick={() => setSelectedSubmission(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {/* Profile details */}
              <div className="detail-section">
                <h4>Vendor Profile</h4>
                <div className="detail-logo-container">
                  {selectedSubmission.logo_url ? (
                    <img src={selectedSubmission.logo_url} alt="Logo" className="detail-logo" />
                  ) : (
                    <div className="table-logo-fallback" style={{ width: '64px', height: '64px', fontSize: '1.5rem' }}>
                      {selectedSubmission.vendor_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--slate-800)' }}>
                      {selectedSubmission.vendor_name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                      Submitted: {new Date(selectedSubmission.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="detail-grid" style={{ marginTop: '1rem' }}>
                  <div className="detail-item">
                    <label>Contact Person</label>
                    <p>{selectedSubmission.contact_name}</p>
                  </div>
                  <div className="detail-item">
                    <label>WhatsApp / Phone</label>
                    <p>
                      <a 
                        href={`https://wa.me/${selectedSubmission.contact_phone.replace(/[^0-9]/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: 'var(--rose-500)', textDecoration: 'none' }}
                      >
                        {selectedSubmission.contact_phone}
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Coupon details */}
              {selectedSubmission.join_coupon && (
                <div className="detail-section">
                  <h4>Discount Coupon Offer</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Coupon Discount Value</label>
                      <p style={{ color: 'var(--purple-500)', fontSize: '1.1rem' }}>
                        {selectedSubmission.coupon_type === 'percentage' 
                          ? `${selectedSubmission.coupon_value}% OFF` 
                          : `RM${selectedSubmission.coupon_value} OFF`}
                      </p>
                    </div>
                    <div className="detail-item">
                      <label>Redemption limits</label>
                      <p>
                        {selectedSubmission.coupon_limit_type === 'unlimited' 
                          ? 'Unlimited Redemptions' 
                          : `Limit: First ${selectedSubmission.coupon_limit_value} customers`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Scratch card details */}
              {selectedSubmission.join_scratch_win && (
                <div className="detail-section">
                  <h4>Gores & Menang (Scratch & Win) Prize</h4>
                  <div style={{ backgroundColor: 'var(--slate-50)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--gold-600)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <Sparkles size={14} />
                      <span>OFFERED PRIZE</span>
                    </div>
                    <p style={{ fontWeight: 600, color: 'var(--slate-800)', wordBreak: 'break-word' }}>
                      {selectedSubmission.scratch_win_prize}
                    </p>
                  </div>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Prize Limit</label>
                      <p>
                        {selectedSubmission.scratch_win_limit_type === 'unlimited'
                          ? 'Unlimited Winners'
                          : `Limit: First ${selectedSubmission.scratch_win_limit_value} winners`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--slate-100)', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedSubmission(null)}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Spin style helper */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 640px) {
          .hide-mobile {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

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
  Mail,
  Trash2
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

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);

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

  const handleDeleteSubmission = async (id, vendorName) => {
    if (!window.confirm(`Are you sure you want to delete the submission for "${vendorName}"?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let result;
      if (isSupabaseConfigured) {
        result = await supabase
          .from('vendor_submissions')
          .delete()
          .eq('id', id);
      } else {
        result = await mockDb.deleteSubmission(id);
      }

      if (result.error) throw result.error;

      // Update state
      setSubmissions(prev => prev.filter(sub => sub.id !== id));
      if (selectedSubmission && selectedSubmission.id === id) {
        setSelectedSubmission(null);
      }
    } catch (err) {
      console.error('Error deleting submission:', err);
      setError('Could not delete submission: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const formatMYDateTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString('en-MY', {
        timeZone: 'Asia/Kuala_Lumpur',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  const startEditing = () => {
    const sub = selectedSubmission;
    if (!sub) return;

    let normalizedCoupons = [];
    if (sub.join_coupon) {
      if (sub.coupons && sub.coupons.length > 0) {
        normalizedCoupons = JSON.parse(JSON.stringify(sub.coupons));
      } else {
        normalizedCoupons = [{
          type: sub.coupon_type || 'percentage',
          value: sub.coupon_value || '',
          limit_type: sub.coupon_limit_type || 'unlimited',
          limit_value: sub.coupon_limit_value || ''
        }];
      }
    }

    let normalizedScratch = [];
    if (sub.join_scratch_win) {
      if (sub.scratch_prizes && sub.scratch_prizes.length > 0) {
        normalizedScratch = JSON.parse(JSON.stringify(sub.scratch_prizes));
      } else {
        normalizedScratch = [{
          prize: sub.scratch_win_prize || '',
          limit_type: sub.scratch_win_limit_type || 'unlimited',
          limit_value: sub.scratch_win_limit_value || ''
        }];
      }
    }

    setEditForm({
      id: sub.id,
      vendor_name: sub.vendor_name || '',
      contact_name: sub.contact_name || '',
      contact_phone: sub.contact_phone || '',
      logo_url: sub.logo_url || '',
      join_coupon: !!sub.join_coupon,
      coupons: normalizedCoupons,
      join_scratch_win: !!sub.join_scratch_win,
      scratch_prizes: normalizedScratch
    });
    setEditErrors({});
    setIsEditing(true);
  };

  const handleAddCoupon = () => {
    if (editForm.coupons.length >= 3) return;
    setEditForm(prev => ({
      ...prev,
      coupons: [
        ...prev.coupons,
        { type: 'percentage', value: '', limit_type: 'unlimited', limit_value: '' }
      ]
    }));
  };

  const handleUpdateCoupon = (index, field, value) => {
    setEditForm(prev => {
      const updated = [...prev.coupons];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, coupons: updated };
    });

    const errorKey = `coupon_${index}_${field}`;
    if (editErrors[errorKey]) {
      setEditErrors(prev => {
        const copy = { ...prev };
        delete copy[errorKey];
        return copy;
      });
    }
  };

  const handleRemoveCoupon = (index) => {
    setEditForm(prev => {
      const updated = prev.coupons.filter((_, idx) => idx !== index);
      return { ...prev, coupons: updated };
    });
  };

  const handleAddScratch = () => {
    if (editForm.scratch_prizes.length >= 3) return;
    setEditForm(prev => ({
      ...prev,
      scratch_prizes: [
        ...prev.scratch_prizes,
        { prize: '', limit_type: 'unlimited', limit_value: '' }
      ]
    }));
  };

  const handleUpdateScratch = (index, field, value) => {
    setEditForm(prev => {
      const updated = [...prev.scratch_prizes];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, scratch_prizes: updated };
    });

    const errorKey = `scratch_${index}_${field}`;
    if (editErrors[errorKey]) {
      setEditErrors(prev => {
        const copy = { ...prev };
        delete copy[errorKey];
        return copy;
      });
    }
  };

  const handleRemoveScratch = (index) => {
    setEditForm(prev => {
      const updated = prev.scratch_prizes.filter((_, idx) => idx !== index);
      return { ...prev, scratch_prizes: updated };
    });
  };

  const validateEditForm = () => {
    const errors = {};
    if (!editForm.vendor_name.trim()) errors.vendor_name = 'Brand/Vendor name is required';
    if (!editForm.contact_name.trim()) errors.contact_name = 'Contact person is required';
    if (!editForm.contact_phone.trim()) errors.contact_phone = 'WhatsApp number is required';

    if (editForm.join_coupon) {
      if (editForm.coupons.length === 0) {
        errors.coupons_general = 'Please add at least one coupon or disable coupons.';
      } else {
        editForm.coupons.forEach((c, index) => {
          const valNum = parseFloat(c.value);
          if (!c.value || isNaN(valNum) || valNum <= 0) {
            errors[`coupon_${index}_value`] = 'Enter a valid discount value';
          } else if (c.type === 'percentage' && valNum > 100) {
            errors[`coupon_${index}_value`] = 'Percentage cannot exceed 100%';
          }

          if (c.limit_type === 'limited') {
            const limNum = parseInt(c.limit_value, 10);
            if (!c.limit_value || isNaN(limNum) || limNum <= 0) {
              errors[`coupon_${index}_limit_value`] = 'Enter limit count';
            }
          }
        });
      }
    }

    if (editForm.join_scratch_win) {
      if (editForm.scratch_prizes.length === 0) {
        errors.scratch_general = 'Please add at least one scratch prize or disable scratch & win.';
      } else {
        editForm.scratch_prizes.forEach((s, index) => {
          if (!s.prize.trim()) {
            errors[`scratch_${index}_prize`] = 'Prize description is required';
          }

          if (s.limit_type === 'limited') {
            const limNum = parseInt(s.limit_value, 10);
            if (!s.limit_value || isNaN(limNum) || limNum <= 0) {
              errors[`scratch_${index}_limit_value`] = 'Enter limit count';
            }
          }
        });
      }
    }

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!validateEditForm()) return;

    setSaveLoading(true);
    setError(null);
    try {
      const firstCoupon = editForm.join_coupon && editForm.coupons[0] ? editForm.coupons[0] : null;
      const firstScratch = editForm.join_scratch_win && editForm.scratch_prizes[0] ? editForm.scratch_prizes[0] : null;

      const payload = {
        vendor_name: editForm.vendor_name.trim(),
        contact_name: editForm.contact_name.trim(),
        contact_phone: editForm.contact_phone.trim(),
        join_coupon: editForm.join_coupon,
        coupons: editForm.join_coupon ? editForm.coupons.map(c => ({
          type: c.type,
          value: parseFloat(c.value),
          limit_type: c.limit_type,
          limit_value: c.limit_type === 'limited' ? parseInt(c.limit_value, 10) : null
        })) : [],

        coupon_type: firstCoupon ? firstCoupon.type : null,
        coupon_value: firstCoupon ? parseFloat(firstCoupon.value) : null,
        coupon_limit_type: firstCoupon ? firstCoupon.limit_type : null,
        coupon_limit_value: firstCoupon && firstCoupon.limit_type === 'limited' ? parseInt(firstCoupon.limit_value, 10) : null,

        join_scratch_win: editForm.join_scratch_win,
        scratch_prizes: editForm.join_scratch_win ? editForm.scratch_prizes.map(s => ({
          prize: s.prize.trim(),
          limit_type: s.limit_type,
          limit_value: s.limit_type === 'limited' ? parseInt(s.limit_value, 10) : null,
          prize_image_url: s.prize_image_url || null
        })) : [],

        scratch_win_prize: firstScratch ? firstScratch.prize.trim() : null,
        scratch_win_limit_type: firstScratch ? firstScratch.limit_type : null,
        scratch_win_limit_value: firstScratch && firstScratch.limit_type === 'limited' ? parseInt(firstScratch.limit_value, 10) : null
      };

      let result;
      if (isSupabaseConfigured) {
        result = await supabase
          .from('vendor_submissions')
          .update(payload)
          .eq('id', editForm.id)
          .select();
      } else {
        result = await mockDb.updateSubmission(editForm.id, payload);
      }

      if (result.error) throw result.error;

      const updatedRecord = (Array.isArray(result.data) ? result.data[0] : result.data) || { ...selectedSubmission, ...payload };

      setSubmissions(prev => prev.map(sub => sub.id === editForm.id ? updatedRecord : sub));
      setSelectedSubmission(updatedRecord);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving updates:', err);
      setError('Could not save modifications: ' + (err.message || err));
    } finally {
      setSaveLoading(false);
    }
  };

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
      'Total Coupons',
      'Coupon Details',
      'Offers Scratch & Win',
      'Total Scratch Prizes',
      'Scratch Prizes Details'
    ];

    // Rows — every value passed through csvEscape so commas, quotes, and newlines are handled
    const rows = submissions.map(sub => {
      let totalCoupons = 0;
      let couponDetailsStr = '';

      if (sub.join_coupon) {
        if (sub.coupons && sub.coupons.length > 0) {
          totalCoupons = sub.coupons.length;
          couponDetailsStr = sub.coupons.map((c, idx) => {
            const valStr = c.type === 'percentage' ? `${c.value}% OFF` : `RM${c.value} OFF`;
            const limStr = c.limit_type === 'limited' ? `Limit: ${c.limit_value}` : 'Unlimited';
            return `[Coupon #${idx + 1}] ${valStr} (${limStr})`;
          }).join('; ');
        } else {
          totalCoupons = 1;
          const valStr = sub.coupon_type === 'percentage' ? `${sub.coupon_value}% OFF` : `RM${sub.coupon_value} OFF`;
          const limStr = sub.coupon_limit_type === 'limited' ? `Limit: ${sub.coupon_limit_value}` : 'Unlimited';
          couponDetailsStr = `[Coupon #1] ${valStr} (${limStr})`;
        }
      }

      let totalScratch = 0;
      let scratchDetailsStr = '';

      if (sub.join_scratch_win) {
        if (sub.scratch_prizes && sub.scratch_prizes.length > 0) {
          totalScratch = sub.scratch_prizes.length;
          scratchDetailsStr = sub.scratch_prizes.map((s, idx) => {
            const limStr = s.limit_type === 'limited' ? `Limit: ${s.limit_value}` : 'Unlimited';
            return `[Card #${idx + 1}] ${s.prize} (${limStr})`;
          }).join('; ');
        } else {
          totalScratch = 1;
          const limStr = sub.scratch_win_limit_type === 'limited' ? `Limit: ${sub.scratch_win_limit_value}` : 'Unlimited';
          scratchDetailsStr = `[Card #1] ${sub.scratch_win_prize} (${limStr})`;
        }
      }

      return [
        csvEscape(sub.id),
        csvEscape(formatMYDateTime(sub.created_at)),
        csvEscape(sub.vendor_name),
        csvEscape(sub.contact_name),
        csvEscape(sub.contact_phone),
        csvEscape(sub.logo_url || ''),
        csvEscape(sub.join_coupon ? 'YES' : 'NO'),
        csvEscape(totalCoupons),
        csvEscape(couponDetailsStr),
        csvEscape(sub.join_scratch_win ? 'YES' : 'NO'),
        csvEscape(totalScratch),
        csvEscape(scratchDetailsStr)
      ];
    });

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
                            {sub.coupons && sub.coupons.length > 1 
                              ? `${sub.coupons.length} Discount Coupons` 
                              : 'Discount Coupon'}
                          </span>
                        )}
                        {sub.join_scratch_win && (
                          <span className="badge badge-scratch">
                            <Sparkles size={12} />
                            {sub.scratch_prizes && sub.scratch_prizes.length > 1
                              ? `${sub.scratch_prizes.length} Scratch Cards`
                              : 'Gores & Menang'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                        <button 
                          onClick={() => setSelectedSubmission(sub)} 
                          className="action-btn"
                        >
                          <Eye size={16} />
                          <span>View Offer</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteSubmission(sub.id, sub.vendor_name)} 
                          className="delete-btn"
                          title="Delete Submission"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
        <div className="modal-overlay" onClick={() => !isEditing && setSelectedSubmission(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditing ? 'Edit Vendor Campaign' : 'Vendor Campaign Details'}</h3>
              <button 
                className="modal-close-btn" 
                onClick={() => {
                  if (isEditing) {
                    if (window.confirm('Discard unsaved changes?')) {
                      setIsEditing(false);
                    }
                  } else {
                    setSelectedSubmission(null);
                  }
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {isEditing ? (
                <div>
                  {/* Vendor Profile Edit */}
                  <div className="detail-section">
                    <h4>Vendor Profile (Edit)</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600 }}>Brand / Vendor Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={editForm.vendor_name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, vendor_name: e.target.value }))}
                          placeholder="E.g. Ejen2u Bateri"
                        />
                        {editErrors.vendor_name && <span style={{ color: 'var(--rose-500)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{editErrors.vendor_name}</span>}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 600 }}>Contact Person</label>
                          <input
                            type="text"
                            className="form-input"
                            value={editForm.contact_name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, contact_name: e.target.value }))}
                            placeholder="E.g. Ali"
                          />
                          {editErrors.contact_name && <span style={{ color: 'var(--rose-500)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{editErrors.contact_name}</span>}
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 600 }}>WhatsApp / Phone Number</label>
                          <input
                            type="text"
                            className="form-input"
                            value={editForm.contact_phone}
                            onChange={(e) => setEditForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                            placeholder="E.g. 60123456789"
                          />
                          {editErrors.contact_phone && <span style={{ color: 'var(--rose-500)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{editErrors.contact_phone}</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Discount Coupons Campaign Edit */}
                  <div className="detail-section" style={{ borderTop: '1px solid var(--slate-100)', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0 }}>Discount Coupon Offers</h4>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={editForm.join_coupon}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setEditForm(prev => ({
                              ...prev,
                              join_coupon: checked,
                              coupons: checked && prev.coupons.length === 0 
                                ? [{ type: 'percentage', value: '', limit_type: 'unlimited', limit_value: '' }] 
                                : prev.coupons
                            }));
                          }}
                        />
                        <span>Enable Coupons</span>
                      </label>
                    </div>

                    {editForm.join_coupon && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {editForm.coupons.map((coupon, idx) => (
                          <div 
                            key={idx} 
                            style={{ 
                              padding: '1rem', 
                              backgroundColor: 'var(--slate-50)', 
                              border: '1px solid var(--slate-200)', 
                              borderRadius: 'var(--radius-sm)',
                              position: 'relative'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--rose-500)' }}>
                                COUPON #{idx + 1}
                              </span>
                              {editForm.coupons.length > 1 && (
                                <button 
                                  type="button" 
                                  onClick={() => handleRemoveCoupon(idx)}
                                  style={{ background: 'none', border: 'none', color: 'var(--rose-500)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                                >
                                  Remove
                                </button>
                              )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                              <div className="form-group">
                                <label className="form-label" style={{ fontSize: '0.8rem' }}>Discount Type</label>
                                <select 
                                  className="form-input"
                                  value={coupon.type}
                                  onChange={(e) => handleUpdateCoupon(idx, 'type', e.target.value)}
                                >
                                  <option value="percentage">Percentage (%)</option>
                                  <option value="fixed">Fixed Amount (RM)</option>
                                </select>
                              </div>

                              <div className="form-group">
                                <label className="form-label" style={{ fontSize: '0.8rem' }}>Discount Value</label>
                                <input
                                  type="number"
                                  className="form-input"
                                  placeholder={coupon.type === 'percentage' ? 'E.g. 10' : 'E.g. 5'}
                                  value={coupon.value}
                                  onChange={(e) => handleUpdateCoupon(idx, 'value', e.target.value)}
                                />
                                {editErrors[`coupon_${idx}_value`] && (
                                  <span style={{ color: 'var(--rose-500)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                                    {editErrors[`coupon_${idx}_value`]}
                                  </span>
                                )}
                              </div>

                              <div className="form-group">
                                <label className="form-label" style={{ fontSize: '0.8rem' }}>Limit Type</label>
                                <select 
                                  className="form-input"
                                  value={coupon.limit_type}
                                  onChange={(e) => handleUpdateCoupon(idx, 'limit_type', e.target.value)}
                                >
                                  <option value="unlimited">Unlimited</option>
                                  <option value="limited">Limited</option>
                                </select>
                              </div>

                              <div className="form-group">
                                <label className="form-label" style={{ fontSize: '0.8rem' }}>Limit Value</label>
                                <input
                                  type="number"
                                  className="form-input"
                                  placeholder="E.g. 100"
                                  value={coupon.limit_value}
                                  disabled={coupon.limit_type === 'unlimited'}
                                  onChange={(e) => handleUpdateCoupon(idx, 'limit_value', e.target.value)}
                                />
                                {coupon.limit_type === 'limited' && editErrors[`coupon_${idx}_limit_value`] && (
                                  <span style={{ color: 'var(--rose-500)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                                    {editErrors[`coupon_${idx}_limit_value`]}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        {editForm.coupons.length < 3 && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleAddCoupon}
                            style={{ alignSelf: 'flex-start', borderStyle: 'dashed', borderColor: 'var(--rose-200)' }}
                          >
                            + Add Another Coupon
                          </button>
                        )}
                        {editErrors.coupons_general && (
                          <div style={{ color: 'var(--rose-500)', fontSize: '0.85rem' }}>{editErrors.coupons_general}</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Gores & Menang Campaign Edit */}
                  <div className="detail-section" style={{ borderTop: '1px solid var(--slate-100)', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0 }}>Gores & Menang Prizes</h4>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={editForm.join_scratch_win}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setEditForm(prev => ({
                              ...prev,
                              join_scratch_win: checked,
                              scratch_prizes: checked && prev.scratch_prizes.length === 0 
                                ? [{ prize: '', limit_type: 'unlimited', limit_value: '' }] 
                                : prev.scratch_prizes
                            }));
                          }}
                        />
                        <span>Enable Scratch & Win</span>
                      </label>
                    </div>

                    {editForm.join_scratch_win && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {editForm.scratch_prizes.map((scratch, idx) => (
                          <div 
                            key={idx} 
                            style={{ 
                              padding: '1rem', 
                              backgroundColor: 'var(--slate-50)', 
                              border: '1px solid var(--slate-200)', 
                              borderRadius: 'var(--radius-sm)',
                              position: 'relative'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--gold-600)' }}>
                                CARD #{idx + 1}
                              </span>
                              {editForm.scratch_prizes.length > 1 && (
                                <button 
                                  type="button" 
                                  onClick={() => handleRemoveScratch(idx)}
                                  style={{ background: 'none', border: 'none', color: 'var(--rose-500)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                                >
                                  Remove
                                </button>
                              )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              <div className="form-group">
                                <label className="form-label" style={{ fontSize: '0.8rem' }}>Prize Description</label>
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder="E.g. Free 1 box of cookies!"
                                  value={scratch.prize}
                                  onChange={(e) => handleUpdateScratch(idx, 'prize', e.target.value)}
                                />
                                {editErrors[`scratch_${idx}_prize`] && (
                                  <span style={{ color: 'var(--rose-500)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                                    {editErrors[`scratch_${idx}_prize`]}
                                  </span>
                                )}
                                {scratch.prize_image_url && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    <img 
                                      src={scratch.prize_image_url} 
                                      alt="Current Prize" 
                                      style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--slate-200)' }} 
                                    />
                                    <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Current Prize Image (Read-only)</span>
                                  </div>
                                )}
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Limit Type</label>
                                  <select 
                                    className="form-input"
                                    value={scratch.limit_type}
                                    onChange={(e) => handleUpdateScratch(idx, 'limit_type', e.target.value)}
                                  >
                                    <option value="unlimited">Unlimited</option>
                                    <option value="limited">Limited</option>
                                  </select>
                                </div>

                                <div className="form-group">
                                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Winners Limit</label>
                                  <input
                                    type="number"
                                    className="form-input"
                                    placeholder="E.g. 50"
                                    value={scratch.limit_value}
                                    disabled={scratch.limit_type === 'unlimited'}
                                    onChange={(e) => handleUpdateScratch(idx, 'limit_value', e.target.value)}
                                  />
                                  {scratch.limit_type === 'limited' && editErrors[`scratch_${idx}_limit_value`] && (
                                    <span style={{ color: 'var(--rose-500)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                                      {editErrors[`scratch_${idx}_limit_value`]}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {editForm.scratch_prizes.length < 3 && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleAddScratch}
                            style={{ alignSelf: 'flex-start', borderStyle: 'dashed', borderColor: 'var(--gold-300)' }}
                          >
                            + Add Another Scratch Prize
                          </button>
                        )}
                        {editErrors.scratch_general && (
                          <div style={{ color: 'var(--rose-500)', fontSize: '0.85rem' }}>{editErrors.scratch_general}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
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
                          Submitted: {formatMYDateTime(selectedSubmission.created_at)}
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
                      <h4>Discount Coupon Offers</h4>
                      {selectedSubmission.coupons && selectedSubmission.coupons.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                          {selectedSubmission.coupons.map((coupon, idx) => (
                            <div 
                              key={idx}
                              style={{
                                backgroundColor: 'var(--slate-50)',
                                border: '1px solid var(--slate-200)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '0.75rem 1rem'
                              }}
                            >
                              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--rose-500)', marginBottom: '0.25rem' }}>
                                COUPON #{idx + 1}
                              </div>
                              <div className="detail-grid" style={{ gridGap: '0.75rem' }}>
                                <div className="detail-item">
                                  <label>Discount Value</label>
                                  <p style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                                    {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `RM${coupon.value} OFF`}
                                  </p>
                                </div>
                                <div className="detail-item">
                                  <label>Redemption Limit</label>
                                  <p style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                                    {coupon.limit_type === 'unlimited' 
                                      ? 'Unlimited Redemptions' 
                                      : `Limit: First ${coupon.limit_value} customers`}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="detail-grid">
                          <div className="detail-item">
                            <label>Coupon Discount Value</label>
                            <p style={{ color: 'var(--rose-500)', fontSize: '1.1rem' }}>
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
                      )}
                    </div>
                  )}

                  {/* Scratch card details */}
                  {selectedSubmission.join_scratch_win && (
                    <div className="detail-section">
                      <h4>Gores & Menang (Scratch & Win) Prizes</h4>
                      {selectedSubmission.scratch_prizes && selectedSubmission.scratch_prizes.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                          {selectedSubmission.scratch_prizes.map((scratch, idx) => (
                            <div 
                              key={idx}
                              style={{
                                backgroundColor: 'var(--slate-50)',
                                border: '1px solid var(--slate-200)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '0.75rem 1rem'
                              }}
                            >
                              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--gold-600)', marginBottom: '0.25rem' }}>
                                CARD #{idx + 1}
                              </div>
                              <div className="detail-grid" style={{ gridGap: '0.75rem' }}>
                                <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                                  <label>Prize Description</label>
                                  <p style={{ fontWeight: 600, color: 'var(--slate-800)', wordBreak: 'break-word' }}>
                                    {scratch.prize}
                                  </p>
                                  {scratch.prize_image_url && (
                                    <div style={{ marginTop: '0.5rem' }}>
                                      <img 
                                        src={scratch.prize_image_url} 
                                        alt="Prize Thumbnail" 
                                        style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--slate-200)' }} 
                                      />
                                    </div>
                                  )}
                                </div>
                                <div className="detail-item">
                                  <label>Prize Limit</label>
                                  <p style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                                    {scratch.limit_type === 'unlimited'
                                      ? 'Unlimited Winners'
                                      : `Limit: First ${scratch.limit_value} winners`}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--slate-100)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              {isEditing ? (
                <>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      if (window.confirm('Discard unsaved changes?')) {
                        setIsEditing(false);
                      }
                    }}
                    disabled={saveLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleSaveChanges}
                    disabled={saveLoading}
                  >
                    {saveLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="btn btn-secondary" 
                    style={{ borderColor: 'var(--purple-200)', color: 'var(--purple-600)' }}
                    onClick={startEditing}
                  >
                    Edit Offer
                  </button>
                  <button className="btn btn-primary" onClick={() => setSelectedSubmission(null)}>
                    Close Details
                  </button>
                </>
              )}
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

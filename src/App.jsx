import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldAlert, LogIn } from 'lucide-react';
import VendorForm from './components/VendorForm';
import AdminDashboard from './components/AdminDashboard';
import WelcomePage from './components/WelcomePage';
import { isSupabaseConfigured } from './supabaseClient';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const [showWelcome, setShowWelcome] = useState(true);

  // Monitor URL change for simple client-side routing
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
      setCurrentHash(window.location.hash);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    setCurrentHash('');
  };

  const isAdminRoute = currentPath === '/admin' || currentHash === '#/admin';

  return (
    <div className="app-container">
      {/* Header section — hidden during welcome page */}
      {!(showWelcome && !isAdminRoute) && (
        <header className="app-header">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <img 
              src="https://oalebkgsqedfimyjilsf.supabase.co/storage/v1/object/public/vendor-logos/logos/cdbbdd52-317d-4d85-b02b-2618df9bafae.avif" 
              alt="Wanita Itu Logo"
              style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '8px',
                objectFit: 'cover'
              }}
            />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--rose-700)', letterSpacing: '-0.02em' }}>
              WANITA ITU
            </span>
          </div>
          
          {isAdminRoute ? (
            <h1>Organizer Portal</h1>
          ) : (
            <>
              <h1>Vendor Promotion Portal</h1>
              <p>Select and configure your brand offers for the upcoming Wanita Itu event</p>
            </>
          )}
        </header>
      )}

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        {isAdminRoute ? (
          <AdminDashboard />
        ) : showWelcome ? (
          <WelcomePage onStart={() => setShowWelcome(false)} />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Supabase Not Configured Info Banner */}
            {!isSupabaseConfigured && (
              <div style={{
                backgroundColor: 'var(--gold-50)',
                border: '1px solid var(--gold-500)',
                color: 'var(--gold-600)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                fontSize: '0.9rem',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <span style={{ fontWeight: 700 }}>Developer Notice:</span> Supabase keys are not set yet. 
                  The form is currently running on a **Local Storage Mock Database**. 
                  You can test all wizard steps, preview logo uploads, and view submitted details in the admin portal. 
                  To save real database rows, configure <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> env variables.
                </div>
              </div>
            )}

            <VendorForm />
          </motion.div>
        )}
      </main>

      {/* Footer Navigation */}
      <footer style={{
        marginTop: '4rem',
        paddingTop: '2rem',
        borderTop: '1px solid var(--slate-200)',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: 'var(--slate-500)'
      }}>
        <p style={{ marginBottom: '0.5rem' }}>&copy; {new Date().getFullYear()} Wanita Itu Event Organizers. All rights reserved.</p>
        
        <div>
          {isAdminRoute ? (
            <button 
              onClick={() => navigateTo('/')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--rose-500)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.85rem',
                textDecoration: 'underline'
              }}
            >
              Go Back to Vendor Form
            </button>
          ) : (
            <button 
              onClick={() => navigateTo('/admin')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--slate-500)',
                fontWeight: 500,
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <LogIn size={12} />
              <span>Organizer Admin Access</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

export default App;

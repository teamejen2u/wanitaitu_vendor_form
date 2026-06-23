import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Ticket, Gift } from 'lucide-react';

export default function WelcomePage({ onStart }) {
  return (
    <div className="welcome-page">
      {/* Floating decorative elements */}
      <motion.div 
        className="welcome-float welcome-float-1"
        animate={{ y: [0, -12, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Sparkles size={28} />
      </motion.div>
      <motion.div 
        className="welcome-float welcome-float-2"
        animate={{ y: [0, 10, 0], rotate: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <Ticket size={24} />
      </motion.div>
      <motion.div 
        className="welcome-float welcome-float-3"
        animate={{ y: [0, -8, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        <Gift size={22} />
      </motion.div>

      {/* Main content card */}
      <motion.div 
        className="welcome-card"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 20, delay: 0.1 }}
      >
        {/* Logo & branding */}
        <motion.img 
          src="https://oalebkgsqedfimyjilsf.supabase.co/storage/v1/object/public/vendor-logos/logos/cdbbdd52-317d-4d85-b02b-2618df9bafae.avif"
          alt="Wanita Itu Logo"
          className="welcome-logo"
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.3 }}
        />

        <motion.h1 
          className="welcome-title"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
        >
          WANITA ITU
        </motion.h1>

        <motion.div 
          className="welcome-divider"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.55, duration: 0.4 }}
        />

        <motion.h2 
          className="welcome-subtitle"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          Vendor Promotion Portal
        </motion.h2>

        <motion.p 
          className="welcome-description"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          Set up your brand promotions for the upcoming <strong>Wanita Itu</strong> event. 
          Configure discount coupons, scratch &amp; win prizes, and more to engage customers at your booth.
        </motion.p>

        <motion.button
          className="btn btn-primary welcome-cta"
          onClick={onStart}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.4 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <span>Get Started</span>
          <ArrowRight size={20} />
        </motion.button>

        <motion.div 
          className="welcome-features"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <div className="welcome-feature-item">
            <Ticket size={16} />
            <span>Discount Coupons</span>
          </div>
          <div className="welcome-feature-dot" />
          <div className="welcome-feature-item">
            <Sparkles size={16} />
            <span>Scratch &amp; Win</span>
          </div>
          <div className="welcome-feature-dot" />
          <div className="welcome-feature-item">
            <Gift size={16} />
            <span>Custom Prizes</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

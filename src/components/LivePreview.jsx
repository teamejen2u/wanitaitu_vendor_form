import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Sparkles, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import ScratchCard from './ScratchCard';

export default function LivePreview({
  vendorName = '',
  logoUrl = '',
  joinCoupon = false,
  couponType = 'percentage',
  couponValue = '',
  couponLimitType = 'unlimited',
  couponLimitValue = '',
  coupons = [],
  joinScratchWin = false,
  scratchWinPrize = '',
  scratchWinLimitType = 'unlimited',
  scratchWinLimitValue = ''
}) {
  const [activeTab, setActiveTab] = useState('coupon');

  const [activeCouponIndex, setActiveCouponIndex] = useState(0);

  const couponsToRender = (coupons && coupons.length > 0) ? coupons : [
    { type: couponType, value: couponValue, limitType: couponLimitType, limitValue: couponLimitValue }
  ];
  
  const currentIndex = Math.min(activeCouponIndex, couponsToRender.length - 1);
  const currentCoupon = couponsToRender[currentIndex] || couponsToRender[0];

  const displayVendorName = vendorName.trim() || 'Your Brand Name';
  const displayCouponValue = currentCoupon.value ? (currentCoupon.type === 'percentage' ? `${currentCoupon.value}%` : `RM${currentCoupon.value}`) : '10%';
  const displayCouponLimitType = currentCoupon.limitType;
  const displayCouponLimitValue = currentCoupon.limitValue;
  const displayPrize = scratchWinPrize.trim() || 'E.g., Free Gift with RM50 Spend';

  const hasBoth = joinCoupon && joinScratchWin;
  
  return (
    <div className="preview-panel">
      <div className="preview-panel-header">
        <Eye size={18} />
        <span>Live Customer Preview</span>
      </div>

      {!joinCoupon && !joinScratchWin ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--white)',
            border: '1.5px dashed var(--slate-300)',
            borderRadius: 'var(--radius-md)',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            color: 'var(--slate-500)',
            fontSize: '0.95rem'
          }}
        >
          <Ticket size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5, color: 'var(--rose-500)' }} />
          <p style={{ fontWeight: 600, color: 'var(--slate-800)', marginBottom: '0.25rem' }}>No promotion selected yet</p>
          <p style={{ fontSize: '0.85rem' }}>Select a promotion type in Step 2 to see the customer preview here.</p>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Tab selector if both are selected */}
          {hasBoth && (
            <div className="options-button-group" style={{ marginBottom: '0.5rem' }}>
              <button 
                type="button"
                className={`option-btn ${activeTab === 'coupon' ? 'active' : ''}`}
                onClick={() => setActiveTab('coupon')}
              >
                Discount Coupon
              </button>
              <button 
                type="button"
                className={`option-btn ${activeTab === 'scratch' ? 'active' : ''}`}
                onClick={() => setActiveTab('scratch')}
              >
                Scratch & Win
              </button>
            </div>
          )}

          {/* Coupon Preview */}
          <AnimatePresence mode="wait">
            {(joinCoupon && (!hasBoth || activeTab === 'coupon')) && (
              <motion.div
                key="coupon"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: 600 }}>
                    <Ticket size={14} color="var(--rose-500)" />
                    <span>CUSTOMER DISCOUNT COUPON</span>
                  </div>
                  {couponsToRender.length > 1 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--rose-500)', fontWeight: 700 }}>
                      COUPON {currentIndex + 1} OF {couponsToRender.length}
                    </span>
                  )}
                </div>
                
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  {/* Left Arrow */}
                  {couponsToRender.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setActiveCouponIndex(prev => (prev - 1 + couponsToRender.length) % couponsToRender.length)}
                      style={{
                        position: 'absolute',
                        left: '-15px',
                        zIndex: 10,
                        background: 'var(--white)',
                        border: '1px solid var(--slate-200)',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--slate-600)',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                  )}

                  {/* Coupon Card itself */}
                  <div className="preview-coupon" style={{ flex: 1 }}>
                    <div className="preview-coupon-dashed"></div>
                    
                    <div className="preview-coupon-top">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="preview-coupon-logo-img" />
                      ) : (
                        <div className="preview-coupon-logo-placeholder">
                          {displayVendorName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="preview-coupon-vendor-name">{displayVendorName}</div>
                    </div>

                    <div className="preview-coupon-middle">
                      <motion.div 
                        key={`${currentIndex}_${displayCouponValue}`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="preview-coupon-value"
                      >
                        {displayCouponValue} OFF
                      </motion.div>
                      <div className="preview-coupon-label">Special Event Voucher</div>
                    </div>

                    <div className="preview-coupon-bottom">
                      <span>Wanita Itu Event Exclusive</span>
                      <span>
                        {displayCouponLimitType === 'unlimited' 
                          ? 'Unlimited Redemptions' 
                          : `Limit: First ${displayCouponLimitValue || '50'} customers`}
                      </span>
                    </div>
                  </div>

                  {/* Right Arrow */}
                  {couponsToRender.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setActiveCouponIndex(prev => (prev + 1) % couponsToRender.length)}
                      style={{
                        position: 'absolute',
                        right: '-15px',
                        zIndex: 10,
                        background: 'var(--white)',
                        border: '1px solid var(--slate-200)',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--slate-600)',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  )}
                </div>

                {/* Dot Indicators */}
                {couponsToRender.length > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '0.75rem' }}>
                    {couponsToRender.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveCouponIndex(i)}
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          backgroundColor: i === currentIndex ? 'var(--rose-500)' : 'var(--slate-300)',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease'
                        }}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Scratch Card Preview — real canvas scratch */}
            {(joinScratchWin && (!hasBoth || activeTab === 'scratch')) && (
              <motion.div
                key="scratch"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: 600 }}>
                  <Sparkles size={14} color="var(--gold-500)" />
                  <span>CUSTOMER SCRATCH & WIN</span>
                </div>

                <ScratchCard
                  vendorName={displayVendorName}
                  prize={displayPrize}
                  width={280}
                  height={160}
                />

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'var(--slate-50)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  color: 'var(--slate-600)',
                  fontWeight: 500
                }}>
                  <span>Wanita Itu Event Exclusive</span>
                  <span>
                    {scratchWinLimitType === 'unlimited'
                      ? 'Unlimited Prizes'
                      : `Limit: First ${scratchWinLimitValue || '50'} winners`}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

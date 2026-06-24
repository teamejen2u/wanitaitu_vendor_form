import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Sparkles, Eye } from 'lucide-react';
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
  scratchWinLimitValue = '',
  scratchPrizes = []
}) {
  const [activeTab, setActiveTab] = useState('coupon');

  const couponsToRender = (coupons && coupons.length > 0) ? coupons : [
    { type: couponType, value: couponValue, limitType: couponLimitType, limitValue: couponLimitValue }
  ];

  const scratchPrizesToRender = (scratchPrizes && scratchPrizes.length > 0) ? scratchPrizes : [
    { prize: scratchWinPrize, limitType: scratchWinLimitType, limitValue: scratchWinLimitValue }
  ];

  const displayVendorName = vendorName.trim() || 'Your Brand Name';
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
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: 600 }}>
                  <Ticket size={14} color="var(--rose-500)" />
                  <span>CUSTOMER DISCOUNT COUPON{couponsToRender.length > 1 ? 'S' : ''}</span>
                </div>
                
                {couponsToRender.map((coupon, idx) => {
                  const valStr = coupon.value ? (coupon.type === 'percentage' ? `${coupon.value}%` : `RM${coupon.value}`) : '10%';
                  const limType = coupon.limitType;
                  const limValue = coupon.limitValue;
                  
                  return (
                    <div key={coupon.id || idx} style={{ display: 'flex', flexDirection: 'column' }}>
                      {couponsToRender.length > 1 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--rose-500)', fontWeight: 700, marginBottom: '0.25rem' }}>
                          COUPON #{idx + 1}
                        </div>
                      )}
                      
                      <div className="preview-coupon">
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
                          <div className="preview-coupon-value">
                            {valStr} OFF
                          </div>
                          <div className="preview-coupon-label">Special Event Voucher</div>
                        </div>

                        <div className="preview-coupon-bottom">
                          <span>Wanita Itu Event Exclusive</span>
                          <span>
                            {limType === 'unlimited' 
                              ? 'Unlimited Redemptions' 
                              : `Limit: First ${limValue || '50'} customers`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: 600 }}>
                  <Sparkles size={14} color="var(--gold-500)" />
                  <span>CUSTOMER SCRATCH & WIN{scratchPrizesToRender.length > 1 ? 'S' : ''}</span>
                </div>

                {scratchPrizesToRender.map((scratch, idx) => {
                  const currentPrize = scratch.prize.trim() || 'E.g., Free Gift with RM50 Spend';
                  
                  return (
                    <div key={scratch.id || idx} style={{ display: 'flex', flexDirection: 'column' }}>
                      {scratchPrizesToRender.length > 1 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--gold-600)', fontWeight: 700, marginBottom: '0.25rem' }}>
                          SCRATCH CARD #{idx + 1}
                        </div>
                      )}
                      
                      <ScratchCard
                        vendorName={displayVendorName}
                        prize={currentPrize}
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
                          {scratch.limitType === 'unlimited'
                            ? 'Unlimited Prizes'
                            : `Limit: First ${scratch.limitValue || '50'} winners`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

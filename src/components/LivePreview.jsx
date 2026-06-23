import React, { useState } from 'react';
import { Ticket, Sparkles, Eye, ShieldAlert } from 'lucide-react';

export default function LivePreview({
  vendorName = '',
  logoUrl = '',
  joinCoupon = false,
  couponType = 'percentage',
  couponValue = '',
  couponLimitType = 'unlimited',
  couponLimitValue = '',
  joinScratchWin = false,
  scratchWinPrize = ''
}) {
  const [isScratched, setIsScratched] = useState(false);
  const [activeTab, setActiveTab] = useState('coupon');

  const displayVendorName = vendorName.trim() || 'Your Brand Name';
  const displayCouponValue = couponValue ? (couponType === 'percentage' ? `${couponValue}%` : `RM${couponValue}`) : '10%';
  const displayPrize = scratchWinPrize.trim() || 'E.g., Free Gift with RM50 Spend';

  // Determine what to show in tabs
  const hasBoth = joinCoupon && joinScratchWin;
  
  return (
    <div className="preview-panel">
      <div className="preview-panel-header">
        <Eye size={18} />
        <span>Live Customer Preview</span>
      </div>

      {!joinCoupon && !joinScratchWin ? (
        <div style={{
          background: 'var(--white)',
          border: '1.5px dashed var(--slate-300)',
          borderRadius: 'var(--radius-md)',
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          color: 'var(--slate-500)',
          fontSize: '0.95rem'
        }}>
          <Ticket size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5, color: 'var(--rose-500)' }} />
          <p style={{ fontWeight: 600, color: 'var(--slate-800)', marginBottom: '0.25rem' }}>No promotion selected yet</p>
          <p style={{ fontSize: '0.85rem' }}>Select a promotion type in Step 2 to see the customer preview here.</p>
        </div>
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
          {(joinCoupon && (!hasBoth || activeTab === 'coupon')) && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: 600 }}>
                <Ticket size={14} color="var(--rose-500)" />
                <span>CUSTOMER DISCOUNT COUPON</span>
              </div>
              
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
                  <div className="preview-coupon-value">{displayCouponValue} OFF</div>
                  <div className="preview-coupon-label">Special Event Voucher</div>
                </div>

                <div className="preview-coupon-bottom">
                  <span>Wanita Itu Event Exclusive</span>
                  <span>
                    {couponLimitType === 'unlimited' 
                      ? 'Unlimited Redemptions' 
                      : `Limit: First ${couponLimitValue || '50'} customers`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Scratch Card Preview */}
          {(joinScratchWin && (!hasBoth || activeTab === 'scratch')) && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: 600 }}>
                <Sparkles size={14} color="var(--gold-500)" />
                <span>CUSTOMER SCRATCH & WIN</span>
              </div>
              
              <div className="preview-scratch">
                <div className="preview-scratch-top">
                  <span className="preview-scratch-title">{displayVendorName}</span>
                  <Sparkles size={16} />
                </div>

                {/* Simulated Scratch Card */}
                <div className="preview-scratch-area">
                  {isScratched ? (
                    <div className="preview-scratch-area-reveal">
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--rose-500)', fontWeight: 700 }}>You Won!</div>
                      <div style={{ margin: '0.25rem 0', wordBreak: 'break-word' }}>{displayPrize}</div>
                    </div>
                  ) : (
                    <div 
                      className="preview-scratch-overlay-text" 
                      onClick={() => setIsScratched(true)}
                      style={{ cursor: 'pointer', padding: '1rem 0' }}
                      title="Click to scratch!"
                    >
                      👈 Gores Di Sini!
                    </div>
                  )}
                </div>

                <div className="preview-scratch-bottom">
                  <span>Scratch to reveal your deal!</span>
                  {isScratched && (
                    <button 
                      type="button" 
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        cursor: 'pointer'
                      }}
                      onClick={() => setIsScratched(false)}
                    >
                      Reset Card
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

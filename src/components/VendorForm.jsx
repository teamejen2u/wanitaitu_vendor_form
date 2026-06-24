import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Ticket, 
  Sparkles, 
  Trash2, 
  AlertCircle 
} from 'lucide-react';
import { supabase, isSupabaseConfigured, mockDb } from '../supabaseClient';
import LivePreview from './LivePreview';

// Animation variants for step transitions
const stepVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

export default function VendorForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form Fields State
  const [vendorName, setVendorName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('');
  
  const [joinCoupon, setJoinCoupon] = useState(false);
  const [couponType, setCouponType] = useState('percentage'); // 'fixed' or 'percentage'
  const [couponValue, setCouponValue] = useState('');
  const [couponLimitType, setCouponLimitType] = useState('unlimited'); // 'unlimited' or 'limited'
  const [couponLimitValue, setCouponLimitValue] = useState('');

  const [joinScratchWin, setJoinScratchWin] = useState(false);
  const [scratchWinPrize, setScratchWinPrize] = useState('');
  const [scratchWinLimitType, setScratchWinLimitType] = useState('unlimited'); // 'unlimited' or 'limited'
  const [scratchWinLimitValue, setScratchWinLimitValue] = useState('');

  // Drag and drop state
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState({});

  // File drag & drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, JPEG)');
      return;
    }
    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit');
      return;
    }

    setLogoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setLogoPreviewUrl(objectUrl);
    
    // Clear validation error if any
    if (validationErrors.logo) {
      setValidationErrors(prev => ({ ...prev, logo: null }));
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Field validations per step
  const validateStep = (currentStep) => {
    const errors = {};
    if (currentStep === 1) {
      if (!vendorName.trim()) errors.vendorName = 'Vendor Name is required';
      if (!contactName.trim()) errors.contactName = 'Contact Person Name is required';
      if (!contactPhone.trim()) errors.contactPhone = 'WhatsApp / Phone Number is required';
    } else if (currentStep === 2) {
      if (!joinCoupon && !joinScratchWin) {
        errors.promotionSelection = 'Please select at least one promotion type to continue';
      }
    } else if (currentStep === 3) {
      if (joinCoupon) {
        if (!couponValue) {
          errors.couponValue = 'Discount value is required';
        } else if (isNaN(couponValue) || parseFloat(couponValue) <= 0) {
          errors.couponValue = 'Please enter a valid positive number';
        }

        if (couponLimitType === 'limited') {
          if (!couponLimitValue) {
            errors.couponLimitValue = 'Limit amount is required';
          } else if (isNaN(couponLimitValue) || parseInt(couponLimitValue) <= 0) {
            errors.couponLimitValue = 'Please enter a valid positive number';
          }
        }
      }
      if (joinScratchWin) {
        if (!scratchWinPrize.trim()) {
          errors.scratchWinPrize = 'Prize description is required';
        }

        if (scratchWinLimitType === 'limited') {
          if (!scratchWinLimitValue) {
            errors.scratchWinLimitValue = 'Limit amount is required';
          } else if (isNaN(scratchWinLimitValue) || parseInt(scratchWinLimitValue) <= 0) {
            errors.scratchWinLimitValue = 'Please enter a valid positive number';
          }
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setLoading(true);
    setError(null);

    try {
      let finalLogoUrl = '';

      // Upload Logo if provided
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `logos/${fileName}`;

        if (isSupabaseConfigured) {
          // Upload to Supabase Storage
          const { error: uploadErr } = await supabase.storage
            .from('vendor-logos')
            .upload(filePath, logoFile, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadErr) {
            console.error('Logo upload error:', uploadErr);
            throw new Error(`Failed to upload logo: ${uploadErr.message}`);
          }

          // Get Public URL
          const { data: urlData } = supabase.storage
            .from('vendor-logos')
            .getPublicUrl(filePath);

          finalLogoUrl = urlData.publicUrl;
        } else {
          // Upload using Mock DB Fallback
          const mockUpload = await mockDb.uploadLogo(logoFile);
          if (mockUpload.error) throw mockUpload.error;
          finalLogoUrl = mockUpload.publicUrl;
        }
      }

      // Prepare submission payload
      const payload = {
        vendor_name: vendorName,
        contact_name: contactName,
        contact_phone: contactPhone,
        logo_url: finalLogoUrl,
        join_coupon: joinCoupon,
        coupon_type: joinCoupon ? couponType : null,
        coupon_value: joinCoupon ? parseFloat(couponValue) : null,
        coupon_limit_type: joinCoupon ? couponLimitType : null,
        coupon_limit_value: (joinCoupon && couponLimitType === 'limited') ? parseInt(couponLimitValue) : null,
        join_scratch_win: joinScratchWin,
        scratch_win_prize: joinScratchWin ? scratchWinPrize : null,
        scratch_win_limit_type: joinScratchWin ? scratchWinLimitType : null,
        scratch_win_limit_value: (joinScratchWin && scratchWinLimitType === 'limited') ? parseInt(scratchWinLimitValue) : null
      };

      // Save payload
      let result;
      if (isSupabaseConfigured) {
        result = await supabase.from('vendor_submissions').insert([payload]);
      } else {
        result = await mockDb.insertSubmission(payload);
      }

      if (result.error) {
        throw result.error;
      }

      // Success
      setStep(4);
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message || 'An unexpected error occurred during submission. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Visual Stepper */}
      {step < 4 && (
        <div className="stepper-container">
          <div className={`step-item ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="step-badge">{step > 1 ? <Check size={16} /> : '1'}</div>
            <span className="step-label">Vendor Profile</span>
          </div>
          <div className="step-line completed"></div>
          
          <div className={`step-item ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="step-badge">{step > 2 ? <Check size={16} /> : '2'}</div>
            <span className="step-label">Promotion Type</span>
          </div>
          <div className="step-line completed"></div>

          <div className={`step-item ${step === 3 ? 'active' : ''}`}>
            <div className="step-badge">3</div>
            <span className="step-label">Configure Details</span>
          </div>
        </div>
      )}

      {/* Main Grid: Form controls + Live Preview */}
      {step < 4 ? (
        <div className="form-layout-grid">
          {/* Form Side */}
          <div className="form-panel">
             <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
              {/* STEP 1: VENDOR PROFILE */}
              {step === 1 && (
                <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                  <h2 className="panel-title">Tell us about your brand</h2>
                  <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Let's start with your vendor details. This information will display to customers on the event page.
                  </p>

                  <div className="form-group">
                    <label className="form-label" htmlFor="vendorName">Vendor / Brand Name *</label>
                    <input 
                      type="text"
                      id="vendorName"
                      className="form-input"
                      placeholder="E.g., Blossom Bakery"
                      value={vendorName}
                      onChange={(e) => {
                        setVendorName(e.target.value);
                        if (validationErrors.vendorName) {
                          setValidationErrors(prev => ({ ...prev, vendorName: null }));
                        }
                      }}
                    />
                    {validationErrors.vendorName && <div className="auth-error"><AlertCircle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />{validationErrors.vendorName}</div>}
                  </div>

                  <div className="form-row-2col">
                    <div className="form-group">
                      <label className="form-label" htmlFor="contactName">Contact Person Name *</label>
                      <input 
                        type="text"
                        id="contactName"
                        className="form-input"
                        placeholder="E.g., Sarah Ahmad"
                        value={contactName}
                        onChange={(e) => {
                          setContactName(e.target.value);
                          if (validationErrors.contactName) {
                            setValidationErrors(prev => ({ ...prev, contactName: null }));
                          }
                        }}
                      />
                      {validationErrors.contactName && <div className="auth-error"><AlertCircle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />{validationErrors.contactName}</div>}
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="contactPhone">WhatsApp / Phone Number *</label>
                      <input 
                        type="tel"
                        id="contactPhone"
                        className="form-input"
                        placeholder="E.g., +60123456789"
                        value={contactPhone}
                        onChange={(e) => {
                          setContactPhone(e.target.value);
                          if (validationErrors.contactPhone) {
                            setValidationErrors(prev => ({ ...prev, contactPhone: null }));
                          }
                        }}
                      />
                      {validationErrors.contactPhone && <div className="auth-error"><AlertCircle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />{validationErrors.contactPhone}</div>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Brand Logo (Recommended)</label>
                    <div 
                      className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current.click()}
                    >
                      <input 
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleFileInputChange}
                      />
                      <Upload className="upload-icon" size={28} style={{ margin: '0 auto 0.75rem auto' }} />
                      <div className="upload-text">Click to upload or drag and drop</div>
                      <div className="upload-subtext">Supports PNG, JPG, JPEG (Max 5MB)</div>
                    </div>

                    {logoPreviewUrl && (
                      <div className="upload-preview-container">
                        <img src={logoPreviewUrl} alt="Logo preview" className="upload-preview-img" />
                        <div className="upload-preview-info">
                          <div className="upload-preview-name">{logoFile?.name}</div>
                          <div className="upload-preview-size">{(logoFile?.size / 1024).toFixed(1)} KB</div>
                        </div>
                        <button type="button" className="upload-remove-btn" onClick={removeLogo} title="Remove logo">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 2: CHOOSE PROMOTION TYPE */}
              {step === 2 && (
                <motion.div key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                  <h2 className="panel-title">Choose Promotion Types</h2>
                  <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Select how you want customers to interact with your brand. You can participate in one or both!
                  </p>

                  <div className="promotion-cards-grid">
                    {/* Discount Coupon Card */}
                    <div 
                      className={`promotion-card ${joinCoupon ? 'selected' : ''}`}
                      onClick={() => {
                        setJoinCoupon(!joinCoupon);
                        if (validationErrors.promotionSelection) {
                          setValidationErrors(prev => ({ ...prev, promotionSelection: null }));
                        }
                      }}
                    >
                      <div className="promotion-card-check">
                        {joinCoupon && <Check size={14} />}
                      </div>
                      <div className="promotion-card-icon">
                        <Ticket size={24} />
                      </div>
                      <div className="promotion-card-content">
                        <h3>Discount Coupons</h3>
                        <p>Give customers a discount (fixed price or percentage) that they can redeem at your booth.</p>
                      </div>
                    </div>

                    {/* Scratch Card */}
                    <div 
                      className={`promotion-card ${joinScratchWin ? 'selected' : ''}`}
                      onClick={() => {
                        setJoinScratchWin(!joinScratchWin);
                        if (validationErrors.promotionSelection) {
                          setValidationErrors(prev => ({ ...prev, promotionSelection: null }));
                        }
                      }}
                    >
                      <div className="promotion-card-check">
                        {joinScratchWin && <Check size={14} />}
                      </div>
                      <div className="promotion-card-icon">
                        <Sparkles size={24} />
                      </div>
                      <div className="promotion-card-content">
                        <h3>Gores & Menang (Scratch & Win)</h3>
                        <p>A fun digital scratch card! You specify the prize (e.g. Free gift, Buy 1 Free 1) that lucky scratchers can win.</p>
                      </div>
                    </div>
                  </div>

                  {validationErrors.promotionSelection && (
                    <div className="auth-error" style={{ marginBottom: '1.5rem' }}>
                      <AlertCircle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      {validationErrors.promotionSelection}
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 3: CONFIGURE PROMOTION DETAILS */}
              {step === 3 && (
                <motion.div key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                  <h2 className="panel-title">Configure your offers</h2>
                  <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Enter the specific discount amounts or scratch prizes for your selected promotions.
                  </p>

                  {/* Coupon Settings */}
                  {joinCoupon && (
                    <div style={{ marginBottom: '2.5rem', padding: '1rem', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <Ticket size={18} color="var(--rose-500)" />
                        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Discount Coupon Settings</h3>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Discount Value Type</label>
                        <div className="options-button-group">
                          <button 
                            type="button"
                            className={`option-btn ${couponType === 'percentage' ? 'active' : ''}`}
                            onClick={() => setCouponType('percentage')}
                          >
                            Percentage (%)
                          </button>
                          <button 
                            type="button"
                            className={`option-btn ${couponType === 'fixed' ? 'active' : ''}`}
                            onClick={() => setCouponType('fixed')}
                          >
                            Fixed Amount (RM)
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="couponValue">
                          {couponType === 'percentage' ? 'Discount Percentage (%) *' : 'Discount Amount (RM) *'}
                        </label>
                        <input 
                          type="number"
                          id="couponValue"
                          className="form-input"
                          placeholder={couponType === 'percentage' ? 'E.g., 10' : 'E.g., 5'}
                          value={couponValue}
                          onChange={(e) => {
                            setCouponValue(e.target.value);
                            if (validationErrors.couponValue) {
                              setValidationErrors(prev => ({ ...prev, couponValue: null }));
                            }
                          }}
                        />
                        {validationErrors.couponValue && <div className="auth-error"><AlertCircle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />{validationErrors.couponValue}</div>}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Redemption Limit</label>
                        <div className="options-button-group">
                          <button 
                            type="button"
                            className={`option-btn ${couponLimitType === 'unlimited' ? 'active' : ''}`}
                            onClick={() => setCouponLimitType('unlimited')}
                          >
                            Unlimited Customers
                          </button>
                          <button 
                            type="button"
                            className={`option-btn ${couponLimitType === 'limited' ? 'active' : ''}`}
                            onClick={() => setCouponLimitType('limited')}
                          >
                            Set Limit
                          </button>
                        </div>
                      </div>

                      {couponLimitType === 'limited' && (
                        <div className="form-group">
                          <label className="form-label" htmlFor="couponLimitValue">Maximum Redeeming Customers *</label>
                          <input 
                            type="number"
                            id="couponLimitValue"
                            className="form-input"
                            placeholder="E.g., 100"
                            value={couponLimitValue}
                            onChange={(e) => {
                              setCouponLimitValue(e.target.value);
                              if (validationErrors.couponLimitValue) {
                                setValidationErrors(prev => ({ ...prev, couponLimitValue: null }));
                              }
                            }}
                          />
                          {validationErrors.couponLimitValue && <div className="auth-error"><AlertCircle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />{validationErrors.couponLimitValue}</div>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Scratch & Win Settings */}
                  {joinScratchWin && (
                    <div style={{ padding: '1rem', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <Sparkles size={18} color="var(--gold-500)" />
                        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Gores & Menang Prize</h3>
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="scratchWinPrize">What prize/reward will winning customers receive? *</label>
                        <textarea 
                          id="scratchWinPrize"
                          className="form-input"
                          rows="3"
                          placeholder="E.g., Free sample of our Signature cookies with no minimum spend! or Buy 1 Free 1 on all cosmetics."
                          style={{ resize: 'vertical' }}
                          value={scratchWinPrize}
                          onChange={(e) => {
                            setScratchWinPrize(e.target.value);
                            if (validationErrors.scratchWinPrize) {
                              setValidationErrors(prev => ({ ...prev, scratchWinPrize: null }));
                            }
                          }}
                        />
                        {validationErrors.scratchWinPrize && <div className="auth-error"><AlertCircle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />{validationErrors.scratchWinPrize}</div>}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Prize Limit</label>
                        <div className="options-button-group">
                          <button 
                            type="button"
                            className={`option-btn ${scratchWinLimitType === 'unlimited' ? 'active' : ''}`}
                            onClick={() => setScratchWinLimitType('unlimited')}
                          >
                            Unlimited Winners
                          </button>
                          <button 
                            type="button"
                            className={`option-btn ${scratchWinLimitType === 'limited' ? 'active' : ''}`}
                            onClick={() => setScratchWinLimitType('limited')}
                          >
                            Set Limit
                          </button>
                        </div>
                      </div>

                      {scratchWinLimitType === 'limited' && (
                        <div className="form-group">
                          <label className="form-label" htmlFor="scratchWinLimitValue">Maximum Number of Winners *</label>
                          <input 
                            type="number"
                            id="scratchWinLimitValue"
                            className="form-input"
                            placeholder="E.g., 50"
                            value={scratchWinLimitValue}
                            onChange={(e) => {
                              setScratchWinLimitValue(e.target.value);
                              if (validationErrors.scratchWinLimitValue) {
                                setValidationErrors(prev => ({ ...prev, scratchWinLimitValue: null }));
                              }
                            }}
                          />
                          {validationErrors.scratchWinLimitValue && <div className="auth-error"><AlertCircle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />{validationErrors.scratchWinLimitValue}</div>}
                        </div>
                      )}
                    </div>
                  )}

                  {error && (
                    <div className="auth-error" style={{ fontSize: '0.95rem', padding: '0.75rem', backgroundColor: 'var(--rose-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--rose-200)', marginTop: '1.5rem' }}>
                      <AlertCircle size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                      {error}
                    </div>
                  )}
                </motion.div>
              )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="nav-buttons-container">
                {step > 1 && (
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={prevStep}
                    disabled={loading}
                  >
                    <ArrowLeft size={18} />
                    <span>Back</span>
                  </button>
                )}
                
                {step < 3 ? (
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={nextStep}
                  >
                    <span>Next Step</span>
                    <ArrowRight size={18} />
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    <span>{loading ? 'Submitting...' : 'Submit Application'}</span>
                    {!loading && <Check size={18} />}
                  </button>
                )}
              </div>

            </form>
          </div>

          {/* Live Preview Side */}
          <LivePreview 
            vendorName={vendorName}
            logoUrl={logoPreviewUrl}
            joinCoupon={joinCoupon}
            couponType={couponType}
            couponValue={couponValue}
            couponLimitType={couponLimitType}
            couponLimitValue={couponLimitValue}
            joinScratchWin={joinScratchWin}
            scratchWinPrize={scratchWinPrize}
            scratchWinLimitType={scratchWinLimitType}
            scratchWinLimitValue={scratchWinLimitValue}
          />
        </div>
      ) : (
        /* STEP 4: SUCCESS CONFIRMATION SCREEN */
        <motion.div 
          className="form-panel success-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <h2 className="success-title">We've received your details!</h2>
          <p className="success-subtitle">
            Thank you for participating in the Wanita Itu event. Our team will now configure your promotional offers and showcase them to customers on the event app.
          </p>

          <div className="success-summary">
            <h4>Submission Summary</h4>
            <div className="success-summary-item">
              <span className="success-summary-label">Brand Name:</span>
              <span className="success-summary-value">{vendorName}</span>
            </div>
            <div className="success-summary-item">
              <span className="success-summary-label">Contact Person:</span>
              <span className="success-summary-value">{contactName}</span>
            </div>
            {joinCoupon && (
              <div className="success-summary-item">
                <span className="success-summary-label">Discount Coupon:</span>
                <span className="success-summary-value">
                  {couponType === 'percentage' ? `${couponValue}%` : `RM${couponValue}`} OFF ({couponLimitType === 'unlimited' ? 'Unlimited' : `Limit ${couponLimitValue}`})
                </span>
              </div>
            )}
            {joinScratchWin && (
              <div className="success-summary-item">
                <span className="success-summary-label">Gores & Menang Prize:</span>
                <span className="success-summary-value" style={{ maxWidth: '200px', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {scratchWinPrize}
                </span>
              </div>
            )}
            {joinScratchWin && (
              <div className="success-summary-item">
                <span className="success-summary-label">Prize Limit:</span>
                <span className="success-summary-value">
                  {scratchWinLimitType === 'unlimited' ? 'Unlimited Winners' : `First ${scratchWinLimitValue} winners`}
                </span>
              </div>
            )}
          </div>

          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => {
              // Reset form states to submit another
              setStep(1);
              setVendorName('');
              setContactName('');
              setContactPhone('');
              setLogoFile(null);
              setLogoPreviewUrl('');
              setJoinCoupon(false);
              setCouponValue('');
              setCouponLimitValue('');
              setJoinScratchWin(false);
              setScratchWinPrize('');
              setScratchWinLimitType('unlimited');
              setScratchWinLimitValue('');
            }}
          >
            Submit Another Vendor Form
          </button>
        </motion.div>
      )}
    </div>
  );
}

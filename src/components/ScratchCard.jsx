import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RotateCcw } from 'lucide-react';

const SCRATCH_THRESHOLD = 0.25; // 25% scratched to auto-reveal

export default function ScratchCard({ 
  vendorName = 'Your Brand', 
  prize = 'Free Gift!',
  prizeImageUrl = '',
  width = 280,
  height: heightProp = 160,
  onReveal
}) {
  const height = prizeImageUrl ? Math.max(heightProp, 200) : heightProp;
  const canvasRef = useRef(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const isDrawing = useRef(false);
  const lastPoint = useRef(null);

  // Initialize the canvas with a scratch-off overlay
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Scale for high-DPI displays. After this, all draw coords use CSS pixels.
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset any prior transform
    ctx.scale(dpr, dpr);

    // Make sure we paint the overlay (not erase it)
    ctx.globalCompositeOperation = 'source-over';

    // Draw the scratch-off overlay (golden metallic gradient)
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#c9a94e');
    gradient.addColorStop(0.3, '#e8d48b');
    gradient.addColorStop(0.5, '#f5e6a3');
    gradient.addColorStop(0.7, '#e8d48b');
    gradient.addColorStop(1, '#b8952f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle texture lines
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < width + height; i += 6) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(0, i);
      ctx.stroke();
    }

    // Add text instruction
    ctx.fillStyle = 'rgba(120, 80, 20, 0.6)';
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Gores Di Sini!', width / 2, height / 2 - 10);

    // Finger / touch icon hint
    ctx.font = '24px system-ui';
    ctx.fillText('👆', width / 2, height / 2 + 18);
  }, [width, height]);

  useEffect(() => {
    if (!isRevealed) {
      initCanvas();
    }
  }, [initCanvas, isRevealed, prize]);

  // Calculate scratched fraction (0..1) by sampling the alpha channel
  const calcScratchFraction = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparent = 0;
    let total = 0;
    // Sample every 16th pixel (stride of 64 bytes) for performance
    for (let i = 3; i < pixels.length; i += 64) {
      total++;
      if (pixels[i] === 0) transparent++;
    }
    return total ? transparent / total : 0;
  }, []);

  // Scratch at a point (coords are in CSS pixels; the ctx transform handles DPR)
  const scratch = useCallback((x, y) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;
    const ctx = canvas.getContext('2d');

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 50;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (lastPoint.current) {
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, 25, 0, Math.PI * 2);
      ctx.fill();
    }

    lastPoint.current = { x, y };
  }, [isRevealed]);

  // Get coordinates relative to canvas (CSS pixels)
  const getCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const maybeReveal = () => {
    if (calcScratchFraction() >= SCRATCH_THRESHOLD) {
      setIsRevealed(true);
      onReveal?.();
    }
  };

  const handleStart = (e) => {
    if (isRevealed) return;
    e.preventDefault();
    isDrawing.current = true;
    lastPoint.current = null;
    const { x, y } = getCoords(e);
    scratch(x, y);
  };

  const handleMove = (e) => {
    if (!isDrawing.current || isRevealed) return;
    e.preventDefault();
    const { x, y } = getCoords(e);
    scratch(x, y);
    maybeReveal();
  };

  const handleEnd = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    lastPoint.current = null;
    maybeReveal();
  };

  const handleReset = () => {
    setIsRevealed(false);
    lastPoint.current = null;
  };

  return (
    <div className="scratch-card-wrapper" style={{ width, maxWidth: '100%' }}>
      {/* Card container */}
      <div 
        className="scratch-card-container"
        style={{ width, height, maxWidth: '100%', position: 'relative', overflow: 'hidden', borderRadius: '8px' }}
      >
        {/* Prize layer (underneath) */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #fff7ed, #fef3c7)',
            padding: '1rem',
            textAlign: 'center',
            zIndex: 1
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
            {prizeImageUrl && (
              <img 
                src={prizeImageUrl} 
                alt="Prize" 
                style={{ 
                  maxHeight: '60px', 
                  maxWidth: '80%', 
                  objectFit: 'contain', 
                  borderRadius: '6px',
                  marginBottom: '0.15rem'
                }} 
              />
            )}
            {!prizeImageUrl && (
              <div style={{ rotate: 0 }}>
                <Sparkles size={28} color="#e11d48" />
              </div>
            )}
            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#e11d48', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tahniah! You Won!
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', wordBreak: 'break-word', lineHeight: 1.3, maxWidth: '90%' }}>
              {prize}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>
              from {vendorName}
            </div>
          </div>
        </div>

        {/* Canvas scratch layer (on top) */}
        {!isRevealed && (
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 2,
              cursor: 'grab',
              touchAction: 'none'
            }}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          />
        )}

        {/* Confetti particles on reveal */}
        <AnimatePresence>
          {isRevealed && (
            <>
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: width / 2, 
                    y: height / 2, 
                    scale: 1, 
                    opacity: 1 
                  }}
                  animate={{ 
                    x: width / 2 + (Math.random() - 0.5) * width * 1.2,
                    y: height / 2 + (Math.random() - 0.5) * height * 1.5,
                    scale: 0,
                    opacity: 0
                  }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    width: '6px',
                    height: '6px',
                    borderRadius: i % 2 === 0 ? '50%' : '1px',
                    background: ['#e11d48', '#f59e0b', '#8b5cf6', '#10b981', '#3b82f6', '#ec4899'][i % 6],
                    zIndex: 3,
                    pointerEvents: 'none'
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Hint / Reset bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: '0.5rem',
        fontSize: '0.7rem',
        color: '#64748b'
      }}>
        {isRevealed ? (
          <button 
            type="button"
            onClick={handleReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '0.7rem',
              color: '#64748b',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={10} />
            Reset Card
          </button>
        ) : (
          <span>Scratch the gold area above!</span>
        )}
        <span style={{ fontWeight: 600, color: '#e11d48', fontSize: '0.65rem' }}>PREVIEW</span>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';

export default function FeatureTooltip({ title, description, children, initiallyOpen = false, featureKey }) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(`acad_ft_${featureKey}`) === '1';
    } catch {
      return false;
    }
  });
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const popupRef = useRef(null);

  const storageKey = `acad_ft_${featureKey}`;

  const dismiss = useCallback(() => {
    setVisible(false);
    setDismissed(true);
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  useEffect(() => {
    if (!initiallyOpen || dismissed) return;
    const id = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(id);
  }, [initiallyOpen, dismissed]);

  useEffect(() => {
    if (!visible || !triggerRef.current) return;
    const updatePos = () => {
      const tr = triggerRef.current.getBoundingClientRect();
      const pw = popupRef.current?.offsetWidth || 280;
      setPos({
        top: tr.bottom + window.scrollY + 8,
        left: tr.left + window.scrollX + tr.width / 2 - pw / 2,
      });
    };
    updatePos();
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos);
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos);
    };
  }, [visible]);

  if (!featureKey) {
    console.warn('FeatureTooltip requires a featureKey prop for localStorage persistence.');
  }

  return (
    <>
      <span ref={triggerRef} className="ft-trigger" style={{ display: 'inline-flex' }}>
        {children}
      </span>
      {visible && !dismissed && (
        <div
          ref={popupRef}
          className="ft-popup"
          style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 8500 }}
          role="tooltip"
        >
          <div className="ft-popup-arrow" aria-hidden="true" />
          <div className="ft-popup-card">
            <div className="ft-popup-head">
              <span className="ft-popup-title">{title}</span>
              <button
                type="button"
                className="ft-popup-close"
                onClick={dismiss}
                aria-label="Dismiss tip"
              >
                &times;
              </button>
            </div>
            <p className="ft-popup-desc">{description}</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={dismiss}>
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

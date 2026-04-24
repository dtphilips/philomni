import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';

const LightboxContext = createContext();

export function LightboxProvider({ children }) {
  const [state, setState] = useState({ open: false, src: '', alt: '' });

  const openLightbox = useCallback((src, alt = '') => {
    setState({ open: true, src, alt });
  }, []);

  const closeLightbox = useCallback(() => {
    setState(s => ({ ...s, open: false }));
  }, []);

  // Escape key to close
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeLightbox(); };
    if (state.open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.open, closeLightbox]);

  return (
    <LightboxContext.Provider value={{ openLightbox }}>
      {children}
      {createPortal(
        <AnimatePresence>
          {state.open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
              style={{ background: 'rgba(0,0,0,0.95)' }}
              onClick={closeLightbox}
            >
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                src={state.src}
                alt={state.alt}
                className="max-w-full max-h-full object-contain rounded-lg"
                style={{ maxWidth: 'min(90vw, 1200px)', maxHeight: '90vh' }}
                onClick={e => e.stopPropagation()}
              />
              {/* Close button */}
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
              >
                <X className="w-5 h-5" />
              </button>
              {/* Download button */}
              <a
                href={state.src}
                download
                target="_blank"
                rel="noreferrer"
                onClick={e => e.stopPropagation()}
                className="absolute top-4 right-16 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
              >
                <Download className="w-4 h-4" />
              </a>
              {/* Caption */}
              {state.alt && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-sm text-white"
                     style={{ background: 'rgba(0,0,0,0.6)' }}>
                  {state.alt}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </LightboxContext.Provider>
  );
}

export function useLightbox() {
  const ctx = useContext(LightboxContext);
  if (!ctx) return { openLightbox: () => {} };
  return ctx;
}

/**
 * Default export — renders nothing on its own.
 * The real UI is managed by LightboxProvider.
 * Wrap your app with <LightboxProvider>, then call useLightbox() anywhere inside it.
 *
 * Example:
 *   const { openLightbox } = useLightbox();
 *   <img onClick={() => openLightbox(src, 'Caption')} className="cursor-zoom-in" />
 */
export default function Lightbox() {
  return null;
}

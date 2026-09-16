import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  headerRight?: React.ReactNode;
  headerCustom?: React.ReactNode;
  hideHeader?: boolean;
  hideCloseButton?: boolean;
  maxWidth?: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  ariaLabel?: string;
  preventScrollLock?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  iconBgColor,
  iconColor,
  headerRight,
  headerCustom,
  hideHeader = false,
  hideCloseButton = false,
  maxWidth = 'max-w-lg',
  children,
  className = '',
  bodyClassName = '',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  preventScrollLock = false,
}) => {
  // Prevent background document scrolling while modal is mounted
  useEffect(() => {
    if (!isOpen || preventScrollLock) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, preventScrollLock]);

  // Pressing Escape dismisses the modal
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={closeOnBackdropClick ? onClose : undefined}
          className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 selection:bg-emerald-500/20 animate-fade-in"
        >
          <motion.div
            key="modal-card"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full ${maxWidth} bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-750 flex flex-col overflow-visible ${className}`}
          >
            {/* Signature Floating Mac-Style Close Button */}
            {!hideCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="absolute -top-3 -right-3 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-slate-750 shadow-md flex items-center justify-center transition active:scale-90 hover:scale-105 z-30 cursor-pointer"
                title="Close"
                aria-label="Close"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}

            {/* Modal Header */}
            {!hideHeader && (
              headerCustom ? (
                headerCustom
              ) : (
                <div className="p-5 pb-0 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {icon && (
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60"
                        style={{
                          backgroundColor: iconBgColor,
                          color: iconColor,
                        }}
                      >
                        {icon}
                      </div>
                    )}
                    <div className="min-w-0">
                      {typeof title === 'string' ? (
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate font-sans">
                          {title}
                        </h2>
                      ) : (
                        title
                      )}
                      {subtitle && (
                        <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                          {subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  {headerRight && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {headerRight}
                    </div>
                  )}
                </div>
              )
            )}

            {/* Modal Content Body */}
            <div className={`p-5 sm:p-6 ${bodyClassName}`}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

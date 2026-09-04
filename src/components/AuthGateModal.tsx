import React, { useState, useEffect, useRef } from 'react';
import { Zap, KeyRound, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { validatePasskey, setActiveSessionUserId, type Tester } from '../config/testers';

interface AuthGateModalProps {
  isOpen: boolean;
  onSuccess: (tester: Tester) => void;
}

export const AuthGateModal: React.FC<AuthGateModalProps> = ({ isOpen, onSuccess }) => {
  const [passkeyInput, setPasskeyInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset form state whenever gate modal becomes visible
  useEffect(() => {
    if (isOpen) {
      setIsUnlocking(false);
      setPasskeyInput('');
      setErrorMsg(null);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isUnlocking) return;

    if (!passkeyInput.trim()) {
      setErrorMsg('Please enter your beta passkey.');
      triggerShake();
      return;
    }

    const validatedTester = validatePasskey(passkeyInput);

    if (validatedTester) {
      setErrorMsg(null);
      setIsUnlocking(true);
      setActiveSessionUserId(validatedTester.id);

      // Energetic unlock feedback
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#10b981', '#06b6d4', '#6366f1', '#f59e0b'],
        });
      } catch {
        // Safe fallback
      }

      setTimeout(() => {
        setIsUnlocking(false);
        setPasskeyInput('');
        onSuccess(validatedTester);
      }, 400);
    } else {
      setErrorMsg('Unrecognized passkey. Contact admin.');
      triggerShake();
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
    inputRef.current?.select();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090d16]/95 backdrop-blur-xl animate-fade-in select-none">
      {/* Ambient background glow */}
      <div className="absolute w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none -top-20 -right-20 animate-pulse" />
      <div className="absolute w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none -bottom-20 -left-20 animate-pulse" />

      <div
        className={`w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-750 shadow-2xl p-5 sm:p-8 relative overflow-hidden max-h-[92vh] overflow-y-auto transition-all duration-300 ${
          isUnlocking ? 'scale-105 opacity-90' : 'scale-100 opacity-100'
        }`}
      >
        {/* Top Accent Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500" />

        {/* Brand Icon Header */}
        <div className="flex flex-col items-center text-center mb-5 sm:mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 mb-3.5 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 dark:bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400">
              <Zap className="w-7 h-7 fill-emerald-400" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold font-mono uppercase tracking-wider mb-1.5">
            <ShieldCheck className="w-3 h-3" /> Closed Beta Access Gate
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            Flux // Beta Access
          </h1>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic font-sans">
            Enter your assigned beta passkey
          </p>
        </div>

        {/* Passkey Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <KeyRound className="w-4 h-4" />
              </div>

              <input
                ref={inputRef}
                type="text"
                autoFocus
                autoComplete="off"
                spellCheck="false"
                value={passkeyInput}
                onChange={(e) => {
                  setPasskeyInput(e.target.value.toUpperCase());
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="e.g. FLUX_DEVENDRA"
                className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border text-sm text-slate-900 dark:text-white font-mono tracking-wider placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-sans placeholder:tracking-normal focus:outline-none focus:ring-2 transition-all ${
                  errorMsg
                    ? 'border-rose-500/80 focus:ring-rose-500 bg-rose-50/10 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/40'
                } ${isShaking ? 'animate-shake' : ''}`}
              />
            </div>

            {/* Error Message Toast */}
            {errorMsg && (
              <div className="flex items-center gap-1.5 mt-2 px-1 text-xs text-rose-600 dark:text-rose-400 font-medium animate-fade-in font-sans">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Action Submit Button */}
          <button
            type="submit"
            disabled={isUnlocking}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 hover:from-emerald-400 hover:to-indigo-400 text-slate-950 font-bold text-sm font-mono tracking-wide shadow-lg shadow-cyan-500/20 transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-75"
          >
            <span>Unlock Quest 🚀</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        {/* Security / System Footer Note */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
            Personal profiles & history are isolated per tester key.
          </p>
        </div>
      </div>
    </div>
  );
};

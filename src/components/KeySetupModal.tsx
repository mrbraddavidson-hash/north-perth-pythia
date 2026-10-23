import React, { useState } from 'react';
import { Key, X, ExternalLink, Check, ShieldCheck, AlertCircle } from 'lucide-react';

interface KeySetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveKey: (key: string) => void;
  currentKey: string;
}

export const KeySetupModal: React.FC<KeySetupModalProps> = ({
  isOpen,
  onClose,
  onSaveKey,
  currentKey,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(currentKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveKey(apiKeyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    setApiKeyInput('');
    onSaveKey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 font-mono">
      <div className="relative w-full max-w-lg rounded-lg bg-slate-950 border border-cyan-500/40 p-6 shadow-[0_0_35px_rgba(0,242,254,0.15)] text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4 border-b border-cyan-500/20 pb-3">
          <div className="flex items-center justify-center w-10 h-10 rounded bg-cyan-950/80 border border-cyan-400/50 text-cyan-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-tactical text-base font-bold text-white tracking-wide">
              ONTARIO 511 // LIVE CCTV KEY
            </h2>
            <p className="text-[11px] text-slate-400">
              Direct connection to Ministry of Transportation (MTO) feeds
            </p>
          </div>
        </div>

        {/* Explanatory Steps */}
        <div className="space-y-3 text-xs text-slate-300 mb-5 bg-slate-900/60 p-3.5 rounded border border-slate-800">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-bold text-[10px]">
              1
            </span>
            <p>
              Ontario 511 requires a free registered developer account to prevent automated DDoS on
              provincial cameras.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-bold text-[10px]">
              2
            </span>
            <p>
              Open{' '}
              <a
                href="https://511on.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 underline hover:text-cyan-300 font-semibold inline-flex items-center gap-1"
              >
                511on.ca <ExternalLink className="w-3 h-3" />
              </a>{' '}
              and sign up for a free account (takes 30 seconds).
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-bold text-[10px]">
              3
            </span>
            <p>
              Go to your profile, copy your <strong>Developer API Key</strong>, and paste it below:
            </p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-cyan-300 mb-1.5 uppercase tracking-wider">
              Ontario 511 API Key:
            </label>
            <input
              type="text"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="e.g. 4a9f8b1c-723e-4b21-8fa0-..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {currentKey && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs border border-rose-500/40 transition-colors"
              >
                Clear Key
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-[0_0_12px_#00f2fe] transition-all"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    CONNECTED!
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    SAVE & ACTIVATE
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

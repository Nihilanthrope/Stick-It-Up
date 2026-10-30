import React, { useState } from 'react';
import { 
  X, 
  Layers2, 
  ShieldCheck, 
  ShieldAlert, 
  AlertCircle, 
  ExternalLink, 
  Minimize2, 
  Maximize2, 
  Eye, 
  EyeOff,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';
import { Note } from '../lib/notes/types';
import { OverlayState } from '../lib/overlay/types';
import { getPlatformCapabilities } from '../lib/platform/capabilities';
import { OverlayController } from '../lib/overlay/controller';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  overlayState: OverlayState;
  overlayController: OverlayController;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  notes,
  overlayState,
  overlayController,
}) => {
  const capabilities = getPlatformCapabilities();
  const [selectedNoteId, setSelectedNoteId] = useState<string>(
    overlayState.noteId || (notes[0]?.id || '')
  );
  const [requestingPerm, setRequestingPerm] = useState(false);

  if (!isOpen) return null;

  const handleToggleOverlay = async () => {
    if (overlayState.visible) {
      await overlayController.hide();
    } else {
      await overlayController.show(selectedNoteId);
    }
  };

  const handleRequestPermission = async () => {
    setRequestingPerm(true);
    try {
      await overlayController.requestPermission();
    } finally {
      setRequestingPerm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-cream-50 rounded-xl shadow-2xl border border-cream-300 overflow-hidden text-stone-800 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 bg-cream-100/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-crimson-600" />
            <h2 className="text-base font-bold text-stone-900">Settings & Native Overlay</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-cream-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Overlay Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-1.5">
                  <Layers2 className="w-4 h-4 text-crimson-600" />
                  Floating Sticky Note Overlay
                </h3>
                <p className="text-xs text-stone-500">
                  Keep a live editable sticky note always above other windows.
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-1.5">
                {capabilities.supportsNativeOverlay ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Supported ({capabilities.platform})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    Web Preview (Unsupported)
                  </span>
                )}
              </div>
            </div>

            {/* Platform Explanation Notice */}
            {!capabilities.supportsNativeOverlay && (
              <div className="p-3.5 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Browser Preview Notice</span>
                </div>
                <p className="leading-relaxed">
                  {capabilities.explanation}
                </p>
                <p className="text-[11px] text-amber-700/90 pt-1">
                  Run via <code>cargo tauri dev</code> on desktop Linux or build for Android to activate real OS-level window layering.
                </p>
              </div>
            )}

            {/* Android Permission Section if required */}
            {capabilities.requiresSystemAlertWindow && (
              <div className="p-3.5 rounded-lg bg-cream-100 border border-cream-300 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    {overlayState.permission === 'granted' ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-crimson-600" />
                    )}
                    <span>Android "Display over other apps" Permission:</span>
                  </div>
                  <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                    overlayState.permission === 'granted'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-crimson-100 text-crimson-700'
                  }`}>
                    {overlayState.permission}
                  </span>
                </div>
                {overlayState.permission !== 'granted' && (
                  <button
                    onClick={handleRequestPermission}
                    disabled={requestingPerm}
                    className="w-full mt-1 px-3 py-1.5 bg-crimson-600 hover:bg-crimson-700 text-white rounded text-xs font-semibold shadow-xs transition"
                  >
                    {requestingPerm ? 'Opening Android Settings...' : 'Grant Overlay Permission'}
                  </button>
                )}
              </div>
            )}

            {/* Note Selector & Controls */}
            <div className="bg-cream-100/70 p-4 rounded-lg border border-cream-200 space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Select Note to Float:
                </label>
                <select
                  value={selectedNoteId}
                  onChange={(e) => setSelectedNoteId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-cream-300 rounded-md focus:outline-none focus:ring-1 focus:ring-crimson-600"
                >
                  {notes.filter(n => !n.isArchived).map((note) => (
                    <option key={note.id} value={note.id}>
                      {note.title || 'Untitled Note'} ({note.color}) {note.isPinned ? '📌' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Overlay Command Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleToggleOverlay}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg shadow-xs transition ${
                    overlayState.visible
                      ? 'bg-stone-800 text-cream-50 hover:bg-stone-900'
                      : 'bg-crimson-600 text-cream-50 hover:bg-crimson-700'
                  }`}
                >
                  {overlayState.visible ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      Hide Overlay
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      Show Floating Note
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    if (overlayState.minimized) {
                      overlayController.restore();
                    } else {
                      overlayController.minimize();
                    }
                  }}
                  disabled={!overlayState.visible}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition ${
                    overlayState.visible
                      ? 'bg-white text-stone-700 border-cream-300 hover:bg-cream-100'
                      : 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                  }`}
                >
                  {overlayState.minimized ? (
                    <>
                      <Maximize2 className="w-3.5 h-3.5" />
                      Restore Sticky Note
                    </>
                  ) : (
                    <>
                      <Minimize2 className="w-3.5 h-3.5" />
                      Minimize to Bubble
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* About / Architecture Section */}
          <section className="pt-2 border-t border-cream-200 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              About Stick Up Notes
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Stick Up Notes is an offline-first aesthetic sticky-note board designed in Cream × Crimson.
              All data is stored locally in your device's browser/native persistence with zero cloud lock-in.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-stone-400 pt-1">
              <span>Version 1.0.0</span>
              <span>•</span>
              <span>Tauri 2 Native Core</span>
              <span>•</span>
              <span>Linux & Android Overlays</span>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-cream-100 border-t border-cream-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-cream-50 text-xs font-semibold rounded-lg shadow-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState, useRef } from 'react';
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
  CheckCircle2,
  Download,
  Upload,
  RotateCcw,
  Palette
} from 'lucide-react';
import { Note } from '../lib/notes/types';
import { OverlayState } from '../lib/overlay/types';
import { getPlatformCapabilities } from '../lib/platform/capabilities';
import { OverlayController } from '../lib/overlay/controller';
import { NOTE_THEMES } from '../lib/theme';
import { NotesStore } from '../lib/notes/store';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  store: NotesStore;
  overlayState: OverlayState;
  overlayController: OverlayController;
  defaultColor: string;
  onDefaultColorChange: (color: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  notes,
  store,
  overlayState,
  overlayController,
  defaultColor,
  onDefaultColorChange,
}) => {
  const capabilities = getPlatformCapabilities();
  const [selectedNoteId, setSelectedNoteId] = useState<string>(
    overlayState.noteId || (notes[0]?.id || '')
  );
  const [requestingPerm, setRequestingPerm] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const availableNotes = notes.filter((note) => !note.isArchived);
    const selectedStillExists = availableNotes.some((note) => note.id === selectedNoteId);
    if (!selectedStillExists) {
      setSelectedNoteId(overlayState.noteId && availableNotes.some((note) => note.id === overlayState.noteId)
        ? overlayState.noteId
        : (availableNotes[0]?.id || ''));
    }
  }, [isOpen, notes, overlayState.noteId, selectedNoteId]);

  useEffect(() => {
    if (!isOpen) return;
    const refreshPermission = () => {
      void overlayController.refreshPermission().catch(() => undefined);
    };
    window.addEventListener('focus', refreshPermission);
    document.addEventListener('visibilitychange', refreshPermission);
    return () => {
      window.removeEventListener('focus', refreshPermission);
      document.removeEventListener('visibilitychange', refreshPermission);
    };
  }, [isOpen, overlayController]);

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

  const handleExport = () => {
    const jsonStr = store.exportNotesJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stick-up-notes-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setImportStatus('Backup downloaded successfully!');
    setTimeout(() => setImportStatus(null), 3000);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = store.importNotesJson(content);
      if (success) {
        setImportStatus('Notes imported successfully!');
      } else {
        setImportStatus('Failed to import: invalid JSON file.');
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset notes to default sample notes? Your current notes will be restored to the welcome templates.')) {
      store.resetToDefaults();
      setImportStatus('Sample notes restored.');
      setTimeout(() => setImportStatus(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-cream-50 rounded-xl shadow-2xl border border-cream-300 overflow-hidden text-stone-800 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-cream-200 bg-cream-100/70 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-crimson-600" />
            <h2 className="text-sm sm:text-base font-bold text-stone-900">Settings & Preferences</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-cream-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-grow">
          {importStatus && (
            <div className="p-2.5 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          {/* 1. Floating Overlay Section */}
          <section className="space-y-3 p-3.5 rounded-xl bg-cream-100/80 border border-cream-200">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-stone-900 flex items-center gap-1.5">
                  <Layers2 className="w-4 h-4 text-crimson-600" />
                  Floating Sticky Note Overlay
                </h3>
                <p className="text-[11px] text-stone-500">
                  Real OS-level always-on-top sticky note window.
                </p>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                {capabilities.supportsNativeOverlay ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Supported ({capabilities.platform})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    Web Preview
                  </span>
                )}
              </div>
            </div>

            {/* Platform Explanation Notice */}
            {!capabilities.supportsNativeOverlay && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                  <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Browser Preview Notice</span>
                </div>
                <p className="leading-relaxed text-[11px]">
                  {capabilities.explanation}
                </p>
              </div>
            )}

            {/* Android Permission Section if required */}
            {capabilities.requiresSystemAlertWindow && (
              <div className="p-3 rounded-lg bg-white border border-cream-300 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    {overlayState.permission === 'granted' ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-crimson-600" />
                    )}
                    <span>Display Over Other Apps Permission:</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
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
                    className="w-full py-1.5 bg-crimson-600 hover:bg-crimson-700 text-white rounded text-xs font-semibold shadow-xs transition"
                  >
                    {requestingPerm ? 'Opening Android Settings...' : 'Grant Overlay Permission in Settings'}
                  </button>
                )}
              </div>
            )}

            {/* Note Selector & Overlay Controls */}
            <div className="space-y-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-stone-700 mb-1">
                  Select Note to Float:
                </label>
                <select
                  value={selectedNoteId}
                  onChange={(e) => setSelectedNoteId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-cream-300 rounded-md focus:outline-none focus:ring-1 focus:ring-crimson-600"
                >
                  {notes.filter(n => !n.isArchived).map((note) => (
                    <option key={note.id} value={note.id}>
                      {note.title || 'Untitled Note'} ({note.color}) {note.isPinned ? '📌' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Command Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleToggleOverlay}
                  disabled={!capabilities.supportsNativeOverlay || (!overlayState.visible && !selectedNoteId) || (!overlayState.visible && capabilities.requiresSystemAlertWindow && overlayState.permission !== 'granted')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed ${
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

          {/* 2. Default Note Color / Theme */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-crimson-600" />
              Default New Note Color
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {Object.values(NOTE_THEMES).map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => onDefaultColorChange(theme.id)}
                  style={{ backgroundColor: theme.bg, borderColor: theme.border }}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border shadow-xs transition transform hover:scale-105 ${
                    defaultColor === theme.id ? 'ring-2 ring-crimson-600 ring-offset-1' : ''
                  }`}
                  title={theme.name}
                >
                  <span
                    className="w-4 h-4 rounded-full border shadow-xs mb-1"
                    style={{ backgroundColor: theme.pin }}
                  />
                  <span className="text-[9px] font-medium text-stone-700 truncate w-full text-center">
                    {theme.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* 3. Data & Backup Section */}
          <section className="space-y-2 pt-2 border-t border-cream-200">
            <h3 className="text-xs font-semibold text-stone-800">Data & Backup</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-cream-100 border border-cream-300 rounded-lg text-xs font-medium text-stone-700 transition"
                title="Download JSON backup"
              >
                <Download className="w-3.5 h-3.5 text-stone-500" />
                <span>Export Backup</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-cream-100 border border-cream-300 rounded-lg text-xs font-medium text-stone-700 transition"
                title="Import notes from JSON backup"
              >
                <Upload className="w-3.5 h-3.5 text-stone-500" />
                <span>Import JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />

              <button
                onClick={handleResetDefaults}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-red-50 border border-cream-300 hover:border-red-200 rounded-lg text-xs font-medium text-stone-600 hover:text-crimson-700 transition"
                title="Restore default welcome templates"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo</span>
              </button>
            </div>
          </section>

          {/* 4. About Stick Up Notes */}
          <section className="pt-2 border-t border-cream-200 space-y-1">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              Offline-First & Privacy First
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Stick Up Notes runs entirely on-device with local storage persistence. No tracking, no mandatory cloud sync, no data harvesting.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-cream-100/80 border-t border-cream-200 flex justify-end shrink-0">
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

import React, { useState, useEffect, useRef } from 'react';
import { 
  Pin, 
  Plus, 
  Minus, 
  X, 
  Maximize2, 
  Minimize2, 
  GripHorizontal,
  LayoutDashboard,
  Palette,
  Check,
  Tag,
  Bell
} from 'lucide-react';
import { Note, ChecklistItem } from '../lib/notes/types';
import { NotesStore, getNotesStore } from '../lib/notes/store';
import { OverlayNoteSync } from '../lib/overlay/note-sync';
import { OverlayController, getOverlayController } from '../lib/overlay/controller';
import { getTheme, NOTE_THEMES } from '../lib/theme';
import { detectPlatform } from '../lib/platform/capabilities';
import { getNativeBridge } from '../lib/platform/native-bridge';

interface FloatingOverlayViewProps {
  initialNoteId?: string | null;
}

export const FloatingOverlayView: React.FC<FloatingOverlayViewProps> = ({
  initialNoteId,
}) => {
  const store = getNotesStore();
  const controller = getOverlayController();
  const urlNoteId = new URLSearchParams(window.location.search).get('noteId');
  const resolvedInitialNoteId = initialNoteId || urlNoteId;
  const [sync] = useState(() => new OverlayNoteSync(store));

  const [currentNote, setCurrentNote] = useState<Note | null>(() => {
    return store.getOverlayNote(resolvedInitialNoteId || controller.getState().noteId) || null;
  });

  const [allNotes, setAllNotes] = useState<Note[]>(() => store.getNotes());
  const [isMinimized, setIsMinimized] = useState<boolean>(
    controller.getState().minimized
  );
  const [newChecklistText, setNewChecklistText] = useState('');
  const [showAddChecklist, setShowAddChecklist] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showNotePicker, setShowNotePicker] = useState(false);

  const newChecklistInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const notePickerRef = useRef<HTMLDivElement>(null);
  const androidDragRef = useRef<{ x: number; y: number } | null>(null);
  const isAndroidOverlay = detectPlatform() === 'android';

  // Sync state with controller and external store changes
  useEffect(() => {
    const unsubController = controller.subscribe((state) => {
      setIsMinimized(state.minimized);
      if (state.noteId && state.noteId !== currentNote?.id) {
        const found = store.getNote(state.noteId);
        if (found) setCurrentNote(found);
      }
    });

    const unsubStore = store.subscribe((updatedNotes) => {
      setAllNotes([...updatedNotes]);
      if (currentNote) {
        const refreshed = store.getNote(currentNote.id);
        if (refreshed) setCurrentNote({ ...refreshed });
      }
    });

    const unsubSync = sync.onSync((event) => {
      if (currentNote && event.noteId === currentNote.id && event.patch) {
        setCurrentNote((prev) => (prev ? { ...prev, ...event.patch } : null));
      }
    });

    return () => {
      unsubController();
      unsubStore();
      unsubSync();
      sync.destroy();
    };
  }, [currentNote?.id, store, controller, sync]);

  // Click outside listener for color picker & note picker popovers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
      if (notePickerRef.current && !notePickerRef.current.contains(e.target as Node)) {
        setShowNotePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const theme = getTheme(currentNote?.color || 'cream');

  const handleUpdate = (patch: Partial<Note>) => {
    if (!currentNote) return;
    sync.broadcastPatch(currentNote.id, patch);
    setCurrentNote((prev) => (prev ? { ...prev, ...patch } : null));
  };

  const handleTogglePin = () => {
    if (!currentNote) return;
    handleUpdate({ isPinned: !currentNote.isPinned });
  };

  const handleAddChecklist = () => {
    if (!currentNote) return;
    const text = newChecklistText.trim() || newChecklistInputRef.current?.value.trim() || '';
    if (!text) return;
    const newItem: ChecklistItem = {
      id: `check-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text,
      completed: false,
    };
    handleUpdate({ checklist: [...currentNote.checklist, newItem] });
    setNewChecklistText('');
    if (newChecklistInputRef.current) newChecklistInputRef.current.value = '';
    newChecklistInputRef.current?.focus();
  };

  const handleToggleChecklist = (id: string) => {
    if (!currentNote) return;
    const updated = currentNote.checklist.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    handleUpdate({ checklist: updated });
  };

  const handleRemoveChecklist = (id: string) => {
    if (!currentNote) return;
    const updated = currentNote.checklist.filter((item) => item.id !== id);
    handleUpdate({ checklist: updated });
  };

  const handleQuickCreate = () => {
    const newNote = store.createOverlayNote({
      title: 'Quick Sticky 📌',
      content: '',
      color: 'cream',
    });
    controller.show(newNote.id);
    setCurrentNote(newNote);
  };

  const handleSelectNote = (noteId: string) => {
    const target = store.getNote(noteId);
    if (target) {
      controller.show(target.id);
      setCurrentNote(target);
      setShowNotePicker(false);
    }
  };

  const handleClose = () => {
    // Non-destructive close! Hides overlay, NEVER deletes the note!
    if (currentNote) {
      sync.handleOverlayClosed(currentNote.id);
    }
    controller.close();
  };

  const handleOpenMain = () => {
    controller.openMainWindow();
  };

  const handleAndroidDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isAndroidOverlay) return;
    androidDragRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleAndroidDragMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isAndroidOverlay || !androidDragRef.current) return;
    const previous = androidDragRef.current;
    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    if (dx === 0 && dy === 0) return;
    androidDragRef.current = { x: event.clientX, y: event.clientY };
    void getNativeBridge().moveOverlay(dx, dy);
  };

  const handleAndroidDragEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    androidDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  // If minimized, display compact floating tab/bubble
  if (isMinimized) {
    return (
      <div 
        data-tauri-drag-region
        style={{ backgroundColor: theme.bg, borderColor: theme.border }}
        className="flex items-center justify-between w-full h-12 px-3 rounded-xl border shadow-paper-floating cursor-move select-none animate-in fade-in zoom-in-95"
      >
        <div className="flex items-center gap-2 overflow-hidden mr-2">
          <span 
            className="w-2.5 h-2.5 rounded-full shrink-0" 
            style={{ backgroundColor: theme.pin }} 
          />
          <span 
            className="text-xs font-bold truncate"
            style={{ color: theme.text }}
          >
            {currentNote?.title || 'Sticky Note'}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => controller.restore()}
            className="p-1.5 rounded-md hover:bg-black/10 transition"
            title="Expand Sticky Note"
          >
            <Maximize2 className="w-3.5 h-3.5 text-stone-600" />
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md hover:bg-black/10 transition"
            title="Hide Overlay (keeps note safe)"
          >
            <X className="w-3.5 h-3.5 text-stone-500 hover:text-crimson-700" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
      className="flex flex-col w-full h-screen rounded-lg border shadow-paper-floating overflow-hidden select-none"
    >
      {/* Draggable Titlebar for native window */}
      <div
        data-tauri-drag-region
        onPointerDown={handleAndroidDragStart}
        onPointerMove={handleAndroidDragMove}
        onPointerUp={handleAndroidDragEnd}
        onPointerCancel={handleAndroidDragEnd}
        style={{ backgroundColor: theme.tape }}
        className="flex items-center justify-between px-3 py-1.5 cursor-move border-b border-black/5 touch-none relative"
      >
        {/* Note Switcher Dropdown in Header */}
        <div className="relative" ref={notePickerRef}>
          <button
            onClick={() => setShowNotePicker(!showNotePicker)}
            className="flex items-center gap-1.5 text-xs font-semibold hover:bg-black/10 px-1.5 py-0.5 rounded transition max-w-[140px]"
            title="Switch floating note"
          >
            <Pin 
              className={`w-3.5 h-3.5 shrink-0 ${currentNote?.isPinned ? 'fill-current text-crimson-700' : 'text-stone-500'}`} 
            />
            <span className="truncate">
              {currentNote?.title || 'Stick Up Note'}
            </span>
          </button>

          {showNotePicker && (
            <div 
              className="absolute left-0 top-full mt-1 z-40 bg-white rounded-lg shadow-xl border border-stone-200 py-1 w-48 max-h-56 overflow-y-auto text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-2.5 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                Select Floating Note
              </div>
              {allNotes.filter(n => !n.isArchived).map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleSelectNote(n.id)}
                  className={`w-full text-left px-2.5 py-1.5 hover:bg-stone-100 flex items-center justify-between gap-1 transition ${
                    n.id === currentNote?.id ? 'bg-crimson-50 text-crimson-800 font-semibold' : 'text-stone-700'
                  }`}
                >
                  <span className="truncate">{n.title || 'Untitled'}</span>
                  {n.isPinned && <Pin className="w-2.5 h-2.5 fill-current text-crimson-600 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Overlay Window Controls */}
        <div className="flex items-center gap-0.5">
          {/* Color Picker in Overlay */}
          <div className="relative" ref={colorPickerRef}>
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1 rounded hover:bg-black/10 transition text-stone-600"
              title="Change color"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>

            {showColorPicker && (
              <div 
                className="absolute right-0 top-full mt-1 z-40 grid grid-cols-4 gap-1 p-1.5 bg-white rounded-lg shadow-xl border border-stone-200 w-36"
                onClick={(e) => e.stopPropagation()}
              >
                {Object.values(NOTE_THEMES).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      handleUpdate({ color: t.id });
                      setShowColorPicker(false);
                    }}
                    style={{ backgroundColor: t.bg, borderColor: t.border }}
                    className={`w-6 h-6 rounded-full border shadow-xs transition transform hover:scale-110 flex items-center justify-center ${
                      currentNote?.color === t.id ? 'ring-2 ring-crimson-600 ring-offset-1' : ''
                    }`}
                    title={t.name}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleQuickCreate}
            className="p-1 rounded hover:bg-black/10 transition text-stone-600"
            title="Quick Note Capture (+)"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleTogglePin}
            className="p-1 rounded hover:bg-black/10 transition text-stone-600"
            title={currentNote?.isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => controller.minimize()}
            className="p-1 rounded hover:bg-black/10 transition text-stone-600"
            title="Minimize to Bubble"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleOpenMain}
            className="p-1 rounded hover:bg-black/10 transition text-stone-600"
            title="Open Full Board"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-red-100 text-stone-500 hover:text-crimson-700 transition"
            title="Close Overlay (does not delete note)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Note Body */}
      <div className="flex flex-col flex-grow p-3 overflow-y-auto space-y-2">
        {/* Title Input */}
        <input
          type="text"
          value={currentNote?.title || ''}
          onChange={(e) => handleUpdate({ title: e.target.value })}
          placeholder="Note title..."
          className="text-sm font-bold bg-transparent border-none focus:outline-none placeholder:opacity-50"
          style={{ color: theme.text }}
        />

        {/* Content Area */}
        <textarea
          value={currentNote?.content || ''}
          onChange={(e) => handleUpdate({ content: e.target.value })}
          placeholder="Jot down notes..."
          rows={4}
          className="w-full flex-grow text-xs bg-transparent border-none resize-none focus:outline-none placeholder:opacity-40 leading-relaxed font-sans"
          style={{ color: theme.text }}
        />

        {/* Checklist */}
        {currentNote && currentNote.checklist.length > 0 && (
          <div className="border-t border-black/5 pt-2 space-y-1">
            {currentNote.checklist.map((item) => (
              <div key={item.id} className="flex items-center gap-1.5 text-xs group/item">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => handleToggleChecklist(item.id)}
                  className="w-3.5 h-3.5 rounded border-stone-300 text-crimson-600 cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => {
                    const updated = currentNote.checklist.map((c) =>
                      c.id === item.id ? { ...c, text: e.target.value } : c
                    );
                    handleUpdate({ checklist: updated });
                  }}
                  className={`flex-grow bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-xs font-sans min-w-0 ${
                    item.completed ? 'line-through opacity-50' : ''
                  }`}
                  style={{ color: theme.text }}
                />
                <button
                  onClick={() => handleRemoveChecklist(item.id)}
                  className="opacity-60 hover:opacity-100 hover:text-crimson-600 p-0.5"
                  title="Remove"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Checklist Item */}
        {showAddChecklist ? (
          <div className="flex items-center gap-1 pt-1 text-xs">
            <input
              ref={newChecklistInputRef}
              type="text"
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddChecklist();
                if (e.key === 'Escape') setShowAddChecklist(false);
              }}
              placeholder="New task... (Enter to add)"
              className="flex-grow px-2 py-0.5 bg-black/5 rounded text-xs focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleAddChecklist}
              className="p-1 rounded bg-crimson-600 text-white shrink-0"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              onClick={() => setShowAddChecklist(false)}
              className="p-1 rounded text-stone-500 shrink-0"
            >
              <Check className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddChecklist(true)}
            className="flex items-center gap-1 text-[11px] opacity-65 hover:opacity-100 self-start"
          >
            <Plus className="w-3 h-3" />
            <span>Add task</span>
          </button>
        )}

        {/* Tags in Overlay */}
        {currentNote && currentNote.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1 border-t border-black/5">
            {currentNote.tags.map((t) => (
              <span key={t} className="px-1.5 py-0.2 rounded text-[9px] bg-black/5 font-medium opacity-80">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer info bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/5 text-[10px] opacity-60">
        <span>Stick Up Notes Overlay</span>
        <span>Always on Top</span>
      </div>
    </div>
  );
};

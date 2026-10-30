import React, { useState, useEffect } from 'react';
import { 
  Pin, 
  Plus, 
  Minus, 
  ExternalLink, 
  X, 
  CheckSquare, 
  Maximize2, 
  Minimize2, 
  GripHorizontal,
  LayoutDashboard
} from 'lucide-react';
import { Note, ChecklistItem } from '../lib/notes/types';
import { NotesStore, getNotesStore } from '../lib/notes/store';
import { OverlayNoteSync } from '../lib/overlay/note-sync';
import { OverlayController, getOverlayController } from '../lib/overlay/controller';
import { getTheme } from '../lib/theme';
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

  const [isMinimized, setIsMinimized] = useState<boolean>(
    controller.getState().minimized
  );
  const [newChecklistText, setNewChecklistText] = useState('');
  const [showAddChecklist, setShowAddChecklist] = useState(false);
  const androidDragRef = React.useRef<{ x: number; y: number } | null>(null);
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

    const unsubStore = store.subscribe(() => {
      if (currentNote) {
        const refreshed = store.getNote(currentNote.id);
        if (refreshed) setCurrentNote(refreshed);
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
    if (!currentNote || !newChecklistText.trim()) return;
    const newItem: ChecklistItem = {
      id: `check-${Date.now()}`,
      text: newChecklistText.trim(),
      completed: false,
    };
    handleUpdate({ checklist: [...currentNote.checklist, newItem] });
    setNewChecklistText('');
  };

  const handleToggleChecklist = (id: string) => {
    if (!currentNote) return;
    const updated = currentNote.checklist.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    handleUpdate({ checklist: updated });
  };

  const handleQuickCreate = () => {
    const newNote = store.createOverlayNote({
      title: 'Quick Sticky',
      content: '',
      color: 'cream',
    });
    controller.show(newNote.id);
    setCurrentNote(newNote);
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
        className="flex items-center justify-between px-3 py-1.5 cursor-move border-b border-black/5"
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <Pin 
            className={`w-3.5 h-3.5 ${currentNote?.isPinned ? 'fill-current text-crimson-700' : 'text-stone-500'}`} 
          />
          <span className="truncate max-w-[130px]">
            {currentNote?.title || 'Stick Up Overlay'}
          </span>
        </div>

        {/* Overlay Window Controls */}
        <div className="flex items-center gap-0.5">
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
              <div key={item.id} className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => handleToggleChecklist(item.id)}
                  className="w-3.5 h-3.5 rounded border-stone-300 text-crimson-600 cursor-pointer"
                />
                <span className={`flex-grow truncate ${item.completed ? 'line-through opacity-50' : ''}`}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Add Checklist Item */}
        {showAddChecklist ? (
          <div className="flex items-center gap-1 pt-1 text-xs">
            <input
              type="text"
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddChecklist();
                if (e.key === 'Escape') setShowAddChecklist(false);
              }}
              placeholder="New todo..."
              className="flex-grow px-2 py-0.5 bg-black/5 rounded text-xs focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleAddChecklist}
              className="p-1 rounded bg-crimson-600 text-white"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              onClick={() => setShowAddChecklist(false)}
              className="p-1 rounded text-stone-500"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddChecklist(true)}
            className="flex items-center gap-1 text-[11px] opacity-60 hover:opacity-100 self-start"
          >
            <Plus className="w-3 h-3" />
            <span>Add task</span>
          </button>
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

import React, { useState, useRef } from 'react';
import { 
  Pin, 
  Trash2, 
  Archive, 
  ArchiveRestore, 
  Palette, 
  Layers2, 
  Plus, 
  X,
  Bell,
  GripHorizontal
} from 'lucide-react';
import { Note, ChecklistItem } from '../lib/notes/types';
import { getTheme, NOTE_THEMES } from '../lib/theme';

interface StickyNoteProps {
  note: Note;
  onUpdate: (id: string, patch: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onFloatOverlay: (id: string) => void;
  onBringToFront?: (id: string) => void;
  isCanvasMode?: boolean;
  onDragStart?: (e: React.MouseEvent | React.TouchEvent, id: string) => void;
}

export const StickyNote: React.FC<StickyNoteProps> = ({
  note,
  onUpdate,
  onDelete,
  onFloatOverlay,
  onBringToFront,
  isCanvasMode = false,
  onDragStart,
}) => {
  const theme = getTheme(note.color);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [isAddingChecklist, setIsAddingChecklist] = useState(false);
  const newChecklistInputRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);

  // Subtle natural angle for physical note feel
  const rotationDegrees = React.useMemo(() => {
    let hash = 0;
    for (let i = 0; i < note.id.length; i++) {
      hash = (hash << 5) - hash + note.id.charCodeAt(i);
      hash |= 0;
    }
    return ((hash % 7) - 3) * 0.4; // -1.2deg to +1.2deg
  }, [note.id]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(note.id, { title: e.target.value });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(note.id, { content: e.target.value });
  };

  const handleToggleChecklist = (itemId: string) => {
    const updated = note.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    onUpdate(note.id, { checklist: updated });
  };

  const handleAddChecklistItem = () => {
    const text = newChecklistText.trim() || newChecklistInputRef.current?.value.trim() || '';
    if (!text) return;
    const newItem: ChecklistItem = {
      id: `check-${Date.now()}`,
      text,
      completed: false,
    };
    onUpdate(note.id, { checklist: [...note.checklist, newItem] });
    setNewChecklistText('');
    if (newChecklistInputRef.current) newChecklistInputRef.current.value = '';
    setIsAddingChecklist(false);
  };

  const handleRemoveChecklistItem = (itemId: string) => {
    const updated = note.checklist.filter((item) => item.id !== itemId);
    onUpdate(note.id, { checklist: updated });
  };

  const reminderInputValue = note.reminder
    ? (() => {
        const date = new Date(note.reminder);
        if (Number.isNaN(date.getTime())) return '';
        const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
        return local.toISOString().slice(0, 16);
      })()
    : '';

  return (
    <div
      ref={noteRef}
      onClick={() => onBringToFront?.(note.id)}
      style={{
        ...(isCanvasMode
          ? {
              position: 'absolute',
              left: `${note.position.x}px`,
              top: `${note.position.y}px`,
              zIndex: note.zIndex || 1,
              transform: `rotate(${rotationDegrees}deg)`,
            }
          : {
              transform: `rotate(${rotationDegrees * 0.5}deg)`,
            }),
        backgroundColor: theme.bg,
        borderColor: theme.border,
        color: theme.text,
      }}
      className={`group relative flex flex-col w-full max-w-[300px] min-w-0 min-h-[220px] sm:min-h-[260px] rounded-sm p-4 transition-all duration-200 shadow-paper hover:shadow-paper-hover border ${
        note.isPinned ? 'ring-2 ring-crimson-600/40' : ''
      }`}
    >
      {/* Physical Tape Header (Drag Handle in canvas mode) */}
      <div
        onMouseDown={(e) => isCanvasMode && onDragStart?.(e, note.id)}
        onTouchStart={(e) => isCanvasMode && onDragStart?.(e, note.id)}
        style={{ backgroundColor: theme.tape }}
        className={`absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-6 rounded-sm opacity-85 shadow-xs flex items-center justify-center transition-opacity hover:opacity-100 touch-none ${
          isCanvasMode ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
        title={isCanvasMode ? 'Drag to move note' : ''}
      >
        {isCanvasMode && (
          <GripHorizontal className="w-4 h-4 opacity-40 hover:opacity-80" />
        )}
      </div>

      {/* Note Header & Actions */}
      <div className="flex items-start justify-between gap-2 pt-2 mb-2">
        <input
          type="text"
          value={note.title}
          onChange={handleTitleChange}
          placeholder="Note Title..."
          className="w-full text-base font-bold bg-transparent border-none focus:outline-none focus:ring-0 placeholder:opacity-50"
          style={{ color: theme.text }}
        />

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {/* Pin Button */}
          <button
            onClick={() => onUpdate(note.id, { isPinned: !note.isPinned })}
            className={`p-1 rounded hover:bg-black/5 transition ${
              note.isPinned ? 'text-crimson-600' : 'text-stone-400 hover:text-stone-700'
            }`}
            title={note.isPinned ? 'Unpin note' : 'Pin note'}
          >
            <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
          </button>

          {/* Float as Overlay Button */}
          <button
            onClick={() => onFloatOverlay(note.id)}
            className="p-1 rounded hover:bg-black/5 text-stone-500 hover:text-crimson-700 transition"
            title="Float as OS-Level Sticky Note Overlay"
          >
            <Layers2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content Textarea */}
      <textarea
        value={note.content}
        onChange={handleContentChange}
        placeholder="Write something..."
        rows={3}
        className="w-full flex-grow text-sm bg-transparent border-none resize-none focus:outline-none focus:ring-0 placeholder:opacity-40 leading-relaxed font-sans"
        style={{ color: theme.text }}
      />

      {/* Checklist Items */}
      {note.checklist.length > 0 && (
        <div className="mt-2 space-y-1.5 border-t border-black/5 pt-2">
          {note.checklist.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-xs group/item">
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => handleToggleChecklist(item.id)}
                className="w-3.5 h-3.5 rounded border-stone-300 text-crimson-600 focus:ring-crimson-500 cursor-pointer"
              />
              <span
                className={`flex-grow ${
                  item.completed ? 'line-through opacity-50' : ''
                }`}
              >
                {item.text}
              </span>
              <button
                onClick={() => handleRemoveChecklistItem(item.id)}
                className="opacity-0 group-hover/item:opacity-100 p-0.5 hover:text-crimson-600 transition"
                title="Remove item"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Checklist Item Input */}
      {isAddingChecklist ? (
        <div className="flex items-center gap-1.5 mt-2 text-xs">
          <input
            ref={newChecklistInputRef}
            type="text"
            value={newChecklistText}
            onChange={(e) => setNewChecklistText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddChecklistItem();
              if (e.key === 'Escape') setIsAddingChecklist(false);
            }}
            placeholder="Checklist item..."
            className="flex-grow px-2 py-1 bg-black/5 rounded text-xs focus:outline-none"
            autoFocus
          />
          <button
            onClick={handleAddChecklistItem}
            className="p-1 rounded bg-crimson-600 text-white hover:bg-crimson-700"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            onClick={() => setIsAddingChecklist(false)}
            className="p-1 rounded hover:bg-black/5 text-stone-500"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingChecklist(true)}
          className="flex items-center gap-1 mt-2 text-[11px] font-medium opacity-60 hover:opacity-100 transition self-start"
        >
          <Plus className="w-3 h-3" />
          <span>Add checklist item</span>
        </button>
      )}

      {/* Reminder */}
      <div className="flex items-center gap-2 mt-2 text-[11px]">
        <Bell className="w-3.5 h-3.5 shrink-0 opacity-70" />
        <input
          type="datetime-local"
          value={reminderInputValue}
          onChange={(e) => onUpdate(note.id, { reminder: e.target.value ? new Date(`${e.target.value}:00`).toISOString() : null })}
          className="min-w-0 flex-1 bg-black/5 rounded px-2 py-1 focus:outline-none"
          aria-label="Reminder date and time"
        />
        {note.reminder && (
          <button
            onClick={() => onUpdate(note.id, { reminder: null })}
            className="p-1 rounded hover:bg-black/5"
            title="Clear reminder"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Bottom Footer Toolbar */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/5 text-stone-500 text-xs">
        <div className="flex items-center gap-1">
          {/* Color Picker Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1 rounded hover:bg-black/5 transition"
              title="Change note paper color"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>

            {/* Color Palette Popover */}
            {showColorPicker && (
              <div 
                className="absolute left-0 bottom-full mb-1 z-30 flex items-center gap-1.5 p-1.5 bg-white rounded-lg shadow-lg border border-stone-200"
                onClick={(e) => e.stopPropagation()}
              >
                {Object.values(NOTE_THEMES).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onUpdate(note.id, { color: t.id });
                      setShowColorPicker(false);
                    }}
                    style={{ backgroundColor: t.bg, borderColor: t.border }}
                    className={`w-5 h-5 rounded-full border shadow-xs transition transform hover:scale-110 ${
                      note.color === t.id ? 'ring-2 ring-crimson-600 ring-offset-1' : ''
                    }`}
                    title={t.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Archive / Unarchive */}
          <button
            onClick={() => onUpdate(note.id, { isArchived: !note.isArchived })}
            className="p-1 rounded hover:bg-black/5 transition"
            title={note.isArchived ? 'Restore from archive' : 'Archive note'}
          >
            {note.isArchived ? (
              <ArchiveRestore className="w-3.5 h-3.5 text-stone-600" />
            ) : (
              <Archive className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Delete Note */}
        <button
          onClick={() => onDelete(note.id)}
          className="p-1 rounded hover:bg-red-50 text-stone-400 hover:text-crimson-700 transition"
          title="Delete note"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

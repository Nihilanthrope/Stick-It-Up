import React, { useState, useRef, useEffect } from 'react';
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
  Copy,
  Tag,
  Check,
  AlertTriangle,
  GripHorizontal
} from 'lucide-react';
import { Note, ChecklistItem } from '../lib/notes/types';
import { getTheme, NOTE_THEMES } from '../lib/theme';

interface StickyNoteProps {
  note: Note;
  onUpdate: (id: string, patch: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onFloatOverlay: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onTagClick?: (tag: string) => void;
  onBringToFront?: (id: string) => void;
  isCanvasMode?: boolean;
  onDragStart?: (e: React.MouseEvent | React.TouchEvent, id: string) => void;
}

export const StickyNote: React.FC<StickyNoteProps> = ({
  note,
  onUpdate,
  onDelete,
  onFloatOverlay,
  onDuplicate,
  onTagClick,
  onBringToFront,
  isCanvasMode = false,
  onDragStart,
}) => {
  const theme = getTheme(note.color);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [isAddingChecklist, setIsAddingChecklist] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagText, setNewTagText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isEditingReminder, setIsEditingReminder] = useState(false);

  const newChecklistInputRef = useRef<HTMLInputElement>(null);
  const newTagInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
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

  // Click outside to close color picker
  useEffect(() => {
    if (!showColorPicker) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showColorPicker]);

  // Reset confirm delete timer
  useEffect(() => {
    if (!confirmDelete) return;
    const timer = setTimeout(() => setConfirmDelete(false), 3500);
    return () => clearTimeout(timer);
  }, [confirmDelete]);

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

  const handleUpdateChecklistItem = (itemId: string, text: string) => {
    const updated = note.checklist.map((item) =>
      item.id === itemId ? { ...item, text } : item
    );
    onUpdate(note.id, { checklist: updated });
  };

  const handleAddChecklistItem = () => {
    const text = newChecklistText.trim() || newChecklistInputRef.current?.value.trim() || '';
    if (!text) return;
    const newItem: ChecklistItem = {
      id: `check-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text,
      completed: false,
    };
    onUpdate(note.id, { checklist: [...note.checklist, newItem] });
    setNewChecklistText('');
    if (newChecklistInputRef.current) newChecklistInputRef.current.value = '';
    // Keep focus for continuous rapid task addition
    newChecklistInputRef.current?.focus();
  };

  const handleRemoveChecklistItem = (itemId: string) => {
    const updated = note.checklist.filter((item) => item.id !== itemId);
    onUpdate(note.id, { checklist: updated });
  };

  const handleAddTag = () => {
    const clean = newTagText.trim().replace(/^#+/, '');
    if (!clean) return;
    if (!note.tags.includes(clean)) {
      onUpdate(note.id, { tags: [...note.tags, clean] });
    }
    setNewTagText('');
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tag: string) => {
    onUpdate(note.id, { tags: note.tags.filter((t) => t !== tag) });
  };

  // Safe datetime input parser (guards against RangeError)
  const handleReminderChange = (value: string) => {
    if (!value) {
      onUpdate(note.id, { reminder: null });
      return;
    }
    try {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) {
        onUpdate(note.id, { reminder: d.toISOString() });
      }
    } catch {
      // ignore invalid input without throwing
    }
  };

  const reminderInputValue = React.useMemo(() => {
    if (!note.reminder) return '';
    try {
      const d = new Date(note.reminder);
      if (Number.isNaN(d.getTime())) return '';
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
      return local.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  }, [note.reminder]);

  const reminderBadgeText = React.useMemo(() => {
    if (!note.reminder) return null;
    try {
      const d = new Date(note.reminder);
      if (Number.isNaN(d.getTime())) return null;
      const isPast = d.getTime() < Date.now();
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const timeStr = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      return {
        formatted: `${dateStr}, ${timeStr}`,
        isPast,
      };
    } catch {
      return null;
    }
  }, [note.reminder]);

  const checklistStats = React.useMemo(() => {
    if (note.checklist.length === 0) return null;
    const completed = note.checklist.filter((c) => c.completed).length;
    return {
      completed,
      total: note.checklist.length,
      allDone: completed === note.checklist.length,
    };
  }, [note.checklist]);

  return (
    <div
      ref={noteRef}
      onClick={() => onBringToFront?.(note.id)}
      onMouseDown={(e) => {
        // Desktop mouse drag: allow grabbing from anywhere outside inputs/buttons
        const target = e.target as HTMLElement;
        if (target.closest('input, textarea, button, select, [role="button"], a')) {
          return;
        }
        if (isCanvasMode) {
          onDragStart?.(e, note.id);
        }
      }}
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
      className={`group relative flex flex-col w-[calc(100vw-32px)] max-w-[340px] sm:w-[300px] min-w-0 min-h-[240px] sm:min-h-[260px] rounded-sm p-3.5 sm:p-4 shadow-paper hover:shadow-paper-hover border ${
        isCanvasMode ? 'cursor-grab active:cursor-grabbing' : ''
      } ${
        note.isPinned ? 'ring-2 ring-crimson-600/50' : ''
      }`}
    >
      {/* Physical Tape Header (Primary Touch & Mouse Drag Handle) */}
      <div
        onMouseDown={(e) => isCanvasMode && onDragStart?.(e, note.id)}
        onTouchStart={(e) => isCanvasMode && onDragStart?.(e, note.id)}
        style={{ backgroundColor: theme.tape }}
        className={`absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-7 rounded-sm opacity-95 shadow-xs flex items-center justify-center transition-opacity hover:opacity-100 touch-none select-none ${
          isCanvasMode ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
        title={isCanvasMode ? 'Drag tape to move note' : ''}
      >
        {isCanvasMode && (
          <div className="flex items-center gap-1 opacity-70">
            <GripHorizontal className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Note Header & Actions */}
      <div className="flex items-start justify-between gap-2 pt-1 mb-2">
        <input
          type="text"
          value={note.title}
          onChange={handleTitleChange}
          placeholder="Note Title..."
          className="w-full text-base font-bold bg-transparent border-none focus:outline-none focus:ring-0 placeholder:opacity-50"
          style={{ color: theme.text }}
        />

        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity shrink-0">
          {/* Mobile Dedicated Drag Handle button */}
          {isCanvasMode && (
            <div
              onTouchStart={(e) => onDragStart?.(e, note.id)}
              className="sm:hidden p-1.5 rounded touch-none text-stone-400 hover:text-stone-800"
              title="Drag handle"
            >
              <GripHorizontal className="w-4 h-4" />
            </div>
          )}
          {/* Pin Button */}
          <button
            onClick={() => onUpdate(note.id, { isPinned: !note.isPinned })}
            className={`p-1.5 rounded hover:bg-black/5 transition ${
              note.isPinned ? 'text-crimson-600' : 'text-stone-400 hover:text-stone-700'
            }`}
            title={note.isPinned ? 'Unpin note' : 'Pin note'}
          >
            <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
          </button>

          {/* Float as Overlay Button */}
          <button
            onClick={() => onFloatOverlay(note.id)}
            className="p-1.5 rounded hover:bg-black/5 text-stone-500 hover:text-crimson-700 transition"
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
        className="w-full flex-grow text-xs sm:text-sm bg-transparent border-none resize-none focus:outline-none focus:ring-0 placeholder:opacity-40 leading-relaxed font-sans"
        style={{ color: theme.text }}
      />

      {/* Checklist Header & Items */}
      {checklistStats && (
        <div className="mt-2 pt-2 border-t border-black/5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold opacity-75">
            <span>Checklist</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] ${
              checklistStats.allDone ? 'bg-emerald-100 text-emerald-800' : 'bg-black/5'
            }`}>
              {checklistStats.completed}/{checklistStats.total} done
            </span>
          </div>

          <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
            {note.checklist.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-xs group/item py-0.5">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => handleToggleChecklist(item.id)}
                  className="w-4 h-4 rounded border-stone-300 text-crimson-600 focus:ring-crimson-500 cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => handleUpdateChecklistItem(item.id, e.target.value)}
                  className={`flex-grow bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-xs font-sans min-w-0 ${
                    item.completed ? 'line-through opacity-50' : ''
                  }`}
                  style={{ color: theme.text }}
                />
                <button
                  onClick={() => handleRemoveChecklistItem(item.id)}
                  className="opacity-70 sm:opacity-0 sm:group-hover/item:opacity-100 p-1 hover:text-crimson-600 transition shrink-0"
                  title="Remove item"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
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
            placeholder="New task... (Enter to add)"
            className="flex-grow px-2 py-1 bg-black/5 rounded text-xs focus:outline-none"
            autoFocus
          />
          <button
            onClick={handleAddChecklistItem}
            className="p-1 rounded bg-crimson-600 text-white hover:bg-crimson-700 shrink-0"
            title="Add task"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsAddingChecklist(false)}
            className="p-1 rounded hover:bg-black/5 text-stone-500 shrink-0"
            title="Done adding"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingChecklist(true)}
          className="flex items-center gap-1 mt-2 text-[11px] font-medium opacity-65 hover:opacity-100 transition self-start"
        >
          <Plus className="w-3 h-3" />
          <span>Add checklist item</span>
        </button>
      )}

      {/* Tags Bar */}
      <div className="flex flex-wrap items-center gap-1 mt-2.5 pt-2 border-t border-black/5">
        {note.tags.map((tag) => (
          <span
            key={tag}
            onClick={() => onTagClick?.(tag)}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/5 hover:bg-black/10 cursor-pointer transition"
            title={`Filter by #${tag}`}
          >
            #{tag}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveTag(tag);
              }}
              className="hover:text-crimson-600 opacity-60 hover:opacity-100"
              title="Remove tag"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}

        {isAddingTag ? (
          <div className="inline-flex items-center gap-1 text-[10px]">
            <input
              ref={newTagInputRef}
              type="text"
              value={newTagText}
              onChange={(e) => setNewTagText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTag();
                if (e.key === 'Escape') setIsAddingTag(false);
              }}
              placeholder="tag..."
              className="w-16 px-1.5 py-0.5 bg-black/5 rounded text-[10px] focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleAddTag}
              className="p-0.5 rounded hover:bg-black/10 text-crimson-700"
            >
              <Check className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={() => setIsAddingTag(false)}
              className="p-0.5 rounded hover:bg-black/10 text-stone-500"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingTag(true)}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium opacity-50 hover:opacity-90 hover:bg-black/5 transition"
            title="Add a tag"
          >
            <Tag className="w-2.5 h-2.5" />
            <span>+ tag</span>
          </button>
        )}
      </div>

      {/* Reminder Datetime Section (only shown when set or editing) */}
      {(note.reminder || isEditingReminder) && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px] bg-black/5 p-1.5 rounded-md animate-in fade-in">
          {isEditingReminder ? (
            <div className="flex items-center gap-1.5 flex-1 min-w-[170px]">
              <Bell className="w-3.5 h-3.5 shrink-0 text-blue-600" />
              <input
                type="datetime-local"
                value={reminderInputValue}
                onChange={(e) => handleReminderChange(e.target.value)}
                className="w-full bg-white/80 rounded px-1.5 py-0.5 text-[11px] focus:outline-none"
                aria-label="Reminder date and time"
                autoFocus
              />
              <button
                onClick={() => setIsEditingReminder(false)}
                className="px-2 py-0.5 rounded bg-stone-700 text-white text-[10px] font-semibold"
                title="Done"
              >
                Done
              </button>
            </div>
          ) : (
            reminderBadgeText && (
              <div className="flex items-center justify-between w-full">
                <span
                  onClick={() => setIsEditingReminder(true)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer ${
                    reminderBadgeText.isPast
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                  title="Click to edit reminder time"
                >
                  {reminderBadgeText.isPast ? '⚠️ Overdue: ' : '⏰ '}
                  {reminderBadgeText.formatted}
                </span>
                <button
                  onClick={() => {
                    onUpdate(note.id, { reminder: null });
                    setIsEditingReminder(false);
                  }}
                  className="p-1 rounded hover:bg-black/10 text-stone-500"
                  title="Clear reminder"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )
          )}
        </div>
      )}

      {/* Bottom Footer Toolbar */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/5 text-stone-500 text-xs">
        <div className="flex items-center gap-1">
          {/* Color Picker Toggle */}
          <div className="relative" ref={colorPickerRef}>
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1.5 rounded hover:bg-black/5 transition"
              title="Change note paper color"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>

            {/* Color Palette Popover */}
            {showColorPicker && (
              <div 
                className="absolute left-0 bottom-full mb-1 z-30 grid grid-cols-4 gap-1.5 p-2 bg-white rounded-lg shadow-xl border border-stone-200 w-44 animate-in fade-in zoom-in-95"
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
                    className={`w-7 h-7 rounded-full border shadow-xs transition transform hover:scale-110 flex items-center justify-center ${
                      note.color === t.id ? 'ring-2 ring-crimson-600 ring-offset-1' : ''
                    }`}
                    title={t.name}
                  >
                    {note.color === t.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-crimson-700" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reminder / Bell Button */}
          <button
            onClick={() => setIsEditingReminder(!isEditingReminder)}
            className={`p-1.5 rounded hover:bg-black/5 transition ${
              note.reminder ? 'text-blue-600' : 'text-stone-400 hover:text-stone-700'
            }`}
            title={note.reminder ? 'Edit reminder' : 'Set reminder'}
          >
            <Bell className={`w-3.5 h-3.5 ${note.reminder ? 'fill-current' : ''}`} />
          </button>

          {/* Duplicate Note */}
          <button
            onClick={() => onDuplicate?.(note.id)}
            className="p-1.5 rounded hover:bg-black/5 transition"
            title="Duplicate note"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Archive / Unarchive */}
          <button
            onClick={() => onUpdate(note.id, { isArchived: !note.isArchived })}
            className="p-1.5 rounded hover:bg-black/5 transition"
            title={note.isArchived ? 'Restore from archive' : 'Archive note'}
          >
            {note.isArchived ? (
              <ArchiveRestore className="w-3.5 h-3.5 text-stone-600" />
            ) : (
              <Archive className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Delete Note with safety confirmation */}
        {confirmDelete ? (
          <div className="flex items-center gap-1 animate-in fade-in">
            <span className="text-[10px] text-crimson-700 font-medium">Delete?</span>
            <button
              onClick={() => onDelete(note.id)}
              className="px-2 py-0.5 rounded bg-crimson-600 text-white text-[11px] font-semibold hover:bg-crimson-700 transition"
              title="Confirm Delete"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="p-1 rounded hover:bg-black/5 text-stone-500"
              title="Cancel"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded hover:bg-red-50 text-stone-400 hover:text-crimson-700 transition"
            title="Delete note"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

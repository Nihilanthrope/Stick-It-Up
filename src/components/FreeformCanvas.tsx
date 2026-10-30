import React, { useState, useRef, useEffect } from 'react';
import { Note } from '../lib/notes/types';
import { StickyNote } from './StickyNote';
import { LayoutGrid, Sparkles } from 'lucide-react';

interface FreeformCanvasProps {
  notes: Note[];
  onUpdateNote: (id: string, patch: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  onFloatOverlay: (id: string) => void;
  onDuplicateNote?: (id: string) => void;
  onTagClick?: (tag: string) => void;
  onBringToFront: (id: string) => void;
  onAutoArrange?: (width: number) => void;
  onNewNoteAt?: (pos: { x: number; y: number }) => void;
}

export const FreeformCanvas: React.FC<FreeformCanvasProps> = ({
  notes,
  onUpdateNote,
  onDeleteNote,
  onFloatOverlay,
  onDuplicateNote,
  onTagClick,
  onBringToFront,
  onAutoArrange,
  onNewNoteAt,
}) => {
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.stopPropagation();
    onBringToFront(id);
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragOffset.current = {
      x: clientX - rect.left + (canvasRef.current?.scrollLeft || 0) - note.position.x,
      y: clientY - rect.top + (canvasRef.current?.scrollTop || 0) - note.position.y,
    };
    setDraggingNoteId(id);
  };

  useEffect(() => {
    if (!draggingNoteId) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e && e.cancelable) {
        e.preventDefault();
      }
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const newX = Math.max(
        10,
        clientX - rect.left + (canvasRef.current?.scrollLeft || 0) - dragOffset.current.x,
      );
      const newY = Math.max(
        10,
        clientY - rect.top + (canvasRef.current?.scrollTop || 0) - dragOffset.current.y,
      );

      onUpdateNote(draggingNoteId, {
        position: { x: Math.round(newX), y: Math.round(newY) },
      });
    };

    const handlePointerUp = () => {
      setDraggingNoteId(null);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [draggingNoteId, onUpdateNote]);

  const handleArrangeClick = () => {
    const width = canvasRef.current?.clientWidth || window.innerWidth;
    onAutoArrange?.(width);
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (e.target !== canvasRef.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !canvasRef.current) return;
    const x = Math.max(20, Math.round(e.clientX - rect.left + canvasRef.current.scrollLeft - 140));
    const y = Math.max(20, Math.round(e.clientY - rect.top + canvasRef.current.scrollTop - 40));
    onNewNoteAt?.({ x, y });
  };

  return (
    <div
      ref={canvasRef}
      onDoubleClick={handleCanvasDoubleClick}
      className="relative w-full min-h-[calc(100vh-140px)] min-w-full bg-paper-grid overflow-auto p-4 sm:p-8 select-none"
    >
      {/* Canvas Utility Bar */}
      {notes.length > 1 && (
        <div className="sticky top-2 z-20 flex justify-end mb-2 pointer-events-none">
          <button
            onClick={handleArrangeClick}
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream-50/90 hover:bg-white text-stone-700 text-xs font-semibold shadow-md border border-cream-300 backdrop-blur-xs transition transform hover:scale-105 active:scale-95"
            title="Auto-arrange sticky notes to fit screen"
          >
            <Sparkles className="w-3.5 h-3.5 text-crimson-600" />
            <span>Auto-arrange notes</span>
          </button>
        </div>
      )}

      {notes.map((note) => (
        <StickyNote
          key={note.id}
          note={note}
          isCanvasMode={true}
          onUpdate={onUpdateNote}
          onDelete={onDeleteNote}
          onFloatOverlay={onFloatOverlay}
          onDuplicate={onDuplicateNote}
          onTagClick={onTagClick}
          onBringToFront={onBringToFront}
          onDragStart={handleDragStart}
        />
      ))}

      {notes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 select-none p-4 text-center">
          <p className="text-sm font-medium">No sticky notes match this view.</p>
          <p className="text-xs mt-1">Tap "+ New Note" in the header to stick one up!</p>
        </div>
      )}
    </div>
  );
};

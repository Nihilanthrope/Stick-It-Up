import React, { useState, useRef, useEffect } from 'react';
import { Note } from '../lib/notes/types';
import { StickyNote } from './StickyNote';
import { Sparkles } from 'lucide-react';
import emptyIllustration from '../assets/stickup-empty.svg';

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

  // On mobile screens, automatically arrange if notes are positioned beyond right screen edge
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isMobile = window.innerWidth < 640;
    if (!isMobile || notes.length <= 1) return;

    const hasOffscreenNotes = notes.some(
      (n) => n.position.x > window.innerWidth - 80
    );
    if (hasOffscreenNotes) {
      onAutoArrange?.(window.innerWidth);
    }
  }, []);

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
      className="relative w-full min-h-[calc(100vh-140px)] min-w-full bg-paper-grid overflow-auto p-3 sm:p-8 select-none"
    >
      {/* Floating Canvas Fit Utility Button */}
      {notes.length > 1 && (
        <button
          onClick={handleArrangeClick}
          className="absolute top-2.5 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream-50/95 hover:bg-white text-stone-700 text-xs font-semibold shadow-md border border-cream-300 backdrop-blur-xs transition transform active:scale-95 touch-manipulation"
          title="Auto-arrange sticky notes to fit screen"
        >
          <Sparkles className="w-3.5 h-3.5 text-crimson-600" />
          <span>Fit notes to screen</span>
        </button>
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
        <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 select-none p-6 text-center">
          <img src={emptyIllustration} alt="Stack of colorful sticky notes" className="w-56 sm:w-72 max-w-[70vw] mb-5 drop-shadow-sm" />
          <p className="text-base sm:text-lg font-bold text-stone-700">Nothing stuck here yet.</p>
          <p className="text-xs sm:text-sm mt-1 max-w-xs leading-relaxed">Double-click the canvas or use New Note to put your first thought on the wall.</p>
        </div>
      )}
    </div>
  );
};

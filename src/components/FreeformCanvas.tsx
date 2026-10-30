import React, { useState, useRef, useEffect } from 'react';
import { Note } from '../lib/notes/types';
import { StickyNote } from './StickyNote';

interface FreeformCanvasProps {
  notes: Note[];
  onUpdateNote: (id: string, patch: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  onFloatOverlay: (id: string) => void;
  onBringToFront: (id: string) => void;
}

export const FreeformCanvas: React.FC<FreeformCanvasProps> = ({
  notes,
  onUpdateNote,
  onDeleteNote,
  onFloatOverlay,
  onBringToFront,
}) => {
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.stopPropagation();
    onBringToFront(id);
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragOffset.current = {
      x: clientX - note.position.x,
      y: clientY - note.position.y,
    };
    setDraggingNoteId(id);
  };

  useEffect(() => {
    if (!draggingNoteId) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const newX = Math.max(10, clientX - dragOffset.current.x);
      const newY = Math.max(10, clientY - dragOffset.current.y);

      onUpdateNote(draggingNoteId, {
        position: { x: Math.round(newX), y: Math.round(newY) },
      });
    };

    const handlePointerUp = () => {
      setDraggingNoteId(null);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [draggingNoteId, onUpdateNote]);

  return (
    <div className="relative w-full min-h-[calc(100vh-120px)] bg-paper-grid overflow-auto p-8">
      {notes.map((note) => (
        <StickyNote
          key={note.id}
          note={note}
          isCanvasMode={true}
          onUpdate={onUpdateNote}
          onDelete={onDeleteNote}
          onFloatOverlay={onFloatOverlay}
          onBringToFront={onBringToFront}
          onDragStart={handleDragStart}
        />
      ))}

      {notes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 select-none">
          <p className="text-sm font-medium">No sticky notes match this view.</p>
          <p className="text-xs mt-1">Click "+ New Note" in the header to stick one up!</p>
        </div>
      )}
    </div>
  );
};

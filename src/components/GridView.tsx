import React from 'react';
import { Note } from '../lib/notes/types';
import { StickyNote } from './StickyNote';
import emptyIllustration from '../assets/stickup-empty.svg';

interface GridViewProps {
  notes: Note[];
  onUpdateNote: (id: string, patch: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  onFloatOverlay: (id: string) => void;
  onDuplicateNote?: (id: string) => void;
  onTagClick?: (tag: string) => void;
}

export const GridView: React.FC<GridViewProps> = ({
  notes,
  onUpdateNote,
  onDeleteNote,
  onFloatOverlay,
  onDuplicateNote,
  onTagClick,
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-3 py-4 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 justify-items-center">
        {notes.map((note) => (
          <StickyNote
            key={note.id}
            note={note}
            isCanvasMode={false}
            onUpdate={onUpdateNote}
            onDelete={onDeleteNote}
            onFloatOverlay={onFloatOverlay}
            onDuplicate={onDuplicateNote}
            onTagClick={onTagClick}
          />
        ))}
      </div>

      {notes.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-10 sm:py-16 px-5 text-stone-400">
          <img src={emptyIllustration} alt="Stack of colorful sticky notes" className="w-52 sm:w-64 max-w-[80vw] mb-4 drop-shadow-sm" />
          <p className="text-base sm:text-lg font-bold text-stone-700">Your board is ready.</p>
          <p className="text-xs sm:text-sm mt-1 max-w-sm leading-relaxed">Create a note, pin a thought, or start a checklist. Everything stays on this device.</p>
        </div>
      )}
    </div>
  );
};

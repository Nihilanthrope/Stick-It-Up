import React from 'react';
import { Note } from '../lib/notes/types';
import { StickyNote } from './StickyNote';

interface GridViewProps {
  notes: Note[];
  onUpdateNote: (id: string, patch: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  onFloatOverlay: (id: string) => void;
}

export const GridView: React.FC<GridViewProps> = ({
  notes,
  onUpdateNote,
  onDeleteNote,
  onFloatOverlay,
}) => {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
        {notes.map((note) => (
          <StickyNote
            key={note.id}
            note={note}
            isCanvasMode={false}
            onUpdate={onUpdateNote}
            onDelete={onDeleteNote}
            onFloatOverlay={onFloatOverlay}
          />
        ))}
      </div>

      {notes.length === 0 && (
        <div className="text-center py-16 text-stone-400">
          <p className="text-base font-medium">No sticky notes found.</p>
          <p className="text-xs mt-1">Use the "+ New Note" button to add your thoughts.</p>
        </div>
      )}
    </div>
  );
};

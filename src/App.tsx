import React, { useState, useEffect, useMemo } from 'react';
import { Note, NoteFilter } from './lib/notes/types';
import { getNotesStore } from './lib/notes/store';
import { getOverlayController } from './lib/overlay/controller';
import { OverlayState } from './lib/overlay/types';
import { Header } from './components/Header';
import { FreeformCanvas } from './components/FreeformCanvas';
import { GridView } from './components/GridView';
import { SettingsModal } from './components/SettingsModal';
import { FloatingOverlayView } from './views/FloatingOverlayView';

export function App() {
  const store = getNotesStore();
  const controller = getOverlayController();

  // Check if we are running in the standalone overlay window
  const isOverlayWindow = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('mode') === 'overlay' || window.location.hash === '#overlay';
  }, []);

  const [notes, setNotes] = useState<Note[]>(() => store.getNotes());
  const [overlayState, setOverlayState] = useState<OverlayState>(() => controller.getState());
  const [viewMode, setViewMode] = useState<'canvas' | 'grid'>('canvas');
  const [filter, setFilter] = useState<NoteFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Subscribe to notes store and overlay controller
  useEffect(() => {
    const unsubStore = store.subscribe((updatedNotes) => {
      setNotes(updatedNotes);
    });

    const unsubController = controller.subscribe((state) => {
      setOverlayState(state);
    });

    return () => {
      unsubStore();
      unsubController();
    };
  }, [store, controller]);

  // If this window is dedicated to the floating overlay, render overlay view
  if (isOverlayWindow) {
    return <FloatingOverlayView />;
  }

  // Filter notes based on active filter and search query
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // Archive filter
      if (filter === 'archived') {
        if (!note.isArchived) return false;
      } else {
        if (note.isArchived) return false;
      }

      // Specific view filter
      if (filter === 'pinned' && !note.isPinned) return false;
      if (filter === 'checklists' && (!note.checklist || note.checklist.length === 0)) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(query);
        const matchesContent = note.content.toLowerCase().includes(query);
        const matchesChecklist = note.checklist.some((item) =>
          item.text.toLowerCase().includes(query)
        );
        const matchesTags = note.tags.some((tag) => tag.toLowerCase().includes(query));
        if (!matchesTitle && !matchesContent && !matchesChecklist && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [notes, filter, searchQuery]);

  const handleNewNote = () => {
    const newNote = store.createNote({
      title: 'New Thought 📌',
      content: '',
      color: 'cream',
    });
  };

  const handleUpdateNote = (id: string, patch: Partial<Note>) => {
    store.updateNote(id, patch);
  };

  const handleDeleteNote = (id: string) => {
    store.deleteNote(id);
  };

  const handleBringToFront = (id: string) => {
    store.bringToFront(id);
  };

  const handleFloatOverlay = async (noteId: string) => {
    await controller.show(noteId);
  };

  const handleQuickOverlay = async () => {
    await controller.toggle();
  };

  return (
    <div className="flex flex-col min-h-screen bg-cream-100 font-sans selection:bg-crimson-200 selection:text-crimson-900">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filter={filter}
        onFilterChange={setFilter}
        onNewNote={handleNewNote}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onQuickOverlay={handleQuickOverlay}
        overlayActive={overlayState.visible}
        totalNotes={notes.filter((n) => !n.isArchived).length}
      />

      <main className="flex-grow">
        {viewMode === 'canvas' ? (
          <FreeformCanvas
            notes={filteredNotes}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            onFloatOverlay={handleFloatOverlay}
            onBringToFront={handleBringToFront}
          />
        ) : (
          <GridView
            notes={filteredNotes}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            onFloatOverlay={handleFloatOverlay}
          />
        )}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        notes={notes}
        overlayState={overlayState}
        overlayController={controller}
      />
    </div>
  );
}

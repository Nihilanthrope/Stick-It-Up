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
import { getPlatformCapabilities } from './lib/platform/capabilities';
import { Plus } from 'lucide-react';

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
  
  // Default to canvas mode so notes float freely and can be dragged anywhere
  const [viewMode, setViewMode] = useState<'canvas' | 'grid'>('canvas');

  const [filter, setFilter] = useState<NoteFilter>('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [defaultColor, setDefaultColor] = useState<string>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('stick_up_default_color') || 'cream';
    }
    return 'cream';
  });

  // Save default color preference
  const handleDefaultColorChange = (color: string) => {
    setDefaultColor(color);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('stick_up_default_color', color);
    }
  };

  // Subscribe to notes store and overlay controller
  useEffect(() => {
    const unsubStore = store.subscribe((updatedNotes) => {
      setNotes([...updatedNotes]);
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

  // Filter notes based on active filter, tag, and search query
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
      if (filter === 'reminders' && !note.reminder) return false;

      // Active Tag Filter
      if (activeTag) {
        if (!note.tags.includes(activeTag)) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
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
  }, [notes, filter, activeTag, searchQuery]);

  const handleNewNote = () => {
    handleNewNoteAt();
  };

  const handleNewNoteAt = (position?: { x: number; y: number }) => {
    // If viewing archive or tag, switch back to 'all' so new note is visible!
    if (filter === 'archived') {
      setFilter('all');
    }
    setActiveTag(null);

    const newNote = store.createNote({
      title: 'New Thought 📌',
      content: '',
      color: defaultColor,
      ...(position ? { position } : {}),
    });
    store.bringToFront(newNote.id);
  };

  const handleUpdateNote = (id: string, patch: Partial<Note>) => {
    store.updateNote(id, patch);
  };

  const handleDeleteNote = (id: string) => {
    store.deleteNote(id);
  };

  const handleDuplicateNote = (id: string) => {
    store.duplicateNote(id);
  };

  const handleBringToFront = (id: string) => {
    store.bringToFront(id);
  };

  const handleAutoArrange = (width: number) => {
    store.autoArrangePositions(width);
  };

  const handleFloatOverlay = async (noteId: string) => {
    await controller.show(noteId);
  };

  const handleQuickOverlay = async () => {
    if (!getPlatformCapabilities().supportsNativeOverlay) {
      setIsSettingsOpen(true);
      return;
    }

    if (!overlayState.visible && !notes.some((note) => !note.isArchived)) {
      const newNote = store.createOverlayNote({
        title: 'Quick Sticky',
        content: '',
        color: defaultColor,
      });
      await controller.show(newNote.id);
      return;
    }

    await controller.toggle();
  };

  // Counts for filter pills
  const activeNotes = notes.filter((n) => !n.isArchived);
  const totalNotesCount = activeNotes.length;
  const pinnedCount = activeNotes.filter((n) => n.isPinned).length;
  const checklistCount = activeNotes.filter((n) => n.checklist.length > 0).length;
  const reminderCount = activeNotes.filter((n) => Boolean(n.reminder)).length;
  const archivedCount = notes.filter((n) => n.isArchived).length;

  return (
    <div className="flex flex-col min-h-screen bg-cream-100 font-sans selection:bg-crimson-200 selection:text-crimson-900">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filter={filter}
        onFilterChange={(f) => {
          setFilter(f);
          setActiveTag(null);
        }}
        activeTag={activeTag}
        onClearTag={() => setActiveTag(null)}
        onNewNote={handleNewNote}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onQuickOverlay={handleQuickOverlay}
        overlayActive={overlayState.visible}
        totalNotes={totalNotesCount}
        pinnedCount={pinnedCount}
        checklistCount={checklistCount}
        reminderCount={reminderCount}
        archivedCount={archivedCount}
      />

      <main className="flex-grow relative">
        {viewMode === 'canvas' ? (
          <FreeformCanvas
            notes={filteredNotes}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            onFloatOverlay={handleFloatOverlay}
            onDuplicateNote={handleDuplicateNote}
            onTagClick={(t) => setActiveTag(t)}
            onBringToFront={handleBringToFront}
            onAutoArrange={handleAutoArrange}
            onNewNoteAt={handleNewNoteAt}
          />
        ) : (
          <GridView
            notes={filteredNotes}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            onFloatOverlay={handleFloatOverlay}
            onDuplicateNote={handleDuplicateNote}
            onTagClick={(t) => setActiveTag(t)}
          />
        )}
      </main>

      {/* Mobile Floating Action Button (FAB) for quick note creation */}
      <button
        onClick={handleNewNote}
        className="md:hidden fixed bottom-5 right-5 z-30 w-12 h-12 rounded-full bg-crimson-600 hover:bg-crimson-700 active:scale-95 text-cream-50 shadow-lg flex items-center justify-center transition-transform"
        title="Add Sticky Note"
        aria-label="Add Sticky Note"
      >
        <Plus className="w-6 h-6" />
      </button>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        notes={notes}
        store={store}
        overlayState={overlayState}
        overlayController={controller}
        defaultColor={defaultColor}
        onDefaultColorChange={handleDefaultColorChange}
      />
    </div>
  );
}

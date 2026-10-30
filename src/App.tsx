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
import { Plus, LayoutGrid, Layers, Settings, Pin } from 'lucide-react';

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
  
  // Use the organized grid on phones by default; keep canvas as the desktop workspace.
  const [viewMode, setViewMode] = useState<'canvas' | 'grid'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stick_up_view_mode');
      if (saved === 'canvas' || saved === 'grid') return saved;
      return window.innerWidth < 768 ? 'grid' : 'canvas';
    }
    return 'canvas';
  });

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

  // Persist the preferred workspace and keep it responsive when the window changes size.
  useEffect(() => {
    localStorage.setItem('stick_up_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && viewMode === 'canvas') {
        setViewMode('grid');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

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

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const defaultPos = isMobile
      ? { x: 16, y: Math.max(20, (notes.length % 5) * 50 + 20) }
      : undefined;

    const newNote = store.createNote({
      title: 'New Thought 📌',
      content: '',
      color: defaultColor,
      ...(position ? { position } : (defaultPos ? { position: defaultPos } : {})),
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

      <main className="flex-grow relative pb-28 md:pb-8">
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

      {/* Mobile workspace dock: ergonomic one-thumb access */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 bg-cream-50/95 backdrop-blur-xl border-t border-cream-300/80 shadow-[0_-8px_30px_rgba(64,44,24,0.08)]">
        <div className="max-w-md mx-auto flex items-center justify-around px-2">
          {/* Notes (Grid Cards) */}
          <button
            onClick={() => setViewMode('grid')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[11px] font-semibold transition touch-manipulation ${
              viewMode === 'grid'
                ? 'text-crimson-700 bg-cream-200/80 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
            aria-label="Grid view"
          >
            <LayoutGrid className="w-5 h-5" />
            <span>Cards</span>
          </button>

          {/* Canvas View */}
          <button
            onClick={() => setViewMode('canvas')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[11px] font-semibold transition touch-manipulation ${
              viewMode === 'canvas'
                ? 'text-crimson-700 bg-cream-200/80 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
            aria-label="Canvas view"
          >
            <Layers className="w-5 h-5" />
            <span>Canvas</span>
          </button>

          {/* Center Elevated Quick Create Button */}
          <button
            onClick={handleNewNote}
            className="flex items-center justify-center w-12 h-12 -mt-5 rounded-full bg-crimson-600 hover:bg-crimson-700 active:scale-90 text-cream-50 shadow-lg ring-4 ring-cream-100 transition transform touch-manipulation"
            title="Create Sticky Note"
            aria-label="Create Sticky Note"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* Filter / Search Indicator or Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[11px] font-semibold text-stone-500 hover:text-stone-800 transition touch-manipulation"
            aria-label="Open settings"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </div>
      </nav>

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

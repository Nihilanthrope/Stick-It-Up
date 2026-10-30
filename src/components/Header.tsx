import React from 'react';
import { 
  Pin, 
  Search, 
  Plus, 
  LayoutGrid, 
  Layers, 
  Settings, 
  Archive, 
  CheckSquare, 
  Bell,
  Layers2, 
  X,
  Tag
} from 'lucide-react';
import { NoteFilter } from '../lib/notes/types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: 'canvas' | 'grid';
  onViewModeChange: (mode: 'canvas' | 'grid') => void;
  filter: NoteFilter;
  onFilterChange: (f: NoteFilter) => void;
  activeTag: string | null;
  onClearTag: () => void;
  onNewNote: () => void;
  onOpenSettings: () => void;
  onQuickOverlay: () => void;
  overlayActive: boolean;
  totalNotes: number;
  pinnedCount: number;
  checklistCount: number;
  reminderCount: number;
  archivedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  filter,
  onFilterChange,
  activeTag,
  onClearTag,
  onNewNote,
  onOpenSettings,
  onQuickOverlay,
  overlayActive,
  totalNotes,
  pinnedCount,
  checklistCount,
  reminderCount,
  archivedCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-cream-300/80 px-3 py-2.5 sm:px-6 sm:py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        {/* Top Bar: Brand + Actions */}
        <div className="flex items-center justify-between gap-2">
          {/* Brand */}
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-crimson-600 text-cream-50 flex items-center justify-center shadow-md rotate-[-4deg] transition-transform hover:rotate-0 shrink-0">
              <Pin className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-sm sm:text-lg font-bold tracking-tight text-stone-900 flex items-center gap-1 font-sans">
                <span>Stick Up Notes</span>
                <span className="text-[9px] sm:text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-crimson-100 text-crimson-700 tracking-wider">
                  Native
                </span>
              </h1>
              <p className="hidden md:block text-xs text-stone-500 font-medium">Cream × Crimson sticky-note board</p>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden sm:block relative flex-grow max-w-xs sm:max-w-md mx-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search notes, checklists, #tags..."
              className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-cream-50 border border-cream-300 rounded-full focus:outline-none focus:ring-2 focus:ring-crimson-500/40 focus:border-crimson-600 transition placeholder:text-stone-400 text-stone-800 shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-black/10 text-stone-400 hover:text-stone-700"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Actions & View Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* View Mode Toggle: Clear segmented control */}
            <div className="flex items-center bg-cream-200 p-0.5 rounded-lg border border-cream-300/80 shadow-xs">
              <button
                onClick={() => onViewModeChange('canvas')}
                className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md transition touch-manipulation ${
                  viewMode === 'canvas'
                    ? 'bg-cream-50 text-crimson-700 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Freeform Canvas"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="text-[11px] sm:text-xs">Canvas</span>
              </button>
              <button
                onClick={() => onViewModeChange('grid')}
                className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md transition touch-manipulation ${
                  viewMode === 'grid'
                    ? 'bg-cream-50 text-crimson-700 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="text-[11px] sm:text-xs">Grid</span>
              </button>
            </div>

            {/* Quick Floating Overlay Toggle (Desktop & Tablet) */}
            <button
              onClick={onQuickOverlay}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition ${
                overlayActive
                  ? 'bg-crimson-100 text-crimson-800 border-crimson-300 shadow-xs'
                  : 'bg-cream-50 text-stone-700 border-cream-300 hover:bg-cream-200/60'
              }`}
              title="Toggle Floating Sticky Note Overlay"
            >
              <Layers2 className="w-3.5 h-3.5 text-crimson-600 shrink-0" />
              <span className="hidden lg:inline">Floating Overlay</span>
              {overlayActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-crimson-600 animate-pulse" />
              )}
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 sm:p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-cream-200 border border-transparent hover:border-cream-300 transition touch-manipulation"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* New Note Button (Desktop) */}
            <button
              onClick={onNewNote}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-crimson-600 hover:bg-crimson-700 text-cream-50 text-xs font-semibold rounded-lg shadow-sm transition transform active:scale-95 touch-manipulation"
              title="New Sticky Note"
            >
              <Plus className="w-4 h-4" />
              <span>New Note</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar: Dedicated row on mobile for effortless tapping */}
        <div className="sm:hidden relative w-full pt-0.5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes, checklists, #tags..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-cream-50 border border-cream-300 rounded-full focus:outline-none focus:ring-2 focus:ring-crimson-500/40 focus:border-crimson-600 transition placeholder:text-stone-400 text-stone-800 shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/10 text-stone-400 hover:text-stone-700 touch-manipulation"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Chips Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs pt-1 pb-0.5">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition ${
              filter === 'all' && !activeTag
                ? 'bg-stone-900 text-cream-50 shadow-xs'
                : 'bg-cream-200 text-stone-600 hover:bg-cream-300/70'
            }`}
          >
            All Notes ({totalNotes})
          </button>
          <button
            onClick={() => onFilterChange('pinned')}
            className={`px-3 py-1 rounded-full font-medium flex items-center gap-1 whitespace-nowrap transition ${
              filter === 'pinned'
                ? 'bg-crimson-600 text-cream-50 shadow-xs'
                : 'bg-cream-200 text-stone-600 hover:bg-cream-300/70'
            }`}
          >
            <Pin className="w-3 h-3" />
            Pinned ({pinnedCount})
          </button>
          <button
            onClick={() => onFilterChange('checklists')}
            className={`px-3 py-1 rounded-full font-medium flex items-center gap-1 whitespace-nowrap transition ${
              filter === 'checklists'
                ? 'bg-amber-600 text-cream-50 shadow-xs'
                : 'bg-cream-200 text-stone-600 hover:bg-cream-300/70'
            }`}
          >
            <CheckSquare className="w-3 h-3" />
            Checklists ({checklistCount})
          </button>
          <button
            onClick={() => onFilterChange('reminders')}
            className={`px-3 py-1 rounded-full font-medium flex items-center gap-1 whitespace-nowrap transition ${
              filter === 'reminders'
                ? 'bg-blue-600 text-cream-50 shadow-xs'
                : 'bg-cream-200 text-stone-600 hover:bg-cream-300/70'
            }`}
          >
            <Bell className="w-3 h-3" />
            Reminders ({reminderCount})
          </button>
          <button
            onClick={() => onFilterChange('archived')}
            className={`px-3 py-1 rounded-full font-medium flex items-center gap-1 whitespace-nowrap transition ${
              filter === 'archived'
                ? 'bg-stone-600 text-cream-50 shadow-xs'
                : 'bg-cream-200 text-stone-600 hover:bg-cream-300/70'
            }`}
          >
            <Archive className="w-3 h-3" />
            Archive ({archivedCount})
          </button>

          {/* Active Tag Filter Indicator */}
          {activeTag && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-crimson-100 text-crimson-800 font-semibold text-xs border border-crimson-200 whitespace-nowrap animate-in fade-in">
              <Tag className="w-3 h-3" />
              #{activeTag}
              <button
                onClick={onClearTag}
                className="hover:text-crimson-950 p-0.5 rounded-full hover:bg-crimson-200"
                title="Clear tag filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

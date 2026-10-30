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
  Layers2, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { NoteFilter } from '../lib/notes/types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: 'canvas' | 'grid';
  onViewModeChange: (mode: 'canvas' | 'grid') => void;
  filter: NoteFilter;
  onFilterChange: (f: NoteFilter) => void;
  onNewNote: () => void;
  onOpenSettings: () => void;
  onQuickOverlay: () => void;
  overlayActive: boolean;
  totalNotes: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  filter,
  onFilterChange,
  onNewNote,
  onOpenSettings,
  onQuickOverlay,
  overlayActive,
  totalNotes,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-cream-300/80 px-4 py-3 sm:px-6 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand identity: Cream × Crimson */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-crimson-600 text-cream-50 flex items-center justify-center shadow-md rotate-[-4deg] transition-transform hover:rotate-0">
              <Pin className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-stone-900 flex items-center gap-1.5 font-sans">
                Stick Up Notes
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-crimson-100 text-crimson-700 tracking-wider">
                  Native
                </span>
              </h1>
              <p className="text-xs text-stone-500 font-medium">Cream × Crimson sticky-note board</p>
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              onClick={onNewNote}
              className="p-2 rounded-lg bg-crimson-600 text-cream-50 hover:bg-crimson-700 shadow-sm"
              title="New Note"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg text-stone-600 hover:bg-cream-200"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes, checklists, tags..."
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-cream-50 border border-cream-300 rounded-full focus:outline-none focus:ring-2 focus:ring-crimson-500/40 focus:border-crimson-600 transition placeholder:text-stone-400 text-stone-800 shadow-inner"
          />
        </div>

        {/* View Mode & Actions */}
        <div className="hidden md:flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-cream-200 p-1 rounded-lg border border-cream-300/70">
            <button
              onClick={() => onViewModeChange('canvas')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition ${
                viewMode === 'canvas'
                  ? 'bg-cream-50 text-crimson-700 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Freeform Canvas"
            >
              <Layers className="w-3.5 h-3.5" />
              Canvas
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition ${
                viewMode === 'grid'
                  ? 'bg-cream-50 text-crimson-700 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Grid
            </button>
          </div>

          {/* Quick Floating Overlay Toggle */}
          <button
            onClick={onQuickOverlay}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
              overlayActive
                ? 'bg-crimson-100 text-crimson-800 border-crimson-300 shadow-sm'
                : 'bg-cream-50 text-stone-700 border-cream-300 hover:bg-cream-200/60'
            }`}
            title="Toggle Floating Sticky Note Overlay"
          >
            <Layers2 className="w-3.5 h-3.5 text-crimson-600" />
            <span>Floating Overlay</span>
            {overlayActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-crimson-600 animate-pulse" />
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-cream-200 border border-transparent hover:border-cream-300 transition"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* New Note Button */}
          <button
            onClick={onNewNote}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-crimson-600 hover:bg-crimson-700 text-cream-50 text-xs font-semibold rounded-lg shadow transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 pt-2.5 overflow-x-auto no-scrollbar text-xs">
        <button
          onClick={() => onFilterChange('all')}
          className={`px-3 py-1 rounded-full font-medium transition ${
            filter === 'all'
              ? 'bg-stone-900 text-cream-50 shadow-sm'
              : 'bg-cream-200 text-stone-600 hover:bg-cream-300/60'
          }`}
        >
          All Notes ({totalNotes})
        </button>
        <button
          onClick={() => onFilterChange('pinned')}
          className={`px-3 py-1 rounded-full font-medium flex items-center gap-1 transition ${
            filter === 'pinned'
              ? 'bg-crimson-600 text-cream-50 shadow-sm'
              : 'bg-cream-200 text-stone-600 hover:bg-cream-300/60'
          }`}
        >
          <Pin className="w-3 h-3" />
          Pinned
        </button>
        <button
          onClick={() => onFilterChange('checklists')}
          className={`px-3 py-1 rounded-full font-medium flex items-center gap-1 transition ${
            filter === 'checklists'
              ? 'bg-amber-600 text-cream-50 shadow-sm'
              : 'bg-cream-200 text-stone-600 hover:bg-cream-300/60'
          }`}
        >
          <CheckSquare className="w-3 h-3" />
          Checklists
        </button>
        <button
          onClick={() => onFilterChange('archived')}
          className={`px-3 py-1 rounded-full font-medium flex items-center gap-1 transition ${
            filter === 'archived'
              ? 'bg-stone-600 text-cream-50 shadow-sm'
              : 'bg-cream-200 text-stone-600 hover:bg-cream-300/60'
          }`}
        >
          <Archive className="w-3 h-3" />
          Archive
        </button>
      </div>
    </header>
  );
};

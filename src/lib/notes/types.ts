export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export type NoteColor =
  | 'yellow'
  | 'cream'
  | 'mint'
  | 'blue'
  | 'pink'
  | 'lavender'
  | 'peach'
  | 'matcha'
  | 'kraft'
  | 'dark'
  | 'electric-red'
  | 'forest'
  | 'midnight'
  | 'paper'
  | 'terracotta'
  | 'sage';

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  isArchived: boolean;
  position: { x: number; y: number };
  zIndex: number;
  checklist: ChecklistItem[];
  reminder: string | null;
  tags: string[];
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NoteFilter = 'all' | 'pinned' | 'checklists' | 'reminders' | 'archived';

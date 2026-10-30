export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export type NoteColor =
  | 'cream'
  | 'yellow'
  | 'mint'
  | 'lavender'
  | 'pink'
  | 'sky'
  | 'velvet';

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
  createdAt: string;
  updatedAt: string;
}

export type NoteFilter = 'all' | 'pinned' | 'checklists' | 'reminders' | 'archived';

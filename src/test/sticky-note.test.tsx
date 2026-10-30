import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { StickyNote } from '../components/StickyNote';
import { Note } from '../lib/notes/types';

describe('StickyNote Component', () => {
  const mockNote: Note = {
    id: 'note-test-1',
    title: 'Test Sticky Note',
    content: 'Some thoughts here',
    color: 'cream',
    isPinned: false,
    isArchived: false,
    position: { x: 50, y: 50 },
    zIndex: 1,
    checklist: [
      { id: 'c1', text: 'First task', completed: false },
      { id: 'c2', text: 'Second task', completed: true },
    ],
    reminder: null,
    tags: ['design', 'v1'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('renders title, content, checklist items, and tags', () => {
    const onUpdate = vi.fn();
    const onDelete = vi.fn();
    const onFloat = vi.fn();

    render(
      <StickyNote
        note={mockNote}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onFloatOverlay={onFloat}
      />
    );

    expect(screen.getByDisplayValue('Test Sticky Note')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Some thoughts here')).toBeInTheDocument();
    expect(screen.getByText('First task')).toBeInTheDocument();
    expect(screen.getByText('Second task')).toBeInTheDocument();
    expect(screen.getByText('#design')).toBeInTheDocument();
    expect(screen.getByText('#v1')).toBeInTheDocument();
  });

  it('handles checklist toggling correctly', () => {
    const onUpdate = vi.fn();
    render(
      <StickyNote
        note={mockNote}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
        onFloatOverlay={vi.fn()}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(onUpdate).toHaveBeenCalledWith('note-test-1', {
      checklist: [
        { id: 'c1', text: 'First task', completed: true },
        { id: 'c2', text: 'Second task', completed: true },
      ],
    });
  });

  it('handles invalid datetime input gracefully without crashing', () => {
    const onUpdate = vi.fn();
    render(
      <StickyNote
        note={mockNote}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
        onFloatOverlay={vi.fn()}
      />
    );

    const reminderInput = screen.getByLabelText(/reminder date and time/i);
    // Invalid datetime input should not throw RangeError
    expect(() => {
      fireEvent.change(reminderInput, { target: { value: 'invalid-date' } });
    }).not.toThrow();
  });
});

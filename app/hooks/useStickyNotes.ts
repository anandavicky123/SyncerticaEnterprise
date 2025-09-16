"use client";

import { StickyNote } from "../shared/types/dashboard";

export const useStickyNotes = (
  stickyNotes: StickyNote[],
  setStickyNotes: React.Dispatch<React.SetStateAction<StickyNote[]>>
) => {
  const addStickyNote = (
    content: string,
    type: "text" | "checklist" = "text"
  ) => {
    const newNote: StickyNote = {
      id: Date.now(),
      content,
      type,
      x: Math.random() * 300,
      y: Math.random() * 300,
      color: type === "checklist" ? "#dcfce7" : "#fef3c7",
      items:
        type === "checklist"
          ? content
              .split("\n")
              .map((item) => ({ text: item, completed: false }))
          : [],
    };
    setStickyNotes([...stickyNotes, newNote]);
  };

  const toggleChecklistItem = (noteId: number, itemIndex: number) => {
    setStickyNotes((notes) =>
      notes.map((note) =>
        note.id === noteId
          ? {
              ...note,
              items: note.items.map((item, index) =>
                index === itemIndex
                  ? { ...item, completed: !item.completed }
                  : item
              ),
            }
          : note
      )
    );
  };

  const removeStickyNote = (id: number) => {
    setStickyNotes(stickyNotes.filter((note) => note.id !== id));
  };

  const updateNotePosition = (noteId: number, x: number, y: number) => {
    setStickyNotes((notes) =>
      notes.map((note) => (note.id === noteId ? { ...note, x, y } : note))
    );
  };

  return {
    addStickyNote,
    toggleChecklistItem,
    removeStickyNote,
    updateNotePosition,
  };
};

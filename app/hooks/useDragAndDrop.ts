"use client";

import React, { useState, useEffect } from "react";

interface DragState {
  draggedNote: number | null;
  dragOffset: { x: number; y: number };
}

export const useDragAndDrop = (
  updateNotePosition: (noteId: number, x: number, y: number) => void,
) => {
  const [dragState, setDragState] = useState<DragState>({
    draggedNote: null,
    dragOffset: { x: 0, y: 0 },
  });

  const handleMouseDown = (e: React.MouseEvent, noteId: number) => {
    const rect = e.currentTarget.getBoundingClientRect();

    setDragState({
      draggedNote: noteId,
      dragOffset: {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      },
    });

    e.preventDefault();
  };

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (dragState.draggedNote) {
        const dashboardContent = document.querySelector(".dashboard-content");
        if (!dashboardContent) return;

        const rect = dashboardContent.getBoundingClientRect();

        const newX = e.clientX - rect.left - dragState.dragOffset.x;
        const newY = e.clientY - rect.top - dragState.dragOffset.y;

        updateNotePosition(
          dragState.draggedNote,
          Math.max(0, Math.min(newX, rect.width - 192)),
          Math.max(0, Math.min(newY, rect.height - 128)),
        );
      }
    },
    [dragState.draggedNote, dragState.dragOffset, updateNotePosition],
  );

  const handleMouseUp = React.useCallback(() => {
    setDragState({
      draggedNote: null,
      dragOffset: { x: 0, y: 0 },
    });
  }, []);

  useEffect(() => {
    if (dragState.draggedNote) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragState.draggedNote, handleMouseMove, handleMouseUp]);

  return {
    draggedNote: dragState.draggedNote,
    handleMouseDown,
  };
};

import React from "react";
import { StickyNote } from "../shared/types/dashboard";

interface StickyNoteComponentProps {
  note: StickyNote;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent, noteId: number) => void;
  onRemove: (id: number) => void;
  onToggleChecklistItem: (noteId: number, itemIndex: number) => void;
}

const StickyNoteComponent: React.FC<StickyNoteComponentProps> = ({
  note,
  isDragging,
  onMouseDown,
  onRemove,
  onToggleChecklistItem,
}) => {
  return (
    <div
      className={`absolute w-48 h-32 border rounded-lg p-3 shadow-lg select-none ${
        isDragging ? "cursor-grabbing z-50" : "cursor-grab"
      } ${
        note.type === "checklist"
          ? "bg-green-100 border-green-300"
          : "bg-yellow-200 border-yellow-300"
      }`}
      style={{ left: note.x, top: note.y }}
      onMouseDown={(e) => onMouseDown(e, note.id)}
    >
      <button
        onClick={() => onRemove(note.id)}
        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 z-10"
      >
        ×
      </button>

      {note.type === "checklist" ? (
        <div className="text-sm text-gray-800 mt-2 pointer-events-none overflow-y-auto max-h-20">
          {note.items.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 mb-1 pointer-events-auto"
            >
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => onToggleChecklistItem(note.id, index)}
                className="w-3 h-3 text-green-600 rounded focus:ring-green-500 pointer-events-auto"
              />
              <span
                className={`text-xs ${
                  item.completed
                    ? "line-through text-gray-500"
                    : "text-gray-800"
                }`}
              >
                {item.text}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-800 mt-2 pointer-events-none overflow-y-auto max-h-20">
          {note.content}
        </div>
      )}
    </div>
  );
};

export default StickyNoteComponent;

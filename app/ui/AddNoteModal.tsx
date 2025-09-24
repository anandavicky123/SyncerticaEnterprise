"use client";

import React, { useState } from "react";

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNote: (content: string, type: "text" | "checklist") => void;
}

const AddNoteModal: React.FC<AddNoteModalProps> = ({
  isOpen,
  onClose,
  onAddNote,
}) => {
  const [noteType, setNoteType] = useState<"text" | "checklist">("text");

  if (!isOpen) return null;

  const handleSubmit = () => {
    const contentElement = document.getElementById(
      "noteContent",
    ) as HTMLTextAreaElement;
    const content = contentElement?.value;
    if (content?.trim()) {
      onAddNote(content, noteType);
      contentElement.value = "";
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-medium mb-4">Add Sticky Note</h3>

        {/* Note Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Note Type
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setNoteType("text")}
              className={`px-3 py-2 rounded-lg border ${
                noteType === "text"
                  ? "bg-yellow-100 border-yellow-300 text-yellow-800"
                  : "bg-gray-100 border-gray-300 text-gray-700"
              }`}
            >
              📝 Text Note
            </button>
            <button
              onClick={() => setNoteType("checklist")}
              className={`px-3 py-2 rounded-lg border ${
                noteType === "checklist"
                  ? "bg-green-100 border-green-300 text-green-800"
                  : "bg-gray-100 border-gray-300 text-gray-700"
              }`}
            >
              ✅ Checklist
            </button>
          </div>
        </div>

        <textarea
          className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={
            noteType === "checklist"
              ? "Enter checklist items (one per line):\n• Item 1\n• Item 2\n• Item 3"
              : "Enter your note..."
          }
          id="noteContent"
        />
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Note
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddNoteModal;

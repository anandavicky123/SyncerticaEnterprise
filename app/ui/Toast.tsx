"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export type ToastProps = {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
  onClose?: () => void;
};

export const Toast = ({
  message,
  type = "info",
  duration = 5000,
  onClose,
}: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const typeStyles = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    warning: "bg-yellow-500",
  };

  return (
    <div
      className={`fixed bottom-4 right-4 flex items-center p-4 mb-4 text-white rounded-lg ${typeStyles[type]} shadow-lg z-50`}
      role="alert"
    >
      <span className="sr-only">{type}</span>
      <div className="text-sm font-medium mr-6">{message}</div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 text-white rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-opacity-25 inline-flex items-center justify-center h-8 w-8"
        onClick={() => {
          setIsVisible(false);
          onClose?.();
        }}
        aria-label="Close"
      >
        <span className="sr-only">Close</span>
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

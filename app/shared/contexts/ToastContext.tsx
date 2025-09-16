"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Toast, ToastProps } from "../../ui/Toast";

type ToastContextType = {
  showToast: (props: Omit<ToastProps, "onClose">) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<(ToastProps & { id: number })[]>([]);
  let nextId = 0;

  const showToast = (props: Omit<ToastProps, "onClose">) => {
    const id = nextId++;
    setToasts((current) => [...current, { ...props, id }]);
  };

  const handleClose = (id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => handleClose(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

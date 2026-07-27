"use client";

import { useState, useCallback, useRef, createContext, useContext, ReactNode, useEffect } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextIdRef = useRef(0);
  const timeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: number) => {
    const timeout = timeoutsRef.current.get(id);
    if (timeout) clearTimeout(timeout);
    timeoutsRef.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++nextIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    const timeout = setTimeout(() => {
      removeToast(id);
    }, 4000);
    timeoutsRef.current.set(id, timeout);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-medium text-white backdrop-blur-sm animate-slide-in-right ${
              t.type === "success"
                ? "bg-emerald-500/95"
                : t.type === "error"
                ? "bg-red-500/95"
                : "bg-secondary/95"
            }`}
          >
            <span className="text-lg">
              {t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"}
            </span>
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="text-white/70 hover:text-white transition-colors ml-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

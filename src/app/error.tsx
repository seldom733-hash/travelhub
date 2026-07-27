"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">⚠️</div>
        <h1 className="text-2xl font-bold text-secondary mb-2">Что-то пошло не так</h1>
        <p className="text-gray-500 mb-6">
          Произошла непредвиденная ошибка. Пожалуйста, попробуйте ещё раз.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 mb-4 font-mono">Код ошибки: {error.digest}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="h-12 px-8 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98]"
          >
            🔄 Попробовать снова
          </button>
          <a
            href="/"
            className="h-12 px-8 border-2 border-gray-200 hover:border-primary text-secondary hover:text-primary rounded-xl font-bold transition-all text-center leading-12"
          >
            🏠 На главную
          </a>
        </div>
      </div>
    </div>
  );
}

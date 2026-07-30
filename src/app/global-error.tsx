"use client";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="ru">
      <body>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f9fafb",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
          <div style={{ textAlign: "center", maxWidth: "400px", padding: "2rem" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>⚠️</div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1f2937", marginBottom: "0.5rem" }}>
              Что-то пошло не так
            </h1>
            <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
              Произошла непредвиденная ошибка. Пожалуйста, попробуйте ещё раз.
            </p>
            {error.digest && (
              <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "1rem", fontFamily: "monospace" }}>
                Код ошибки: {error.digest}
              </p>
            )}
            <button
              onClick={() => unstable_retry()}
              style={{
                padding: "0.75rem 2rem",
                backgroundColor: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "0.75rem",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              🔄 Попробовать снова
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-gray-500 text-sm">Загрузка...</p>
      </div>
    </div>
  );
}

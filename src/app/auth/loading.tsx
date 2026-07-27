export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          <div className="space-y-4">
            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-12 bg-primary/20 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

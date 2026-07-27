export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="h-8 bg-gray-200 rounded w-40 animate-pulse mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

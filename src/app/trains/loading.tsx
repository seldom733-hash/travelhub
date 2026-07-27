export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      <div className="bg-gradient-to-r from-red-600 to-rose-500 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-8 bg-white/20 rounded w-48 animate-pulse mb-2" />
          <div className="h-4 bg-white/20 rounded w-64 animate-pulse" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search form skeleton */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
                <div className="h-12 bg-gray-200 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-24" />
              <div className="h-10 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

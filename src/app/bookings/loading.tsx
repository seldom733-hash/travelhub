export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-2" />
        <div className="h-4 bg-gray-200 rounded w-64 animate-pulse mb-6" />
        <div className="flex gap-2 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-9 bg-gray-200 rounded-full w-20 animate-pulse" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
              <div className="flex gap-4">
                <div className="w-40 h-32 bg-gray-200 rounded-xl hidden sm:block" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="grid grid-cols-4 gap-4 mt-4">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="space-y-1">
                        <div className="h-3 bg-gray-200 rounded w-12" />
                        <div className="h-4 bg-gray-200 rounded w-16" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

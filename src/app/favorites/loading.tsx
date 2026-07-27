export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-2" />
        <div className="h-4 bg-gray-200 rounded w-40 animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-2/3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="flex justify-between items-center mt-4">
                  <div className="h-6 bg-gray-200 rounded w-20" />
                  <div className="h-10 bg-primary/20 rounded-xl w-28" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

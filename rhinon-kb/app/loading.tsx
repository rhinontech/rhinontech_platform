export default function Loading() {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl space-y-8 animate-pulse">
                {/* Header Skeleton */}
                <div className="h-16 bg-gray-100 rounded-lg w-full mb-8"></div>

                {/* Hero Skeleton */}
                <div className="h-64 bg-gray-100 rounded-2xl w-full mb-12"></div>

                {/* Content Skeleton */}
                <div className="space-y-4">
                    <div className="h-8 bg-gray-100 rounded w-1/3 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-40 bg-gray-100 rounded-xl"></div>
                        <div className="h-40 bg-gray-100 rounded-xl"></div>
                        <div className="h-40 bg-gray-100 rounded-xl"></div>
                        <div className="h-40 bg-gray-100 rounded-xl"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

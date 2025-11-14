import Loading from '@/components/common/Loading'

/**
 * Instant Loading State for Feed Page
 */
export default function FeedLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="h-10 bg-gray-200 rounded w-32 mb-2 animate-pulse" />
          <div className="h-6 bg-gray-200 rounded w-64 animate-pulse" />
        </div>
        <Loading className="py-8" />
      </div>
    </div>
  )
}


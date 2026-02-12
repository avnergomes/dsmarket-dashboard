import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-primary-400 animate-spin mx-auto" />
        <p className="mt-4 text-dark-300 font-medium">Loading dashboard...</p>
      </div>
    </div>
  )
}

import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-primary-500 animate-spin mx-auto" />
        <p className="mt-4 text-slate-600 font-medium">Loading dashboard...</p>
      </div>
    </div>
  )
}

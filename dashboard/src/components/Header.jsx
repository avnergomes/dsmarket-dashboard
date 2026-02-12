import { ShoppingCart, BarChart3, TrendingUp, Boxes, Package } from 'lucide-react'

export default function Header() {
  return (
    <header className="gradient-header text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <ShoppingCart className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">DSMarket Analytics</h1>
              <p className="text-white/80 text-sm">End-to-End Retail Intelligence Platform</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 text-white/80">
              <BarChart3 className="h-5 w-5" />
              <span className="text-sm">Analysis</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Boxes className="h-5 w-5" />
              <span className="text-sm">Clustering</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm">Forecasting</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Package className="h-5 w-5" />
              <span className="text-sm">Replenishment</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

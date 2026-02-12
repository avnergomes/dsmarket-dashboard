import { Github, ExternalLink } from 'lucide-react'

export default function Footer({ lastUpdated }) {
  return (
    <footer className="bg-slate-800 text-white py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h3 className="font-semibold text-lg">DSMarket Analytics Dashboard</h3>
            <p className="text-slate-400 text-sm mt-1">
              Master's Final Project - International Master in Data Science
            </p>
            {lastUpdated && (
              <p className="text-slate-500 text-xs mt-2">
                Last updated: {lastUpdated}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <Github className="h-5 w-5" />
              <span className="text-sm">View Source</span>
            </a>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-6 pt-6">
          <p className="text-center text-slate-500 text-sm">
            Built with React, Recharts, and Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  )
}

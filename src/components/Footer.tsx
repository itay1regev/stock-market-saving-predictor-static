import { Link } from 'react-router-dom'
import Logo from './Logo'

type FooterLink = { label: string; to: string }
type FooterColumn = { id: string; heading: string; links: FooterLink[] }

const FOOTER_LINKS: readonly FooterColumn[] = [
  {
    id: 'tools',
    heading: 'Tools',
    links: [
      { label: 'Backtest Portfolio', to: '/backtest' },
      { label: 'US indicators', to: '/indicators/us' },
      { label: 'Israel indicators', to: '/indicators/israel' },
      { label: 'Germany indicators', to: '/indicators/germany' },
      { label: 'S&P 500 by index weight', to: '/us-stocks/sp500' },
      { label: 'Nasdaq 100 by index weight', to: '/us-stocks/nasdaq100' },
      { label: 'TA-125 by index weight', to: '/companies-by-weight/ta125' },
    ],
  },
  {
    id: 'etfs',
    heading: 'ETFs & Exposure',
    links: [
      { label: 'S&P 500 ETFs', to: '/etf/sp500' },
      { label: 'MSCI World ETFs', to: '/etf/msci-world' },
      { label: 'S&P 500 ETFs on TASE', to: '/etf/israel-sp500' },
      { label: 'Sector Exposure', to: '/etf/sector-exposure' },
      { label: 'MOR Israel TA-125 fund exposure', to: '/fund-exposure/mor-israel-ta125' },
    ],
  },
  {
    id: 'resources',
    heading: 'Resources',
    links: [
      { label: 'How to Invest', to: '/learn' },
      { label: 'News', to: '/news' },
      { label: 'Terms of Use & Disclaimer', to: '/terms' },
    ],
  },
]

function scrollToTop() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'instant' : 'smooth' })
}

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Row 1 — brand + link columns */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo />
            <p className="mt-3 text-sm text-slate-600">
              Tools and data pages for exploring portfolio backtests, ETFs and the Israeli market. For information and
              education only.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-1 gap-8 sm:col-span-2 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-3"
          >
            {FOOTER_LINKS.map((column) => {
              const headingId = `footer-${column.id}-heading`
              return (
                <div key={column.id}>
                  <h2 id={headingId} className="text-sm font-semibold text-slate-900">
                    {column.heading}
                  </h2>
                  <ul aria-labelledby={headingId} className="mt-3 space-y-2">
                    {column.links.map((link) => (
                      <li key={link.to}>
                        <Link
                          to={link.to}
                          className="inline-flex min-h-11 items-center text-sm text-slate-600 underline-offset-4 hover:text-indigo-700 hover:underline lg:min-h-0"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </nav>
        </div>

        {/* Row 3 — mandatory disclaimer (verbatim) */}
        <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs leading-relaxed text-slate-600">
            <strong className="font-semibold text-slate-700">Not investment advice.</strong> All content on this site
            is for informational and educational purposes only. It is not financial, investment, tax or legal advice and
            is not a recommendation to buy or sell any security. Data comes from third-party sources, is provided
            &quot;as is&quot; without any warranty of accuracy, completeness or timeliness, and may be delayed or wrong.
            You invest entirely at your own risk.
          </p>
          <Link to="/terms" className="mt-2 inline-block text-xs font-medium text-indigo-700 underline underline-offset-4">
            Terms of Use &amp; Disclaimer
          </Link>
        </div>

        {/* Row 4 — bottom bar */}
        <div className="mt-6 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} BacktestIQ. All rights reserved.</p>
          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex min-h-11 items-center self-start rounded-md font-medium text-slate-600 underline-offset-4 hover:text-indigo-700 hover:underline sm:self-auto"
          >
            Back to top
          </button>
        </div>
      </div>
    </footer>
  )
}

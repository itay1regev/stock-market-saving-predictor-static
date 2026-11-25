import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronIcon } from './icons'
import Logo from './Logo'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${
    isActive ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
  }`

const dropdownLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-4 py-2 text-sm ${isActive ? 'bg-slate-100 font-medium text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`

function NavDropdown({
  label,
  activePrefix,
  items,
}: {
  label: string
  activePrefix: string
  items: { to: string; label: string }[]
}) {
  const location = useLocation()
  const isActive = location.pathname.startsWith(activePrefix)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium ${
          isActive ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        {label}
        <ChevronIcon direction={open ? 'up' : 'down'} />
      </button>
      {open && (
        <div className="absolute left-0 z-10 mt-1 w-max min-w-44 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={(state) => `${dropdownLinkClass(state)} whitespace-nowrap`}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-2 px-4 py-3">
        <div className="flex flex-wrap items-center gap-1">
          <Logo className="mr-4" />
          <NavLink to="/backtest" className={linkClass}>
            Backtest Portfolio
          </NavLink>
          <NavDropdown
            label="Indicators"
            activePrefix="/indicators"
            items={[
              { to: '/indicators/us', label: 'US Indicators' },
              { to: '/indicators/israel', label: 'Israel Indicators' },
              { to: '/indicators/germany', label: 'Germany Indicators' },
            ]}
          />
          <NavDropdown
            label="ETF"
            activePrefix="/etf"
            items={[
              { to: '/etf/sp500', label: 'S&P 500 ETFs' },
              { to: '/etf/msci-world', label: 'MSCI World ETFs' },
              { to: '/etf/nasdaq100', label: 'Nasdaq 100 ETFs' },
              { to: '/etf/bond', label: 'Bond ETFs' },
              { to: '/etf/israel-sp500', label: 'S&P 500 ETF - Israel' },
              { to: '/etf/israel-nasdaq100', label: 'Nasdaq 100 ETF - Israel' },
              { to: '/etf/israel-msci-world', label: 'MSCI World - TASE (Israel)' },
              { to: '/etf/israel-ta125', label: 'TA 125 - TASE (Israel)' },
              { to: '/etf/ishares-tase', label: 'Ishares - TASE (Israel)' },
              { to: '/etf/sector-exposure', label: 'Sector Exposure' },
            ]}
          />
          <NavDropdown
            label="Companies by Index Weight"
            activePrefix="/companies-by-weight"
            items={[{ to: '/companies-by-weight/ta125', label: 'TA-125 companies by index weight' }]}
          />
          <NavDropdown
            label="REIT stocks"
            activePrefix="/reit-stocks"
            items={[
              { to: '/reit-stocks/1109644', label: 'סלע נדל"ן' },
              { to: '/reit-stocks/1098920', label: 'ריט 1' },
            ]}
          />
          <NavDropdown
            label="Mutual fund exposure analysis"
            activePrefix="/fund-exposure"
            items={[
              { to: '/fund-exposure/mor-israel-ta125', label: 'MOR ISRAEL TA-125' },
              { to: '/fund-exposure/yalin-lapidot-ta125-value', label: 'Yalin Lapidot TA 125 Value' },
            ]}
          />
          <NavLink to="/blog" className={linkClass}>
            Blog
          </NavLink>
        </div>
      </div>
    </nav>
  )
}

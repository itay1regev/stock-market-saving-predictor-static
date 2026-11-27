import { useCallback, useEffect, useRef, useState } from 'react'
import type { FocusEvent as ReactFocusEvent } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import Logo from './Logo'
import { ChevronIcon, CloseIcon } from './icons'

/* ------------------------------------------------------------------ */
/* Navigation data — desktop and mobile both render from NAV           */
/* ------------------------------------------------------------------ */

type NavLinkItem = { label: string; to: string; description?: string; lang?: 'he' }
type NavGroup = {
  heading?: string
  /** Hebrew fragment appended to the heading in parentheses, wrapped in <bdi>. */
  headingHe?: string
  items: NavLinkItem[]
}
type NavItem = {
  /** Stable slug used for element ids. */
  id: string
  label: string
  to?: string
  activePrefixes?: string[]
  groups?: NavGroup[]
  mega?: boolean
  /** Top-level label is Hebrew: wrap it in <bdi lang="he">. */
  lang?: 'he'
}

const NAV: readonly NavItem[] = [
  { id: 'backtest', label: 'Backtest', to: '/backtest', activePrefixes: ['/backtest'] },
  {
    id: 'economy',
    label: 'Economy',
    activePrefixes: ['/indicators'],
    groups: [
      {
        items: [
          { label: 'United States', to: '/indicators/us', description: 'GDP, prices, labour, housing, trade' },
          { label: 'Israel', to: '/indicators/israel', description: 'GDP, prices, labour, money, trade' },
          { label: 'Germany', to: '/indicators/germany', description: 'GDP, prices, business, trade' },
        ],
      },
    ],
  },
  {
    id: 'etfs',
    label: 'ETFs & Funds',
    activePrefixes: ['/etf', '/fund-exposure'],
    mega: true,
    groups: [
      {
        heading: 'US-listed ETFs',
        items: [
          { label: 'S&P 500 ETFs', to: '/etf/sp500' },
          { label: 'Nasdaq 100 ETFs', to: '/etf/nasdaq100' },
          { label: 'MSCI World ETFs', to: '/etf/msci-world' },
          { label: 'Bond ETFs', to: '/etf/bond' },
        ],
      },
      {
        heading: 'Israel (TASE) ETFs',
        items: [
          { label: 'S&P 500', to: '/etf/israel-sp500' },
          { label: 'Nasdaq 100', to: '/etf/israel-nasdaq100' },
          { label: 'MSCI World', to: '/etf/israel-msci-world' },
          { label: 'TA-125', to: '/etf/israel-ta125' },
          { label: 'iShares', to: '/etf/ishares-tase' },
        ],
      },
      {
        heading: 'Exposure analysis',
        items: [
          { label: 'Sector Exposure', to: '/etf/sector-exposure' },
          { label: 'MOR Israel TA-125', to: '/fund-exposure/mor-israel-ta125' },
          { label: 'Yalin Lapidot TA-125 Value', to: '/fund-exposure/yalin-lapidot-ta125-value' },
        ],
      },
    ],
  },
  {
    id: 'us-stocks',
    label: 'US Stocks',
    activePrefixes: ['/us-stocks'],
    groups: [
      {
        heading: 'Index constituents',
        items: [
          { label: 'S&P 500 by index weight', to: '/us-stocks/sp500' },
          { label: 'Nasdaq 100 by index weight', to: '/us-stocks/nasdaq100' },
        ],
      },
    ],
  },
  {
    id: 'israeli-stocks',
    label: 'Israeli Stocks',
    activePrefixes: ['/companies-by-weight', '/reit-stocks'],
    groups: [
      {
        heading: 'Index constituents',
        items: [{ label: 'TA-125 by index weight', to: '/companies-by-weight/ta125' }],
      },
      {
        heading: 'REITs',
        headingHe: 'נדל"ן מניב',
        items: [
          { label: 'סלע נדל"ן', to: '/reit-stocks/1109644', lang: 'he' },
          { label: 'ריט 1', to: '/reit-stocks/1098920', lang: 'he' },
        ],
      },
    ],
  },
  { id: 'hishtalmut', label: 'קרנות השתלמות', to: '/gemel/hishtalmut', activePrefixes: ['/gemel/hishtalmut'], lang: 'he' },
  { id: 'kupot-gemel', label: 'קופות גמל', to: '/gemel/kupot-gemel', activePrefixes: ['/gemel/kupot-gemel'], lang: 'he' },
  { id: 'pensia', label: 'קרנות פנסיה', to: '/gemel/pensia', activePrefixes: ['/gemel/pensia'], lang: 'he' },
  { id: 'blog', label: 'Blog', to: '/blog', activePrefixes: ['/blog'] },
]

const DRAWER_ID = 'mobile-nav-drawer'
const LG_QUERY = '(min-width: 64rem)'

/* ------------------------------------------------------------------ */
/* Class tokens                                                        */
/* ------------------------------------------------------------------ */

// Tighter padding between lg and xl keeps all top-level items on one line at 1024px.
const TOP_BASE = 'inline-flex items-center gap-1 rounded-md px-2 py-2 text-sm font-medium xl:px-3'
const TOP_IDLE = 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
const TOP_ACTIVE = 'bg-indigo-50 text-indigo-700'

const HEADING = 'text-xs font-semibold uppercase tracking-wide text-slate-500'

const ITEM_DESKTOP = 'block rounded-md border-s-2 px-3 py-2 text-sm'
const ITEM_MOBILE = 'flex min-h-11 flex-col justify-center rounded-md border-s-2 px-3 py-2 text-base'
// Transparent border on idle items keeps text from shifting when an item becomes current.
const ITEM_IDLE = 'border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900'
const ITEM_CURRENT = 'border-indigo-600 bg-slate-100 font-medium text-slate-900'

const MOBILE_TOP = 'flex min-h-11 w-full items-center rounded-md px-3 text-start text-base font-medium'
const MOBILE_TOP_IDLE = 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'

const ICON_BUTTON =
  'inline-flex h-11 w-11 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900'

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

function isSectionActive(item: NavItem, pathname: string): boolean {
  return (item.activePrefixes ?? []).some((prefix) => matchesPrefix(pathname, prefix))
}

function getFocusable(root: HTMLElement): HTMLElement[] {
  const selector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((el) => !el.closest('[hidden]'))
}

function HebrewText({ children }: { children: string }) {
  return (
    <bdi lang="he" dir="rtl">
      {children}
    </bdi>
  )
}

function HamburgerIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      className="h-6 w-6"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

/** Renders a section's groups as headed link lists. Used by both desktop panels and mobile accordions. */
function NavGroups({
  item,
  variant,
  onNavigate,
}: {
  item: NavItem
  variant: 'desktop' | 'mobile'
  onNavigate: () => void
}) {
  const isMobile = variant === 'mobile'
  const layout = item.mega && !isMobile ? 'grid grid-cols-3 gap-6' : 'space-y-3'

  return (
    <div className={layout}>
      {(item.groups ?? []).map((group, index) => {
        const headingId = `nav-${variant}-${item.id}-group-${index}`
        return (
          <div key={headingId}>
            {group.heading && (
              <p id={headingId} className={`${HEADING} px-3 pb-1 ${isMobile ? 'pt-2' : 'pt-1'}`}>
                {group.heading}
                {group.headingHe && (
                  <>
                    {' ('}
                    <HebrewText>{group.headingHe}</HebrewText>
                    {')'}
                  </>
                )}
              </p>
            )}
            <ul aria-labelledby={group.heading ? headingId : undefined} className="space-y-0.5">
              {group.items.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `${isMobile ? ITEM_MOBILE : ITEM_DESKTOP} ${isActive ? ITEM_CURRENT : ITEM_IDLE}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className="block">
                          {link.lang === 'he' ? <HebrewText>{link.label}</HebrewText> : link.label}
                        </span>
                        {link.description && (
                          // slate-600 on the current item's slate-100 background keeps AA contrast.
                          <span className={`mt-0.5 block text-xs ${isActive ? 'text-slate-600' : 'text-slate-500'}`}>
                            {link.description}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

export default function Header() {
  const { pathname } = useLocation()

  const [openId, setOpenId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [scrolled, setScrolled] = useState(false)

  const navRef = useRef<HTMLElement>(null)
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  // Close everything on route change (state adjusted during render, no effect needed).
  const [lastPathname, setLastPathname] = useState(pathname)
  if (pathname !== lastPathname) {
    setLastPathname(pathname)
    setOpenId(null)
    setDrawerOpen(false)
  }

  const closeDrawer = useCallback((returnFocus: boolean) => {
    setDrawerOpen(false)
    if (returnFocus) hamburgerRef.current?.focus()
  }, [])

  const openDrawer = () => {
    const initial: Record<string, boolean> = {}
    for (const item of NAV) {
      if (item.groups && isSectionActive(item, pathname)) initial[item.id] = true
    }
    setExpanded(initial)
    setOpenId(null)
    setDrawerOpen(true)
  }

  // Shadow after scrolling > 8px.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Crossing the lg breakpoint closes whichever menu belongs to the other layout.
  useEffect(() => {
    const mq = window.matchMedia(LG_QUERY)
    const onChange = () => {
      setDrawerOpen(false)
      setOpenId(null)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Desktop dropdown: outside click and Escape.
  useEffect(() => {
    if (openId === null) return
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && navRef.current?.contains(event.target)) return
      setOpenId(null)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      const trigger = triggerRefs.current[openId]
      setOpenId(null)
      trigger?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [openId])

  // Mobile drawer: scroll lock, initial focus, Escape and focus trap.
  useEffect(() => {
    if (!drawerOpen) return
    const savedOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeDrawer(true)
        return
      }
      if (event.key !== 'Tab') return
      const drawer = drawerRef.current
      if (!drawer) return
      const focusable = getFocusable(drawer)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const current = document.activeElement
      const inside = current instanceof Node && drawer.contains(current)
      if (event.shiftKey && (current === first || !inside)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (current === last || !inside)) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = savedOverflow
    }
  }, [drawerOpen, closeDrawer])

  const toggleDropdown = (id: string) => setOpenId((current) => (current === id ? null : id))
  const closeDropdowns = () => setOpenId(null)

  const handleItemBlur = (id: string) => (event: ReactFocusEvent<HTMLLIElement>) => {
    const next = event.relatedTarget
    if (next instanceof Node && event.currentTarget.contains(next)) return
    setOpenId((current) => (current === id ? null : current))
  }

  const toggleSection = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur ${scrolled ? 'shadow-sm' : ''}`}
      >
        <a
          href="#main"
          onClick={(e) => {
            e.preventDefault()
            document.getElementById('main')?.focus()
          }}
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-indigo-700 focus:shadow-lg"
        >
          Skip to main content
        </a>

        <div className="relative mx-auto flex h-14 max-w-5xl flex-nowrap items-center justify-between gap-4 px-4 lg:h-16 lg:justify-start">
          <Link to="/backtest" aria-label="BacktestIQ home" className="shrink-0 rounded-md">
            <Logo />
          </Link>

          {/* Desktop navigation */}
          <nav ref={navRef} aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center whitespace-nowrap xl:gap-1">
              {NAV.map((item) => {
                const active = isSectionActive(item, pathname)

                if (!item.groups) {
                  if (!item.to) return null
                  return (
                    <li key={item.id}>
                      <NavLink to={item.to} end className={() => `${TOP_BASE} ${active ? TOP_ACTIVE : TOP_IDLE}`}>
                        {item.lang === 'he' ? <HebrewText>{item.label}</HebrewText> : item.label}
                      </NavLink>
                    </li>
                  )
                }

                const open = openId === item.id
                const panelId = `nav-desktop-${item.id}-panel`
                const panelClass = item.mega
                  ? 'absolute start-0 top-full w-full max-w-3xl rounded-lg border border-slate-200 bg-white p-4 whitespace-normal shadow-lg'
                  : 'absolute start-0 top-full mt-2 w-max min-w-56 max-w-xs rounded-lg border border-slate-200 bg-white p-2 whitespace-normal shadow-lg'

                return (
                  // Mega panel anchors to the header's inner container, so its <li> is not positioned.
                  <li key={item.id} className={item.mega ? undefined : 'relative'} onBlur={handleItemBlur(item.id)}>
                    <button
                      type="button"
                      ref={(el) => {
                        triggerRefs.current[item.id] = el
                      }}
                      aria-expanded={open}
                      aria-controls={panelId}
                      onClick={() => toggleDropdown(item.id)}
                      className={`${TOP_BASE} ${active ? TOP_ACTIVE : TOP_IDLE}`}
                    >
                      {item.label}
                      {active && <span className="sr-only">(current section)</span>}
                      <span aria-hidden="true" className="inline-flex">
                        <ChevronIcon direction={open ? 'up' : 'down'} className="h-4 w-4" />
                      </span>
                    </button>
                    {/* tabIndex -1 keeps focus inside the item when clicking panel padding. */}
                    <div id={panelId} hidden={!open} tabIndex={-1} className={panelClass}>
                      <NavGroups item={item} variant="desktop" onNavigate={closeDropdowns} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </nav>

          <button
            ref={hamburgerRef}
            type="button"
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            aria-controls={DRAWER_ID}
            onClick={openDrawer}
            className={`-me-2 lg:hidden ${ICON_BUTTON}`}
          >
            <HamburgerIcon />
          </button>
        </div>
      </header>

      {/* Mobile drawer — outside <header>, because backdrop-blur would make it the containing block for `fixed`. */}
      <div className="lg:hidden">
        <div
          aria-hidden="true"
          onClick={() => closeDrawer(true)}
          className={`fixed inset-0 z-50 bg-slate-900/40 transition-opacity duration-300 motion-reduce:transition-none ${
            drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        />
        <div
          ref={drawerRef}
          id={DRAWER_ID}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          inert={!drawerOpen}
          className={`fixed inset-y-0 end-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-lg transition-[translate,visibility] duration-300 ease-out motion-reduce:transition-none ${
            drawerOpen ? 'visible translate-x-0' : 'invisible translate-x-full rtl:-translate-x-full'
          }`}
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-4">
            <Link
              to="/backtest"
              aria-label="BacktestIQ home"
              onClick={() => closeDrawer(false)}
              className="rounded-md"
            >
              <Logo />
            </Link>
            <button
              ref={closeRef}
              type="button"
              aria-label="Close menu"
              onClick={() => closeDrawer(true)}
              className={`-me-2 ${ICON_BUTTON}`}
            >
              <span aria-hidden="true" className="inline-flex">
                <CloseIcon className="h-5 w-5" />
              </span>
            </button>
          </div>

          <nav aria-label="Main" className="flex-1 overflow-y-auto overscroll-contain px-2 py-3">
            <ul className="space-y-1">
              {NAV.map((item) => {
                const active = isSectionActive(item, pathname)

                if (!item.groups) {
                  if (!item.to) return null
                  return (
                    <li key={item.id}>
                      <NavLink
                        to={item.to}
                        end
                        onClick={() => closeDrawer(false)}
                        className={() => `${MOBILE_TOP} ${active ? TOP_ACTIVE : MOBILE_TOP_IDLE}`}
                      >
                        {item.lang === 'he' ? <HebrewText>{item.label}</HebrewText> : item.label}
                      </NavLink>
                    </li>
                  )
                }

                const isExpanded = Boolean(expanded[item.id])
                const regionId = `nav-mobile-${item.id}-section`

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      aria-controls={regionId}
                      onClick={() => toggleSection(item.id)}
                      className={`${MOBILE_TOP} justify-between gap-2 ${active ? TOP_ACTIVE : MOBILE_TOP_IDLE}`}
                    >
                      <span>
                        {item.label}
                        {active && <span className="sr-only">(current section)</span>}
                      </span>
                      <span aria-hidden="true" className="inline-flex">
                        <ChevronIcon direction={isExpanded ? 'up' : 'down'} className="h-5 w-5" />
                      </span>
                    </button>
                    <div id={regionId} hidden={!isExpanded} className="pb-2 ps-3 pt-1">
                      <NavGroups item={item} variant="mobile" onNavigate={() => closeDrawer(false)} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </div>
    </>
  )
}

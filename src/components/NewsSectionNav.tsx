import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { NEWS_SECTIONS } from '../content/news'

const BASE =
  'inline-flex whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600'
const IDLE = 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900'
const CURRENT = 'border-indigo-600 text-slate-900'

/** Horizontal sub-navigation for the News section. Scrolls sideways on small screens. */
export default function NewsSectionNav() {
  const listRef = useRef<HTMLUListElement>(null)
  const { pathname } = useLocation()

  // Keep the current tab visible when the bar is wider than the screen.
  useEffect(() => {
    const list = listRef.current
    const current = list?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!list || !current) return
    const left = current.offsetLeft - (list.clientWidth - current.offsetWidth) / 2
    list.scrollTo({ left: Math.max(0, left) })
  }, [pathname])

  return (
    <nav aria-label="News sections" className="sticky top-14 z-30 border-b border-slate-200 bg-white/95 backdrop-blur lg:top-16">
      <ul
        ref={listRef}
        className="mx-auto flex max-w-5xl gap-5 overflow-x-auto px-4 [scrollbar-width:none] max-lg:[mask-image:linear-gradient(to_right,black_85%,transparent)] [&::-webkit-scrollbar]:hidden"
      >
        <li>
          <NavLink to="/news" end className={({ isActive }) => `${BASE} ${isActive ? CURRENT : IDLE}`}>
            Top Stories
          </NavLink>
        </li>
        {NEWS_SECTIONS.map((s) => (
          <li key={s.id}>
            <NavLink to={`/news/section/${s.id}`} className={({ isActive }) => `${BASE} ${isActive ? CURRENT : IDLE}`}>
              {s.category}
            </NavLink>
          </li>
        ))}
        {/* Spacer so the last tab can scroll clear of the fade. */}
        <li aria-hidden="true" className="w-8 shrink-0 lg:hidden" />
      </ul>
    </nav>
  )
}

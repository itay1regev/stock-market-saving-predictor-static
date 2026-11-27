/* ------------------------------------------------------------------ */
/* News: types and data loading.                                       */
/* Articles live in data/Content/news (Markdown) and are built into    */
/* public/data/news-posts.json by scripts/build_content.py.            */
/* ------------------------------------------------------------------ */

import { useEffect, useState } from 'react'

export interface NewsPost {
  id: number
  title: string
  slug: string
  /** Markdown body. */
  content: string
  summary: string
  category: string
  cover_image: string | null
  author: string
  /** Local midnight, no offset ("2026-11-24T00:00:00"), so it shows the same day in every timezone. */
  published_at: string
}

export interface NewsSection {
  id: string
  /** Must match the `category:` front-matter value of its articles. */
  category: string
  title: string
}

/** Display order of sections on the News home page. */
export const NEWS_SECTIONS: readonly NewsSection[] = [
  { id: 'markets', category: 'Markets', title: 'Markets News' },
  { id: 'companies', category: 'Company News', title: 'Company News' },
  { id: 'economy', category: 'Economy', title: 'Economy' },
  { id: 'personal-finance', category: 'Personal Finance', title: 'Personal Finance News' },
  { id: 'crypto', category: 'Crypto', title: 'Crypto News' },
  { id: 'gurus', category: 'Investing Gurus', title: 'Investing Gurus' },
  { id: 'explainers', category: 'Explainers', title: 'Explainers' },
]

export function sectionForCategory(category: string): NewsSection | undefined {
  return NEWS_SECTIONS.find((s) => s.category === category)
}

/** Parses the date part as a local calendar date, so no timezone can shift it by a day. */
function localDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatNewsDate(iso: string): string {
  return localDate(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** "Today", "Yesterday", "3 days ago" for the past week, otherwise the date. */
export function relativeNewsDate(iso: string, now = new Date()): string {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.round((today.getTime() - localDate(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return formatNewsDate(iso)
}

export function coverUrl(path: string | null): string | null {
  return path ? import.meta.env.BASE_URL + path.replace(/^\//, '') : null
}

let cache: Promise<NewsPost[]> | null = null
let loaded: NewsPost[] | null = null

function loadNews(): Promise<NewsPost[]> {
  if (!cache) {
    cache = fetch(import.meta.env.BASE_URL + 'data/news-posts.json')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<NewsPost[]>
      })
      .then((posts) => (loaded = posts))
    cache.catch(() => {
      cache = null // allow a retry
    })
  }
  return cache
}

/** Posts sorted newest first (the JSON is already in that order). `retry` re-fetches after an error. */
export function useNews(): { posts: NewsPost[] | null; error: boolean; retry: () => void } {
  const [posts, setPosts] = useState<NewsPost[] | null>(() => loaded)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (loaded) return
    let alive = true
    loadNews()
      .then((p) => alive && setPosts(p))
      .catch(() => alive && setError(true))
    return () => {
      alive = false
    }
  }, [attempt])
  const retry = () => {
    setError(false)
    setAttempt((n) => n + 1)
  }
  return { posts, error, retry }
}

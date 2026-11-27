/* ------------------------------------------------------------------ */
/* "How to Invest" learning hub: types and data loading.               */
/* Content lives in data/Content/how-to-invest (Markdown) and is built */
/* into public/data/how-to-invest.json by scripts/build_content.py.    */
/* ------------------------------------------------------------------ */

import { useEffect, useState } from 'react'

export type LearnTopicId = 'basics' | 'stocks' | 'etfs' | 'bonds' | 'portfolio' | 'retirement'

export interface LearnTopic {
  id: LearnTopicId
  title: string
  blurb: string
  /** Tailwind classes for the topic's accent chip. */
  chip: string
  /** Tailwind gradient stops for the topic's card cover band. */
  band: string
}

export interface LearnArticle {
  slug: string
  title: string
  topic: LearnTopicId
  summary: string
  level: 'Beginner' | 'Intermediate'
  readMinutes: number
  takeaways: string[]
  /** Markdown; internal links use the HashRouter form `#/path`. */
  body: string
  featured?: boolean
}

export interface LearnHub {
  topics: LearnTopic[]
  start_here: string[]
  glossary: { term: string; definition: string }[]
  articles: LearnArticle[]
}

/*
 * Tailwind only generates classes it finds in source files, and the topic
 * colours now come from JSON. Keep every class used in hub.json listed here:
 * bg-indigo-50 text-indigo-700 from-indigo-500 to-indigo-700
 * bg-emerald-50 text-emerald-700 from-emerald-500 to-emerald-700
 * bg-sky-50 text-sky-700 from-sky-500 to-sky-700
 * bg-amber-50 text-amber-800 from-amber-500 to-amber-700
 * bg-rose-50 text-rose-700 from-rose-500 to-rose-700
 * bg-violet-50 text-violet-700 from-violet-500 to-violet-700
 */

let cache: Promise<LearnHub> | null = null

function loadHub(): Promise<LearnHub> {
  cache ??= fetch(import.meta.env.BASE_URL + 'data/how-to-invest.json').then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json() as Promise<LearnHub>
  })
  cache.catch(() => {
    cache = null
  })
  return cache
}

export function useLearnHub(): { hub: LearnHub | null; error: boolean } {
  const [hub, setHub] = useState<LearnHub | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    let alive = true
    loadHub()
      .then((h) => alive && setHub(h))
      .catch(() => alive && setError(true))
    return () => {
      alive = false
    }
  }, [])
  return { hub, error }
}

export function getTopic(hub: LearnHub, id: string): LearnTopic | undefined {
  return hub.topics.find((t) => t.id === id)
}

export function getArticle(hub: LearnHub, slug: string): LearnArticle | undefined {
  return hub.articles.find((a) => a.slug === slug)
}

export function articlesByTopic(hub: LearnHub, id: string): LearnArticle[] {
  return hub.articles.filter((a) => a.topic === id)
}

import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { renderMarkdown } from '../lib/markdown'
import LearnArticleCard from '../components/LearnArticleCard'
import DataDisclaimer from '../components/DataDisclaimer'
import { ErrorState, LoadingState } from '../components/StatusMessage'
import { getArticle, getTopic, useLearnHub } from '../content/learn'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;|&#\d+;/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Renders Markdown and adds ids to h2s so the table of contents can scroll to them. */
function renderBody(markdown: string): { html: string; toc: { id: string; text: string }[] } {
  const toc: { id: string; text: string }[] = []
  const raw = renderMarkdown(markdown)
  const html = raw.replace(/<h2>(.*?)<\/h2>/g, (_m, inner: string) => {
    const id = `sec-${slugify(inner)}`
    toc.push({ id, text: inner.replace(/<[^>]+>/g, '') })
    return `<h2 id="${id}" class="scroll-mt-24">${inner}</h2>`
  })
  return { html, toc }
}

function scrollToSection(id: string) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start' })
}

export default function LearnArticlePage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { hub, error } = useLearnHub()
  const article = hub ? getArticle(hub, slug) : undefined
  const rendered = useMemo(() => (article ? renderBody(article.body) : null), [article])

  if (!hub) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        {error ? <ErrorState message="Could not load this guide right now. Try again in a moment." /> : <LoadingState />}
      </div>
    )
  }
  if (!article || !rendered) return <Navigate to="/learn" replace />

  const topic = getTopic(hub, article.topic)
  const sameTopic = hub.articles.filter((a) => a.topic === article.topic && a.slug !== article.slug)
  const others = hub.articles.filter((a) => a.topic !== article.topic)
  const related = [...sameTopic, ...others].slice(0, 3)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link to="/learn" className="font-medium text-indigo-700 hover:underline">
          How to Invest
        </Link>
        {topic && (
          <>
            <span aria-hidden="true"> / </span>
            <Link to={`/learn/topic/${topic.id}`} className="font-medium text-indigo-700 hover:underline">
              {topic.title}
            </Link>
          </>
        )}
      </nav>

      <div className="mt-4 grid gap-10 lg:grid-cols-[1fr_16rem]">
        <article className="min-w-0">
          <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">{article.title}</h1>
          <p className="mt-3 text-lg text-slate-600">{article.summary}</p>
          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            {topic && <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${topic.chip}`}>{topic.title}</span>}
            <span>{article.level}</span>
            <span aria-hidden="true">&middot;</span>
            <span>{article.readMinutes} min read</span>
            <span aria-hidden="true">&middot;</span>
            <span>By the BacktestIQ editorial team</span>
          </p>

          <aside
            aria-labelledby="takeaways-heading"
            className="mt-6 rounded-lg border-s-4 border-indigo-600 bg-indigo-50/70 p-5"
          >
            <h2 id="takeaways-heading" className="text-sm font-bold uppercase tracking-wide text-indigo-800">
              Key takeaways
            </h2>
            <ul className="mt-3 list-disc space-y-1.5 ps-5 text-slate-800">
              {article.takeaways.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </aside>

          <div
            className="prose prose-slate mt-8 max-w-none prose-headings:font-semibold prose-headings:text-slate-900 prose-a:text-indigo-700 prose-blockquote:border-indigo-300 prose-blockquote:bg-slate-50 prose-blockquote:py-1 prose-blockquote:not-italic prose-table:text-sm"
            dangerouslySetInnerHTML={{ __html: rendered.html }}
          />

          <p className="mt-10 rounded-md bg-slate-100 p-4 text-sm text-slate-600">
            This guide is general education, not personal financial advice. Consider your own situation, or speak with a
            licensed adviser, before making investment decisions.
          </p>
        </article>

        {rendered.toc.length > 0 && (
          <aside className="hidden lg:block">
            <nav aria-labelledby="toc-heading" className="sticky top-24 rounded-lg border border-slate-200 bg-white p-4">
              <h2 id="toc-heading" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                In this article
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {rendered.toc.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => scrollToSection(item.id)}
                      className="text-start text-slate-700 hover:text-indigo-700 hover:underline"
                    >
                      {item.text}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}
      </div>

      <section aria-labelledby="related-heading" className="mt-14">
        <h2 id="related-heading" className="border-b-2 border-slate-900 pb-2 text-xl font-semibold text-slate-900">
          Keep learning
        </h2>
        <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((a) => (
            <LearnArticleCard key={a.slug} article={a} topic={getTopic(hub, a.topic)} />
          ))}
        </div>
      </section>

      <DataDisclaimer />
    </div>
  )
}

import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import NewsCard from '../components/NewsCard'
import DataDisclaimer from '../components/DataDisclaimer'
import { ErrorState, LoadingState } from '../components/StatusMessage'
import { coverUrl, formatNewsDate, sectionForCategory, useNews } from '../content/news'
import { renderMarkdown } from '../lib/markdown'
import { RAIL_HEADING } from '../components/newsStyles'

export default function NewsArticlePage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { posts, error, retry } = useNews()
  const post = posts?.find((p) => p.slug === slug)
  const html = useMemo(() => (post ? renderMarkdown(post.content) : ''), [post])

  if (!post) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Link to="/news" className="text-sm font-medium text-indigo-700 hover:underline">
          &larr; All news
        </Link>
        <div className="mt-4">
          {error ? (
            <ErrorState message="Could not load this article right now." onRetry={retry} />
          ) : !posts ? (
            <LoadingState message="Loading article…" />
          ) : (
            <>
              <title>Article not found | BacktestIQ</title>
              <h1 className="text-2xl font-bold text-slate-900">Article not found</h1>
              <p className="mt-2 text-slate-600">It may have been moved or removed. Here are the latest stories instead.</p>
              <ol className="mt-4 max-w-2xl divide-y divide-slate-200">
                {posts.slice(0, 5).map((p) => (
                  <li key={p.slug}>
                    <NewsCard post={p} variant="headline" />
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </div>
    )
  }

  const section = sectionForCategory(post.category)
  const img = coverUrl(post.cover_image)
  const others = posts!.filter((p) => p.slug !== post.slug)
  const sameSection = others.filter((p) => p.category === post.category)
  // Fill the related row to three cards even in thin sections.
  const related = [...sameSection, ...others.filter((p) => p.category !== post.category)].slice(0, 3)
  const relatedSlugs = new Set(related.map((p) => p.slug))
  const latest = others.filter((p) => !relatedSlugs.has(p.slug)).slice(0, 5)
  const relatedHeading = sameSection.length >= 3 ? `More ${section?.title ?? post.category}` : 'More from News'

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <title>{`${post.title} | BacktestIQ`}</title>
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link to="/news" className="font-medium text-indigo-700 hover:underline">
          News
        </Link>
        {section && (
          <>
            <span aria-hidden="true" className="text-slate-400">
              {' / '}
            </span>
            <Link to={`/news/section/${section.id}`} className="font-medium text-indigo-700 hover:underline">
              {section.category}
            </Link>
          </>
        )}
      </nav>

      <div className="mt-4 grid gap-10 lg:grid-cols-[1fr_17rem]">
        <article className="min-w-0">
          <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">{post.title}</h1>
          <p className="mt-3 text-xl leading-relaxed text-slate-700">{post.summary}</p>
          <p className="mt-4 border-y border-slate-200 py-3 text-sm text-slate-600">
            By <span className="font-medium text-slate-800">{post.author}</span> &middot; Published{' '}
            <time dateTime={post.published_at.slice(0, 10)}>{formatNewsDate(post.published_at)}</time>
          </p>
          {img && <img src={img} alt="" className="mt-6 aspect-[40/21] w-full rounded-lg object-cover" />}
          <div
            className="prose prose-slate mt-8 max-w-[68ch] prose-headings:text-slate-900 prose-h2:mt-10 prose-h2:text-2xl prose-h2:font-bold prose-a:text-indigo-700 prose-table:text-sm prose-th:text-left prose-td:tabular-nums"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>

        {latest.length > 0 && (
          <aside aria-labelledby="latest-heading" className="lg:border-s lg:border-slate-200 lg:ps-6">
            <div className="lg:sticky lg:top-24">
              <h2 id="latest-heading" className={RAIL_HEADING}>
                Latest News
              </h2>
              <ol className="mt-2 divide-y divide-slate-200">
                {latest.map((p) => (
                  <li key={p.slug}>
                    <NewsCard post={p} variant="headline" />
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        )}
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-14">
          <h2 id="related-heading" className="border-b-2 border-slate-900 pb-2 text-xl font-bold text-slate-900">
            {relatedHeading}
          </h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <NewsCard key={p.slug} post={p} showCategory={sameSection.length < 3} />
            ))}
          </div>
        </section>
      )}

      <DataDisclaimer />
    </div>
  )
}

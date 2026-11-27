import { Link } from 'react-router-dom'
import NewsCard from '../components/NewsCard'
import NewsSectionNav from '../components/NewsSectionNav'
import DataDisclaimer from '../components/DataDisclaimer'
import { NEWS_EYEBROW, RAIL_HEADING } from '../components/newsStyles'
import { ErrorState, LoadingState } from '../components/StatusMessage'
import { NEWS_SECTIONS, useNews, type NewsPost } from '../content/news'

export default function NewsHomePage() {
  const { posts, error, retry } = useNews()

  return (
    <div>
      <title>News | BacktestIQ</title>
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 pt-8 pb-3">
          <p className={NEWS_EYEBROW}>Newsroom</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900 sm:text-4xl">News</h1>
          <p className="mt-1 text-slate-600">Markets, companies, the economy and your money, explained.</p>
        </div>
      </div>
      <NewsSectionNav />

      <div className="mx-auto max-w-5xl px-4 py-8">
        {!posts &&
          (error ? (
            <ErrorState message="Could not load the news right now." onRetry={retry} />
          ) : (
            <LoadingState message="Loading news…" />
          ))}
        {posts && posts.length === 0 && <p className="text-slate-600">No news yet. Check back soon.</p>}
        {posts && posts.length > 0 && <NewsHomeContent posts={posts} />}

        <DataDisclaimer />
      </div>
    </div>
  )
}

function NewsHomeContent({ posts }: { posts: NewsPost[] }) {
  // Top stories: the newest article leads; the next two fill the secondary slots.
  const [lead, ...rest] = posts
  const secondary = rest.slice(0, 2)
  // "Latest News" is a chronological feed of what comes next.
  const latest = rest.slice(2, 8)
  // Category blocks skip the stories already featured at the top, so nothing shows twice.
  const featured = new Set([lead, ...secondary, ...latest].map((p) => p.slug))

  return (
    <>
      <section aria-labelledby="top-heading" className="grid items-start gap-8 lg:grid-cols-3">
        <h2 id="top-heading" className="sr-only">
          Top stories
        </h2>
        <div className="lg:col-span-2">
          <NewsCard post={lead} variant="lead" />
          {secondary.length > 0 && (
            <div className="mt-8 grid gap-6 border-t border-slate-200 pt-6 sm:grid-cols-2">
              {secondary.map((p) => (
                <NewsCard key={p.slug} post={p} />
              ))}
            </div>
          )}
        </div>

        {latest.length > 0 && (
          <aside aria-labelledby="latest-heading" className="border-t border-slate-200 pt-6 lg:border-t-0 lg:border-s lg:pt-0 lg:ps-6">
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
          </aside>
        )}
      </section>

      {NEWS_SECTIONS.map((section) => {
        const all = posts.filter((p) => p.category === section.category)
        const items = all.filter((p) => !featured.has(p.slug))
        if (items.length === 0) return null
        const [first, ...others] = items
        const headingId = `news-${section.id}-heading`
        return (
          <section key={section.id} aria-labelledby={headingId} className="mt-14">
            <div className="flex items-end justify-between gap-4 border-b-2 border-slate-900 pb-2">
              <h2 id={headingId} className="text-xl font-bold text-slate-900">
                {section.title}
              </h2>
              <Link to={`/news/section/${section.id}`} className="shrink-0 text-sm font-medium text-indigo-700 hover:underline">
                All {all.length} {all.length === 1 ? 'story' : 'stories'} &rarr;
                <span className="sr-only"> in {section.title}</span>
              </Link>
            </div>
            {others.length === 0 ? (
              <div className="mt-5">
                <NewsCard post={first} variant="wide" showCategory={false} />
              </div>
            ) : (
              <div className="mt-5 grid gap-6 lg:grid-cols-2">
                <NewsCard post={first} showCategory={false} />
                <ul className="-mt-4 divide-y divide-slate-200">
                  {others.slice(0, 3).map((p) => (
                    <li key={p.slug}>
                      <NewsCard post={p} variant="row" showCategory={false} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )
      })}
    </>
  )
}

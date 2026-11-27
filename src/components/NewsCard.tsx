import { useId } from 'react'
import { Link } from 'react-router-dom'
import { coverUrl, relativeNewsDate, type NewsPost } from '../content/news'

interface Props {
  post: NewsPost
  /**
   * lead: large hero story · card: image on top · wide: image beside text, for a section with a single story ·
   * row: thumbnail beside text · headline: text only
   */
  variant?: 'lead' | 'card' | 'wide' | 'row' | 'headline'
  showCategory?: boolean
}

// Cover SVGs are 800×420; matching the box ratio avoids cropping the title text.
const COVER_RATIO = 'aspect-[40/21]'
const FOCUS = 'rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600'

function Kicker({ post }: { post: NewsPost }) {
  return <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">{post.category}</span>
}

function Dateline({ post }: { post: NewsPost }) {
  return (
    <p className="mt-1.5 text-xs text-slate-600">
      <time dateTime={post.published_at.slice(0, 10)}>{relativeNewsDate(post.published_at)}</time>
    </p>
  )
}

export default function NewsCard({ post, variant = 'card', showCategory = true }: Props) {
  const to = `/news/${post.slug}`
  const img = coverUrl(post.cover_image)
  const titleId = useId()

  if (variant === 'headline') {
    return (
      <Link to={to} aria-labelledby={titleId} className={`group block py-3 ${FOCUS}`}>
        {showCategory && <Kicker post={post} />}
        <h3 id={titleId} className="mt-0.5 font-semibold leading-snug text-slate-900 group-hover:text-indigo-700 group-hover:underline">
          {post.title}
        </h3>
        <Dateline post={post} />
      </Link>
    )
  }

  if (variant === 'row' || variant === 'wide') {
    const wide = variant === 'wide'
    return (
      <Link to={to} aria-labelledby={titleId} className={`group flex gap-4 ${wide ? 'flex-col sm:flex-row sm:gap-6' : 'py-4'} ${FOCUS}`}>
        {img && (
          <img
            src={img}
            alt=""
            loading="lazy"
            className={`shrink-0 rounded-md object-cover ${COVER_RATIO} ${wide ? 'w-full sm:w-1/2' : 'w-32 sm:w-40'}`}
          />
        )}
        <div className="min-w-0">
          {showCategory && <Kicker post={post} />}
          <h3
            id={titleId}
            className={`mt-0.5 font-semibold leading-snug text-slate-900 group-hover:text-indigo-700 group-hover:underline ${
              wide ? 'text-xl font-bold' : ''
            }`}
          >
            {post.title}
          </h3>
          <p className={`mt-1 text-sm text-slate-600 ${wide ? 'sm:text-base' : 'line-clamp-2 hidden sm:block'}`}>{post.summary}</p>
          <Dateline post={post} />
        </div>
      </Link>
    )
  }

  const lead = variant === 'lead'
  return (
    // Only grid cards stretch to the row height; the lead keeps its natural height.
    <Link to={to} aria-labelledby={titleId} className={`group flex flex-col ${lead ? '' : 'h-full'} ${FOCUS}`}>
      {img && <img src={img} alt="" loading={lead ? 'eager' : 'lazy'} className={`w-full rounded-md object-cover ${COVER_RATIO}`} />}
      <div className="pt-3">
        {showCategory && <Kicker post={post} />}
        <h3
          id={titleId}
          className={`mt-1 font-bold leading-tight text-slate-900 group-hover:text-indigo-700 group-hover:underline ${
            lead ? 'text-2xl sm:text-3xl' : 'text-base sm:text-lg'
          }`}
        >
          {post.title}
        </h3>
        <p className={`mt-2 text-slate-600 ${lead ? 'text-lg' : 'line-clamp-3 text-sm'}`}>{post.summary}</p>
        <Dateline post={post} />
      </div>
    </Link>
  )
}

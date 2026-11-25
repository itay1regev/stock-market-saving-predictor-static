import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { marked } from 'marked'
import type { BlogPost } from '../types'
import { LoadingState, ErrorState } from '../components/StatusMessage'

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError('')
    fetch(import.meta.env.BASE_URL + 'data/blog-posts.json')
      .then((r) => r.json())
      .then((posts: BlogPost[]) => {
        const found = posts.find((p) => p.slug === slug)
        if (!found) throw new Error('not found')
        setPost(found)
      })
      .catch(() => setError('Could not load this post right now. Try again in a moment.'))
      .finally(() => setLoading(false))
  }, [slug])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/blog" className="text-sm font-medium text-indigo-600 hover:underline">
        &larr; Back to blog
      </Link>

      <div className="mt-4">
        {loading && <LoadingState message="Loading post…" />}
        {error && <ErrorState message={error} />}
      </div>

      {!loading && !error && post && (
        <article className="mt-4">
          {post.cover_image && (
            <img
              src={import.meta.env.BASE_URL + post.cover_image.replace(/^\//, '')}
              alt=""
              className="mb-6 h-64 w-full rounded-lg object-cover"
            />
          )}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {post.category}
          </span>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">{post.title}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {post.author} &middot; {new Date(post.published_at).toLocaleDateString()}
          </p>
          <div
            className="prose prose-slate mt-6 max-w-none prose-headings:font-semibold prose-headings:text-slate-900 prose-a:text-indigo-600"
            dangerouslySetInnerHTML={{ __html: marked.parse(post.content, { async: false }) }}
          />
        </article>
      )}
    </div>
  )
}

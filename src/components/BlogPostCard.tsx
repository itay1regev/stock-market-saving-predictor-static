import { Link } from 'react-router-dom'
import type { BlogPost } from '../types'

interface Props {
  post: BlogPost
}

export default function BlogPostCard({ post }: Props) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <Link to={`/blog/${post.slug}`} className="block">
        {post.cover_image && (
          <img
            src={import.meta.env.BASE_URL + post.cover_image.replace(/^\//, '')}
            alt=""
            className="h-40 w-full object-cover"
          />
        )}
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">{post.category}</span>
            <span>
              {post.author} &middot; {new Date(post.published_at).toLocaleDateString()}
            </span>
          </div>
          <h2 className="mt-2 text-lg font-semibold text-slate-900 hover:text-indigo-600">{post.title}</h2>
          <p className="mt-2 text-sm text-slate-600">{post.summary}</p>
        </div>
      </Link>
    </article>
  )
}

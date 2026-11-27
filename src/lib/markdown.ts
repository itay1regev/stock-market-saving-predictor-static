import { Marked } from 'marked'

/**
 * Markdown renderer for first-party editorial content (News, How to Invest).
 * Off-site links open in a new tab; internal `#/path` links stay in the SPA.
 */
const md = new Marked({
  async: false,
  hooks: {
    postprocess: (html: string) =>
      html.replace(/<a href="(https?:\/\/[^"]*)"/gi, '<a href="$1" target="_blank" rel="noopener noreferrer"'),
  },
})

export function renderMarkdown(source: string): string {
  return md.parse(source, { async: false })
}

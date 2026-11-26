import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-6 text-xs leading-relaxed text-slate-500">
        <p>
          <strong className="font-medium text-slate-600">Not investment advice.</strong> All content on this site is
          for informational and educational purposes only. It is not financial, investment, tax or legal advice and
          is not a recommendation to buy or sell any security. Data comes from third-party sources, is provided "as
          is" without any warranty of accuracy, completeness or timeliness, and may be delayed or wrong. You invest
          entirely at your own risk.
        </p>
        <p className="mt-2">
          <Link to="/terms" className="font-medium text-indigo-600 hover:underline">
            Terms of Use &amp; Disclaimer
          </Link>
        </p>
      </div>
    </footer>
  )
}

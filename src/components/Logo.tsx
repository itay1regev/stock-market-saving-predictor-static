export function LogoMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <rect width="48" height="48" fill="#0f172a" rx="10" />
      <path stroke="#34d399" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 30l7.5-8 6 6L34 15" />
      <path stroke="#34d399" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M27 15h7v7" />
    </svg>
  )
}

export default function Logo({
  className = '',
  iconClassName = 'h-7 w-7',
  textClassName = 'text-lg font-semibold text-indigo-600',
}: {
  className?: string
  iconClassName?: string
  textClassName?: string
}) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <LogoMark className={iconClassName} />
      <span className={textClassName}>BacktestIQ</span>
    </span>
  )
}

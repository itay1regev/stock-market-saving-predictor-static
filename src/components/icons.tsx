interface IconProps {
  className?: string
}

export function ChevronIcon({ direction = 'down', className = 'h-3 w-3' }: IconProps & { direction?: 'up' | 'down' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      className={className}
      style={{ transform: direction === 'up' ? 'rotate(180deg)' : undefined }}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function TrendIcon({ direction, className = 'h-3 w-3' }: IconProps & { direction: 'up' | 'down' | 'flat' }) {
  if (direction === 'flat') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden="true">
        <path strokeLinecap="round" d="M5 12h14" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d={direction === 'up' ? 'M12 5l7 9H5z' : 'M12 19l-7-9h14z'} />
    </svg>
  )
}

export function HeartIcon({ filled, className = 'h-4 w-4' }: IconProps & { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.75}
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21s-7.44-4.66-9.9-9.03C.6 8.87 2.1 5.4 5.6 5.4c2 0 3.5 1.15 4.4 2.7.9-1.55 2.4-2.7 4.4-2.7 3.5 0 5 3.47 3.5 6.57C19.44 16.34 12 21 12 21z"
      />
    </svg>
  )
}

export function CloseIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

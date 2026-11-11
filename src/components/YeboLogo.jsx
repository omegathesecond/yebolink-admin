export function YeboLogo({ onDark = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="grid h-8 w-8 place-items-center rounded-full bg-brand font-display text-[15px] font-bold text-cream"
      >
        Y
      </span>
      <span className="font-display text-xl font-semibold tracking-tight">
        <span className="text-brand">Yebo</span>
        <span className={onDark ? 'text-cream' : 'text-ink'}>Link</span>
      </span>
    </span>
  )
}

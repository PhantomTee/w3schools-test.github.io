export function Footer() {
  return (
    <footer className="border-t border-[var(--border-strong)] py-8">
      <div className="container mx-auto px-5 max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-display text-[16px] text-[var(--text-primary)] tracking-tight">XEN</p>
        <p className="text-[12px] text-[var(--text-muted)] max-w-sm text-center sm:text-right leading-relaxed">
          Participation involves financial risk. Xen uses X API public metrics.
          Markets may void if data cannot be verified at settlement.
          Not financial advice.
        </p>
      </div>
    </footer>
  )
}

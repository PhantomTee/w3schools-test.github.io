export function Footer() {
  return (
    <footer className="border-t border-border/50 py-6 mt-12">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>© 2025 Xen. USDC-settled attention markets on Arc.</p>
        <p className="text-xs max-w-xs text-center sm:text-right">
          Xen uses X API metrics. Markets may void if data cannot be verified.
          Not financial advice.
        </p>
      </div>
    </footer>
  )
}

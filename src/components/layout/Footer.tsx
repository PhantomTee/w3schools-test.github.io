export function Footer() {
  return (
    <footer className="border-t border-white/[0.05] py-8 mt-16">
      <div className="container mx-auto px-5 max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[14px] font-medium text-[#64748B]">Xen</p>
        <p className="text-[12px] text-[#64748B] max-w-sm text-center sm:text-right leading-relaxed">
          Participation involves financial risk. Xen uses X API public metrics.
          Markets may void if data cannot be verified at settlement.
          Not financial advice.
        </p>
      </div>
    </footer>
  )
}

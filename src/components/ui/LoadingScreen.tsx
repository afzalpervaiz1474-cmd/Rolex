export default function LoadingScreen({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-6" role="status" aria-live="polite">
      <div className="relative h-14 w-14">
        <span className="absolute inset-0 rounded-full border border-gold/20" />
        <span className="absolute inset-0 animate-spin rounded-full border-t border-gold [animation-duration:1.4s]" />
        <span className="absolute inset-3 rounded-full border border-gold/10" />
        <span className="absolute inset-3 animate-spin rounded-full border-b border-gold-bright [animation-duration:2.2s] [animation-direction:reverse]" />
      </div>
      <p className="eyebrow animate-pulse-soft">{label}</p>
    </div>
  );
}

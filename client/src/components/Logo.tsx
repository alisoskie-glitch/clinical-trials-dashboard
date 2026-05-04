/**
 * Pipeline Planner logo — geometric mark suggesting a pipeline funnel and a measurement window.
 * Inspired by Paul Rand: one strong shape, works from 24px to 200px.
 */
export function Logo({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Pipeline Planner"
    >
      {/* Outer pipeline ring */}
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" />
      {/* Three converging trial bars (specialty pipelines) */}
      <rect x="6" y="10" width="14" height="2.5" rx="1.25" fill="currentColor" />
      <rect x="6" y="14.75" width="20" height="2.5" rx="1.25" fill="currentColor" opacity="0.7" />
      <rect x="6" y="19.5" width="10" height="2.5" rx="1.25" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

export function LogoWordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Logo size={26} className="text-primary" />
      <span className="text-base font-semibold tracking-tight">Pipeline Planner</span>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = 'h-4 w-full' }: SkeletonProps): JSX.Element {
  return <div className={`animate-pulse rounded-input bg-slate-200 ${className}`} aria-hidden="true" />;
}

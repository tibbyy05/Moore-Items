import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function CustomSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-warm-100',
        'before:absolute before:inset-0',
        'before:translate-x-[-100%]',
        'before:animate-shimmer',
        'before:bg-gradient-to-r',
        'before:from-transparent before:via-white/60 before:to-transparent',
        className
      )}
      {...props}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white border border-warm-200 rounded-2xl p-4">
      <CustomSkeleton className="w-full aspect-square rounded-xl mb-3" />
      <CustomSkeleton className="h-3 w-20 mb-2" />
      <CustomSkeleton className="h-4 w-full mb-2" />
      <CustomSkeleton className="h-3 w-32 mb-3" />
      <CustomSkeleton className="h-5 w-24" />
    </div>
  );
}

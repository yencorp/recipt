import { cn } from '@/utils/cn';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  width,
  height,
}) => {
  const variants = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-gray-300',
        variants[variant],
        className
      )}
      style={style}
    />
  );
};

export const SkeletonText: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={16}
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <Skeleton variant="rectangular" height={200} />
      <Skeleton variant="text" height={24} width="70%" />
      <SkeletonText lines={2} />
    </div>
  );
};

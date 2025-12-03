import { Loader2Icon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse';
  className?: string;
  text?: string;
}

export function Loader({ size = 'md', variant = 'spinner', className, text }: LoaderProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  if (variant === 'spinner') {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
        <Loader2Icon className={cn('animate-spin text-gray-900', sizeClasses[size])} />
        {text && <p className="text-sm text-gray-600">{text}</p>}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
        <div className="flex gap-1">
          <div className={cn('rounded-full bg-gray-900 animate-bounce', sizeClasses[size])} style={{ animationDelay: '0ms' }} />
          <div className={cn('rounded-full bg-gray-900 animate-bounce', sizeClasses[size])} style={{ animationDelay: '150ms' }} />
          <div className={cn('rounded-full bg-gray-900 animate-bounce', sizeClasses[size])} style={{ animationDelay: '300ms' }} />
        </div>
        {text && <p className="text-sm text-gray-600">{text}</p>}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
        <div className={cn('rounded-full bg-gray-900 animate-pulse', sizeClasses[size])} />
        {text && <p className="text-sm text-gray-600">{text}</p>}
      </div>
    );
  }

  return null;
}

// Full page loader
export function PageLoader({ text }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader size="lg" text={text || 'Loading...'} />
    </div>
  );
}

// Button loader (inline)
export function ButtonLoader({ className }: { className?: string }) {
  return <Loader2Icon className={cn('w-4 h-4 animate-spin', className)} />;
}

// Overlay loader
export function OverlayLoader({ text }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <Loader size="lg" text={text || 'Loading...'} />
      </div>
    </div>
  );
}

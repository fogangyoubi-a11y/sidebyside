import { cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join('');
}

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name);
  const hue = hashHue(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover shadow-soft', sizeClasses[size], className)}
      />
    );
  }
  return (
    <span
      aria-label={name}
      className={cn(
        'inline-grid place-items-center rounded-full font-display font-bold text-white shadow-soft',
        sizeClasses[size],
        className,
      )}
      style={{ backgroundColor: `hsl(${hue}, 60%, 45%)` }}
    >
      {initials}
    </span>
  );
}

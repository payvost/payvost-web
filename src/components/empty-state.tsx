import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showCard?: boolean;
}

const sizeClasses = {
  sm: {
    icon: 'h-8 w-8',
    title: 'text-base',
    description: 'text-sm',
    spacing: 'space-y-2',
  },
  md: {
    icon: 'h-12 w-12',
    title: 'text-lg',
    description: 'text-sm',
    spacing: 'space-y-3',
  },
  lg: {
    icon: 'h-16 w-16',
    title: 'text-xl',
    description: 'text-base',
    spacing: 'space-y-4',
  },
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md',
  showCard = true,
}: EmptyStateProps) {
  const sizeConfig = sizeClasses[size];
  
  const content = (
    <div className={cn('flex flex-col items-center justify-center text-center', sizeConfig.spacing, className)}>
      {icon && (
        <div className={cn('text-muted-foreground', sizeConfig.icon)}>
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <h3 className={cn('font-semibold', sizeConfig.title)}>{title}</h3>
        <p className={cn('text-muted-foreground max-w-md', sizeConfig.description)}>
          {description}
        </p>
      </div>
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          {action && (
            <Button onClick={action.onClick} variant={action.variant || 'default'}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} variant={secondaryAction.variant || 'outline'}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );

  if (showCard) {
    return (
      <Card>
        <CardContent className="py-12">
          {content}
        </CardContent>
      </Card>
    );
  }

  return <div className="py-12">{content}</div>;
}


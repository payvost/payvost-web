'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface TabItem {
  value: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
  tooltip?: string;
  disabled?: boolean;
  badge?: ReactNode;
}

interface EnhancedTabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  tabs: TabItem[];
  variant?: 'default' | 'pills' | 'underline';
  showCounts?: boolean;
  className?: string;
  children?: ReactNode;
  orientation?: 'horizontal' | 'vertical';
}

export function EnhancedTabs({
  tabs,
  variant = 'default',
  showCounts = false,
  className,
  orientation = 'horizontal',
  children,
  ...props
}: EnhancedTabsProps) {
  const variantStyles = {
    default: '',
    pills: 'bg-transparent p-0 gap-2',
    underline: 'bg-transparent border-b p-0 h-auto',
  };

  const triggerStyles = {
    default: '',
    pills: 'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4',
    underline: 'data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:bg-transparent',
  };

  return (
    <Tabs {...props} orientation={orientation} className={className}>
      <TabsList className={cn(
        "overflow-x-auto sm:overflow-visible",
        variantStyles[variant],
        orientation === 'vertical' && 'flex-col h-auto w-auto'
      )}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const content = (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              disabled={tab.disabled}
              className={cn(triggerStyles[variant], "flex items-center gap-2")}
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span>{tab.label}</span>
              {showCounts && tab.count !== undefined && tab.count > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {tab.count}
                </Badge>
              )}
              {tab.badge}
            </TabsTrigger>
          );

          if (tab.tooltip) {
            return (
              <TooltipProvider key={tab.value}>
                <Tooltip>
                  <TooltipTrigger asChild>{content}</TooltipTrigger>
                  <TooltipContent>
                    <p>{tab.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          return content;
        })}
      </TabsList>
      {children}
    </Tabs>
  );
}

// Re-export TabsContent from shadcn for consistency
export { TabsContent } from '@/components/ui/tabs';


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
    default: 'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200 relative',
    pills: 'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-full px-4 transition-all duration-200 data-[state=active]:scale-105',
    underline: 'data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:bg-transparent data-[state=active]:font-semibold transition-all duration-200 relative',
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
              className={cn(
                triggerStyles[variant], 
                "flex items-center gap-2 relative",
                "data-[state=active]:[&_svg]:text-primary-foreground",
                "data-[state=active]:[&_svg]:scale-110",
                "[&_svg]:transition-all [&_svg]:duration-200",
                variant === 'underline' && "data-[state=active]:[&_.tab-indicator-underline]:scale-x-100",
                variant === 'default' && "data-[state=active]:[&_.tab-indicator-dot]:scale-100"
              )}
            >
              {Icon && (
                <Icon className={cn(
                  "h-4 w-4 transition-all duration-200 shrink-0"
                )} />
              )}
              <span className="relative">
                {tab.label}
              </span>
              {variant === 'underline' && (
                <span className="tab-indicator-underline absolute -bottom-0 left-0 right-0 h-0.5 bg-primary scale-x-0 transition-transform duration-200 origin-center pointer-events-none" />
              )}
              {variant === 'default' && (
                <span className="tab-indicator-dot absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary scale-0 transition-transform duration-200 pointer-events-none" />
              )}
              {showCounts && tab.count !== undefined && tab.count > 0 && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "ml-1 text-xs transition-all duration-200",
                    "data-[state=active]:bg-primary-foreground/20 data-[state=active]:text-primary-foreground"
                  )}
                >
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

// Note: Use TabsContent from '@/components/ui/tabs' directly when using EnhancedTabs


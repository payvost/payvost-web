'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { ReactNode, useState, useEffect } from 'react';

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
  value: controlledValue,
  defaultValue,
  onValueChange,
  ...props
}: EnhancedTabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || tabs[0]?.value || '');
  const activeValue = controlledValue !== undefined ? controlledValue : internalValue;

  const handleValueChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  const variantStyles = {
    default: '',
    pills: 'bg-transparent p-0 gap-2',
    underline: 'bg-transparent border-b p-0 h-auto',
  };

  const triggerStyles = {
    default: 'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200 relative overflow-visible',
    pills: 'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-full px-4 transition-all duration-200 data-[state=active]:scale-105',
    underline: 'data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:bg-transparent data-[state=active]:font-semibold transition-all duration-200 relative overflow-visible',
  };

  return (
    <Tabs 
      {...props} 
      orientation={orientation} 
      className={className}
      value={activeValue}
      onValueChange={handleValueChange}
      defaultValue={defaultValue}
    >
      <TabsList className={cn(
        "overflow-x-auto sm:overflow-visible overflow-y-visible",
        variantStyles[variant],
        orientation === 'vertical' && 'flex-col h-auto w-auto',
        variant === 'default' && 'pb-1'
      )}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeValue === tab.value;
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
                "[&_svg]:transition-all [&_svg]:duration-200"
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
                <span className={cn(
                  "absolute -bottom-0 left-0 right-0 h-0.5 bg-primary transition-all duration-200 origin-center pointer-events-none z-10",
                  isActive ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
                )} />
              )}
              {variant === 'default' && (
                <span className={cn(
                  "absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-primary transition-all duration-200 pointer-events-none z-10",
                  isActive ? "scale-100 opacity-100" : "scale-0 opacity-0"
                )} />
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


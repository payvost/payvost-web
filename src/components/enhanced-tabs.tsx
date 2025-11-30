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
  const initialValue = defaultValue || tabs[0]?.value || '';
  const [internalValue, setInternalValue] = useState(initialValue);
  
  // Sync internal state when controlledValue changes
  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);
  
  // Determine the active value
  const activeValue = controlledValue !== undefined ? controlledValue : internalValue;
  const safeActiveValue = activeValue || initialValue;

  const handleValueChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  // TabsList styles - only override background for non-default variants
  const listStyles = {
    default: '', // Use base component's bg-muted
    pills: 'bg-transparent p-0 gap-2',
    underline: 'bg-transparent border-b p-0 h-auto',
  };

  // TabsTrigger additional styles - don't override base active styles for default variant
  const triggerAdditionalStyles = {
    default: '', // Base component already has active styles, just add layout
    pills: 'rounded-full px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:scale-105',
    underline: 'rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-semibold',
  };

  // Build tabs props
  const tabsProps: any = {
    ...props,
    orientation,
    className,
    onValueChange: handleValueChange,
  };

  // Use controlled mode if value is provided, otherwise use defaultValue
  if (controlledValue !== undefined) {
    tabsProps.value = safeActiveValue;
  } else {
    tabsProps.defaultValue = defaultValue || initialValue;
  }

  return (
    <Tabs {...tabsProps}>
      <TabsList className={cn(
        "overflow-x-auto sm:overflow-visible overflow-y-visible",
        listStyles[variant],
        orientation === 'vertical' && 'flex-col h-auto w-auto'
      )}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = safeActiveValue === tab.value;
          
          const content = (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              disabled={tab.disabled}
              className={cn(
                "flex items-center gap-2",
                triggerAdditionalStyles[variant],
                // Icon styles for active state
                variant === 'default' && "data-[state=active]:[&_svg]:text-primary-foreground",
                variant === 'pills' && "data-[state=active]:[&_svg]:text-primary-foreground",
                variant === 'underline' && "data-[state=active]:[&_svg]:text-primary",
                "[&_svg]:transition-all [&_svg]:duration-200 [&_svg]:shrink-0",
                "data-[state=active]:[&_svg]:scale-110"
              )}
            >
              {Icon && (
                <Icon className="h-4 w-4" />
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

"use client"

import * as React from "react"
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  date?: Date | undefined;
  onDateChange?: (date: Date | undefined) => void;
  showPresets?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

const datePresets = [
  {
    label: "Today",
    value: () => startOfDay(new Date()),
  },
  {
    label: "Yesterday",
    value: () => startOfDay(subDays(new Date(), 1)),
  },
  {
    label: "Tomorrow",
    value: () => startOfDay(subDays(new Date(), -1)),
  },
  {
    label: "This week start",
    value: () => startOfWeek(new Date()),
  },
  {
    label: "This week end",
    value: () => endOfWeek(new Date()),
  },
  {
    label: "This month start",
    value: () => startOfMonth(new Date()),
  },
  {
    label: "This month end",
    value: () => endOfMonth(new Date()),
  },
  {
    label: "Last month start",
    value: () => {
      const lastMonth = subMonths(new Date(), 1);
      return startOfMonth(lastMonth);
    },
  },
];

export function DatePicker({
  className,
  date: controlledDate,
  onDateChange,
  showPresets = true,
  placeholder = "Pick a date",
  disabled = false,
}: DatePickerProps) {
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(
    undefined
  );

  const [isOpen, setIsOpen] = React.useState(false);

  const date = controlledDate !== undefined ? controlledDate : internalDate;
  
  const setDate = React.useCallback((newDate: Date | undefined) => {
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      setInternalDate(newDate);
    }
    // Close popover when date is selected
    if (newDate) {
      setIsOpen(false);
    }
  }, [onDateChange]);

  const handlePresetClick = (preset: typeof datePresets[0]) => {
    const selectedDate = preset.value();
    setDate(selectedDate);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            size="sm"
            disabled={disabled}
            className={cn(
              "h-9 w-full sm:w-[240px] justify-start text-left font-normal transition-all hover:bg-accent",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
          <div className="flex flex-col sm:flex-row">
            {showPresets && (
              <div className="border-b sm:border-b-0 sm:border-r border-border p-3 max-h-[300px] sm:max-h-none overflow-y-auto">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                    Quick select
                  </p>
                  {datePresets.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-start text-left font-normal text-xs h-8 px-2 hover:bg-accent transition-colors touch-manipulation",
                      )}
                      onClick={() => handlePresetClick(preset)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="p-3">
              <Calendar
                initialFocus
                mode="single"
                defaultMonth={date}
                selected={date}
                onSelect={setDate}
                className="rounded-md border-0"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}


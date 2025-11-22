'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface CompactDatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  fromDate?: Date;
  toDate?: Date;
  defaultMonth?: Date;
  disabled?: boolean;
  placeholder?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function CompactDatePicker({
  value,
  onChange,
  fromDate,
  toDate,
  defaultMonth,
  disabled,
  placeholder = 'Pick a date',
}: CompactDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedMonth, setSelectedMonth] = React.useState<number>(
    value?.getMonth() ?? defaultMonth?.getMonth() ?? new Date().getMonth()
  );
  const [selectedYear, setSelectedYear] = React.useState<number>(
    value?.getFullYear() ?? defaultMonth?.getFullYear() ?? new Date().getFullYear()
  );

  // Generate year options
  const currentYear = new Date().getFullYear();
  const minYear = fromDate?.getFullYear() ?? currentYear - 100;
  const maxYear = toDate?.getFullYear() ?? currentYear - 18;
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i).reverse();

  // Get days in selected month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();

  // Check if date is valid (within range)
  const isDateValid = (day: number) => {
    const date = new Date(selectedYear, selectedMonth, day);
    if (fromDate && date < fromDate) return false;
    if (toDate && date > toDate) return false;
    return true;
  };

  // Check if date is selected
  const isDateSelected = (day: number) => {
    if (!value) return false;
    return (
      value.getDate() === day &&
      value.getMonth() === selectedMonth &&
      value.getFullYear() === selectedYear
    );
  };

  // Handle date selection
  const handleDateSelect = (day: number) => {
    if (!isDateValid(day)) return;
    const newDate = new Date(selectedYear, selectedMonth, day);
    onChange(newDate);
    setOpen(false);
  };

  // Handle month change
  const handleMonthChange = (monthIndex: string) => {
    const newMonth = parseInt(monthIndex);
    setSelectedMonth(newMonth);
    // If current date is invalid for new month, clear selection
    if (value) {
      const newDate = new Date(selectedYear, newMonth, value.getDate());
      if (!isDateValid(value.getDate()) || newDate.getMonth() !== newMonth) {
        onChange(undefined);
      }
    }
  };

  // Handle year change
  const handleYearChange = (year: string) => {
    const newYear = parseInt(year);
    setSelectedYear(newYear);
    // If current date is invalid for new year, clear selection
    if (value) {
      const newDate = new Date(newYear, selectedMonth, value.getDate());
      if (!isDateValid(value.getDate()) || newDate.getFullYear() !== newYear) {
        onChange(undefined);
      }
    }
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  // Generate calendar days
  const calendarDays: (number | null)[] = [];
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground'
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'PPP') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="space-y-3">
          {/* Month and Year Selectors */}
          <div className="flex items-center gap-2">
            <Select
              value={selectedMonth.toString()}
              onValueChange={handleMonthChange}
            >
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedYear.toString()}
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="h-8 w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1 ml-auto">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigateMonth('prev')}
                type="button"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigateMonth('next')}
                type="button"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-2">
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground w-8"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="w-8 h-8" />;
                }

                const isValid = isDateValid(day);
                const isSelected = isDateSelected(day);
                const isToday =
                  day === new Date().getDate() &&
                  selectedMonth === new Date().getMonth() &&
                  selectedYear === new Date().getFullYear();

                return (
                  <Button
                    key={day}
                    variant="ghost"
                    className={cn(
                      'h-8 w-8 p-0 font-normal',
                      !isValid && 'opacity-40 cursor-not-allowed',
                      isSelected &&
                        'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                      !isSelected &&
                        isValid &&
                        'hover:bg-accent hover:text-accent-foreground',
                      isToday && !isSelected && 'border border-primary/50'
                    )}
                    onClick={() => handleDateSelect(day)}
                    disabled={!isValid}
                    type="button"
                  >
                    {day}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}


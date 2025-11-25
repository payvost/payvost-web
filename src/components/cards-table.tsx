
'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { VirtualCardData, CardStatus } from '@/types/virtual-card';
import { ListFilter, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';


const statusVariant: { [key in CardStatus]: 'default' | 'secondary' | 'destructive' } = {
  active: 'default',
  frozen: 'secondary',
  terminated: 'destructive',
};

const statusBg: { [key in CardStatus]: string } = {
  active: 'bg-green-500/20 text-green-700 border-green-500/30',
  frozen: 'bg-blue-500/20 text-blue-700 border-blue-500/30',
  terminated: 'bg-red-500/20 text-red-700 border-red-500/30',
};


const columns: ColumnDef<VirtualCardData>[] = [
  {
    accessorKey: 'cardLabel',
    header: 'Card',
    cell: ({ row }) => (
      <div className="font-medium">
        <div>{row.original.cardLabel}</div>
        <div className="text-xs text-muted-foreground font-mono">
            {row.original.cardModel === 'credit' ? 'Credit' : 'Debit'} • {row.original.cardType === 'visa' ? 'Visa' : 'Mastercard'} •••• {row.original.last4}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge
        variant={statusVariant[row.original.status]}
        className={cn('capitalize', statusBg[row.original.status])}
      >
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: 'balance',
    header: () => <div className="text-right">Balance / Credit</div>,
    cell: ({ row }) => {
      const isCredit = row.original.cardModel === 'credit';
      const amount = isCredit ? (row.original.availableCredit ?? 0) : row.original.balance;
      const currency = row.original.currency || 'USD'; // Fallback to USD
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);

      return (
        <div className="text-right font-mono">
          <div>{formatted}</div>
          <div className="text-xs text-muted-foreground">{isCredit ? 'Available Credit' : 'Balance'}</div>
        </div>
      );
    },
  },
  {
    accessorKey: 'spendingLimit',
    header: 'Spending Limit',
    cell: ({ row }) => {
        const limit = row.original.spendingLimit;
        if (!limit || !limit.amount) return <span className="text-muted-foreground">None</span>;
        
        const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: row.original.currency || 'USD', // Fallback to USD
        }).format(limit.amount);
        
        const intervalText = limit.interval.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

        return <div>{formatted} <span className="text-muted-foreground text-xs">/ {intervalText}</span></div>
    }
  },
];

interface CardsTableProps {
  data: VirtualCardData[];
  onRowClick: (card: VirtualCardData) => void;
}

export function CardsTable({ data, onRowClick }: CardsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div>
        <div className="flex items-center py-4 gap-2">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by label or last 4..."
                    value={(table.getColumn('cardLabel')?.getFilterValue() as string) ?? ''}
                    onChange={(event) => table.getColumn('cardLabel')?.setFilterValue(event.target.value)}
                    className="pl-10"
                />
            </div>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="ml-auto">
                                    <ListFilter className="mr-2 h-4 w-4" />
                                    Filter by Status
                                </Button>
                            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {['active', 'frozen', 'terminated'].map((status) => (
                <DropdownMenuCheckboxItem
                    key={status}
                    className="capitalize"
                    checked={(table.getColumn('status')?.getFilterValue() as string[] ?? []).includes(status)}
                    onCheckedChange={(value) => {
                        const currentFilter = (table.getColumn('status')?.getFilterValue() as string[] ?? []);
                        const newFilter = value ? [...currentFilter, status] : currentFilter.filter(s => s !== status);
                        table.getColumn('status')?.setFilterValue(newFilter.length ? newFilter : undefined);
                    }}
                >
                    {status}
                </DropdownMenuCheckboxItem>
                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Filter cards by status</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <ContextMenu key={row.id}>
                  <ContextMenuTrigger asChild>
                    <TableRow
                      data-state={row.getIsSelected() && 'selected'}
                      onClick={() => onRowClick(row.original)}
                      className="cursor-pointer"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => onRowClick(row.original)}>
                      View Details
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => navigator.clipboard.writeText(row.original.last4)}>
                      Copy Card Number
                    </ContextMenuItem>
                    <ContextMenuItem disabled={row.original.status === 'terminated'}>
                      {row.original.status === 'active' ? 'Freeze Card' : 'Activate Card'}
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No cards found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

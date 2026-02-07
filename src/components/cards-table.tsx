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
import { ListFilter, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';

import type { CardStatus, CardSummary } from '@/types/cards-v2';

const statusVariant: Record<CardStatus, 'default' | 'secondary' | 'destructive'> = {
  ACTIVE: 'default',
  FROZEN: 'secondary',
  TERMINATED: 'destructive',
};

const statusBg: Record<CardStatus, string> = {
  ACTIVE: 'bg-green-500/20 text-green-700 border-green-500/30',
  FROZEN: 'bg-blue-500/20 text-blue-700 border-blue-500/30',
  TERMINATED: 'bg-red-500/20 text-red-700 border-red-500/30',
};

function formatExpiry(card: CardSummary) {
  if (!card.expMonth || !card.expYear) return '—';
  return `${String(card.expMonth).padStart(2, '0')}/${String(card.expYear).slice(-2)}`;
}

const columns: ColumnDef<CardSummary>[] = [
  {
    accessorKey: 'label',
    header: 'Card',
    cell: ({ row }) => (
      <div className="font-medium">
        <div>{row.original.label}</div>
        <div className="text-xs text-muted-foreground font-mono">
          {row.original.type} • {row.original.network} •••• {row.original.last4}
        </div>
      </div>
    ),
  },
  {
    id: 'assigned',
    header: 'Assigned',
    cell: ({ row }) => {
      const id = row.original.assignedToUserId;
      if (!id) return <span className="text-muted-foreground">â€”</span>;
      return <span className="font-mono text-xs">{String(id).slice(0, 8)}â€¦</span>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status]} className={cn('capitalize', statusBg[row.original.status])}>
        {row.original.status.toLowerCase()}
      </Badge>
    ),
  },
  {
    accessorKey: 'currency',
    header: 'Currency',
    cell: ({ row }) => <span className="font-mono">{row.original.currency}</span>,
  },
  {
    id: 'expiry',
    header: 'Expires',
    cell: ({ row }) => <span className="font-mono">{formatExpiry(row.original)}</span>,
  },
  {
    id: 'limit',
    header: 'Limit',
    cell: ({ row }) => {
      const c = row.original.controls;
      if (!c || !c.spendLimitAmount) return <span className="text-muted-foreground">None</span>;
      const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: row.original.currency }).format(Number(c.spendLimitAmount));
      return (
        <div>
          {formatted}{' '}
          <span className="text-muted-foreground text-xs">
            / {c.spendLimitInterval.toLowerCase().replace('_', ' ')}
          </span>
        </div>
      );
    },
  },
];

export function CardsTable(props: {
  data: CardSummary[];
  onRowClick: (card: CardSummary) => void;
  onFreezeToggle?: (card: CardSummary) => void;
  onTerminate?: (card: CardSummary) => void;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data: props.data,
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
            value={(table.getColumn('label')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('label')?.setFilterValue(event.target.value)}
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
                  {(['ACTIVE', 'FROZEN', 'TERMINATED'] as const).map((status) => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      className="capitalize"
                      checked={((table.getColumn('status')?.getFilterValue() as string[]) ?? []).includes(status)}
                      onCheckedChange={(value) => {
                        const currentFilter = ((table.getColumn('status')?.getFilterValue() as string[]) ?? []);
                        const newFilter = value ? [...currentFilter, status] : currentFilter.filter((s) => s !== status);
                        table.getColumn('status')?.setFilterValue(newFilter.length ? newFilter : undefined);
                      }}
                    >
                      {status.toLowerCase()}
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
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
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
                      onClick={() => props.onRowClick(row.original)}
                      className="cursor-pointer"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => props.onRowClick(row.original)}>View Details</ContextMenuItem>
                    <ContextMenuItem onClick={() => navigator.clipboard.writeText(row.original.last4)}>Copy Last 4</ContextMenuItem>
                    <ContextMenuItem
                      disabled={row.original.status === 'TERMINATED'}
                      onClick={() => props.onFreezeToggle?.(row.original)}
                    >
                      {row.original.status === 'ACTIVE' ? 'Freeze Card' : 'Unfreeze Card'}
                    </ContextMenuItem>
                    <ContextMenuItem
                      disabled={row.original.status === 'TERMINATED'}
                      className="text-destructive"
                      onClick={() => props.onTerminate?.(row.original)}
                    >
                      Terminate Card
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

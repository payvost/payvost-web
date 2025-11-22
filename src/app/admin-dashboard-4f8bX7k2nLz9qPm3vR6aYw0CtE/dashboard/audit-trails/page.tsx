'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FileDown, Search, User, KeyRound, Edit, Power, Eye, Loader2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

interface AuditLog {
  id: string;
  uid: string;
  userName?: string;
  userType?: string;
  action: string;
  timestamp: Date | string;
  ip: string;
  metadata?: Record<string, any>;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const actionIcons: { [key: string]: React.ReactNode } = {
  Suspended: <Power className="h-4 w-4 text-destructive" />,
  Viewed: <Eye className="h-4 w-4 text-blue-500" />,
  Rolled: <KeyRound className="h-4 w-4 text-orange-500" />,
  Logged: <User className="h-4 w-4 text-green-500" />,
  updated: <Edit className="h-4 w-4 text-yellow-500" />,
  Failed: <User className="h-4 w-4 text-red-500" />,
  Created: <User className="h-4 w-4 text-green-500" />,
  Deleted: <Power className="h-4 w-4 text-destructive" />,
  Modified: <Edit className="h-4 w-4 text-yellow-500" />,
  Login: <User className="h-4 w-4 text-green-500" />,
  Logout: <User className="h-4 w-4 text-muted-foreground" />,
};

const getIconForAction = (action: string) => {
  const actionKey = Object.keys(actionIcons).find(key => 
    action.toLowerCase().includes(key.toLowerCase())
  );
  return actionKey ? actionIcons[actionKey] : <User className="h-4 w-4 text-muted-foreground" />;
};

const formatTimestamp = (timestamp: Date | string): string => {
  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return format(date, 'yyyy-MM-dd HH:mm:ss');
  } catch {
    return 'Invalid date';
  }
};

export default function AuditTrailsPage() {
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [userType, setUserType] = React.useState('all');
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  const [pagination, setPagination] = React.useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [searchDebounce, setSearchDebounce] = React.useState<NodeJS.Timeout | null>(null);

  const fetchLogs = React.useCallback(async (currentPage: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
      });

      if (search) {
        params.append('search', search);
      }
      if (userType !== 'all') {
        params.append('userType', userType);
      }
      if (dateRange?.from) {
        params.append('startDate', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append('endDate', dateRange.to.toISOString());
      }

      const response = await fetch(`/api/admin/audit-trails?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch audit logs: ${response.statusText}`);
      }

      const data = await response.json();
      setLogs(data.logs || []);
      setPagination(data.pagination || {
        page: currentPage,
        limit: 50,
        total: 0,
        totalPages: 0,
      });
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, userType, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()]);

  // Debounce search input
  React.useEffect(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchLogs(1);
    }, 500);

    setSearchDebounce(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [search, fetchLogs]);

  // Fetch logs when filters change
  React.useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLogs(1);
  }, [userType, dateRange?.from?.toISOString(), dateRange?.to?.toISOString(), fetchLogs]);

  // Fetch logs when page changes
  React.useEffect(() => {
    fetchLogs(pagination.page);
  }, [pagination.page, fetchLogs]);

  // Initial fetch
  React.useEffect(() => {
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExportCSV = () => {
    try {
      const headers = ['User', 'User Type', 'Action', 'IP Address', 'Timestamp'];
      const rows = logs.map(log => [
        log.userName || 'Unknown',
        log.userType || 'Unknown',
        log.action,
        log.ip,
        formatTimestamp(log.timestamp),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `audit-trails-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError('Failed to export CSV');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audit Trails</h2>
          <p className="text-muted-foreground">A chronological log of all user and admin activities.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={handleExportCSV}
            disabled={loading || logs.length === 0}
          >
            <FileDown className="mr-2 h-4 w-4" />Export CSV
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-2 justify-between">
            <div className="relative flex-1 md:grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by user, action, or IP..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-col md:flex-row gap-2">
              <Select value={userType} onValueChange={setUserType}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by User Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="customer">Customers</SelectItem>
                </SelectContent>
              </Select>
              <DateRangePicker 
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading audit logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No audit logs found. Try adjusting your filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="font-medium">{log.userName || 'Unknown User'}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        <Badge variant={log.userType === 'Admin' ? 'secondary' : 'outline'}>
                          {log.userType || 'Unknown'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getIconForAction(log.action)}
                        <span>{log.action}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{log.ip}</TableCell>
                    <TableCell className="text-right text-sm">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-muted-foreground">
              Showing <strong>
                {logs.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
              </strong> - <strong>
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </strong> of <strong>{pagination.total}</strong> log entries
            </div>
            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </>
  );
}

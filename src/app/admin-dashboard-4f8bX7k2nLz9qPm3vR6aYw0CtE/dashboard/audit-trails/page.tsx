
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { FileDown, ListFilter, Search, User, KeyRound, Edit, Power, Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const auditLogs = [
  { id: 'log_1', userType: 'Admin', userName: 'Admin User', action: 'Suspended merchant: Gourmet Goods', timestamp: '2024-08-15 10:45:12 UTC', ip: '8.8.8.8' },
  { id: 'log_2', userType: 'Admin', userName: 'Support Staff', action: 'Viewed customer: Liam Johnson', timestamp: '2024-08-15 11:02:30 UTC', ip: '104.16.10.5' },
  { id: 'log_3', userType: 'Admin', userName: 'Admin User', action: 'Rolled live secret API key', timestamp: '2024-08-15 09:15:05 UTC', ip: '8.8.8.8' },
  { id: 'log_4', userType: 'Customer', userName: 'Olivia Martin', action: 'Logged in successfully', timestamp: '2024-08-15 14:30:00 UTC', ip: '198.51.100.2' },
  { id: 'log_5', userType: 'Customer', userName: 'Jackson Lee', action: 'Password updated', timestamp: '2024-08-14 18:20:10 UTC', ip: '203.0.113.15' },
  { id: 'log_6', userType: 'Customer', userName: 'Jackson Lee', action: 'Failed login attempt (wrong password)', timestamp: '2024-08-14 18:19:55 UTC', ip: '203.0.113.15' },
];

const actionIcons: { [key: string]: React.ReactNode } = {
    Suspended: <Power className="h-4 w-4 text-destructive" />,
    Viewed: <Eye className="h-4 w-4 text-blue-500" />,
    Rolled: <KeyRound className="h-4 w-4 text-orange-500" />,
    Logged: <User className="h-4 w-4 text-green-500" />,
    updated: <Edit className="h-4 w-4 text-yellow-500" />,
    Failed: <User className="h-4 w-4 text-red-500" />,
}

const getIconForAction = (action: string) => {
    const actionKey = Object.keys(actionIcons).find(key => action.toLowerCase().includes(key.toLowerCase()));
    return actionKey ? actionIcons[actionKey] : <User className="h-4 w-4 text-muted-foreground" />;
}

export default function AuditTrailsPage() {

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Audit Trails</h2>
                    <p className="text-muted-foreground">A chronological log of all user and admin activities.</p>
                </div>
                 <div className="flex items-center space-x-2">
                    <Button variant="outline"><FileDown className="mr-2 h-4 w-4" />Export CSV</Button>
                </div>
            </div>
            
             <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-2 justify-between">
                        <div className="relative flex-1 md:grow-0">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by user, action, or IP..."
                                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                            />
                        </div>
                        <div className="flex flex-col md:flex-row gap-2">
                             <Select>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <SelectValue placeholder="Filter by User Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Users</SelectItem>
                                    <SelectItem value="admin">Admins</SelectItem>
                                    <SelectItem value="customer">Customers</SelectItem>
                                </SelectContent>
                            </Select>
                            <DateRangePicker />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
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
                           {auditLogs.map(log => (
                               <TableRow key={log.id}>
                                   <TableCell>
                                       <div className="font-medium">{log.userName}</div>
                                       <div className="text-xs text-muted-foreground">
                                         <Badge variant={log.userType === 'Admin' ? 'secondary' : 'outline'}>{log.userType}</Badge>
                                       </div>
                                   </TableCell>
                                   <TableCell>
                                       <div className="flex items-center gap-2">
                                           {getIconForAction(log.action)}
                                           <span>{log.action}</span>
                                       </div>
                                   </TableCell>
                                   <TableCell className="font-mono">{log.ip}</TableCell>
                                   <TableCell className="text-right">{log.timestamp}</TableCell>
                               </TableRow>
                           ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter>
                    <div className="text-xs text-muted-foreground">
                        Showing <strong>1-{auditLogs.length}</strong> of <strong>{auditLogs.length}</strong> log entries
                    </div>
                </CardFooter>
            </Card>
        </>
    )
}


'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, FileDown, Edit, Trash2, Settings, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';

const savedReports = [
    { id: 'rep_1', name: 'Monthly Transaction Volume (USD)', createdAt: '2024-08-10', createdBy: 'Admin User' },
    { id: 'rep_2', name: 'New User Signups (Last 90 Days)', createdAt: '2024-08-05', createdBy: 'Admin User' },
    { id: 'rep_3', name: 'Failed Payouts by Reason (Q3)', createdAt: '2024-08-01', createdBy: 'Support Staff' },
];

export default function CustomReportsPage() {
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Custom Reporting</h2>
                    <p className="text-muted-foreground">Build, save, and download custom reports from your platform data.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                    {/* Report Builder Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Report Builder</CardTitle>
                            <CardDescription>Select a data source and configure your report.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div className="space-y-2">
                                <Label>1. Select Data Source</Label>
                                <Select>
                                    <SelectTrigger><SelectValue placeholder="e.g., Transactions, Users, Payouts..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="transactions">Transactions</SelectItem>
                                        <SelectItem value="users">Users</SelectItem>
                                        <SelectItem value="payouts">Payouts</SelectItem>
                                        <SelectItem value="disputes">Disputes</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <Separator />

                            <div className="space-y-2">
                                <Label>2. Select Columns</Label>
                                <p className="text-xs text-muted-foreground">Choose the data points to include in your report.</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                    {['ID', 'Date', 'Status', 'Amount', 'Currency', 'User Email', 'Country', 'Fee'].map(col => (
                                         <div key={col} className="flex items-center space-x-2">
                                            <Checkbox id={`col-${col}`} />
                                            <Label htmlFor={`col-${col}`} className="font-normal">{col}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <Separator />

                            <div className="space-y-4">
                                 <Label>3. Add Filters</Label>
                                 <div className="flex items-end gap-2">
                                    <div className="flex-1 space-y-2">
                                        <Select>
                                            <SelectTrigger><SelectValue placeholder="Column" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="status">Status</SelectItem>
                                                <SelectItem value="country">Country</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <Select>
                                            <SelectTrigger><SelectValue placeholder="Operator" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="is">Is</SelectItem>
                                                <SelectItem value="is-not">Is Not</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <Input placeholder="Value (e.g., 'Completed')" />
                                    </div>
                                     <Button variant="outline" size="icon"><PlusCircle className="h-4 w-4" /></Button>
                                 </div>
                            </div>

                             <Separator />

                             <div className="space-y-2">
                                 <Label>4. Select Date Range</Label>
                                <DateRangePicker />
                             </div>


                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    {/* Saved Reports Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Saved Reports</CardTitle>
                            <CardDescription>Your previously created and saved reports.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {savedReports.map(report => (
                                        <TableRow key={report.id}>
                                            <TableCell>
                                                <div className="font-medium">{report.name}</div>
                                                <div className="text-xs text-muted-foreground">Created by {report.createdBy}</div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem><FileDown className="mr-2 h-4 w-4"/>Download Again</DropdownMenuItem>
                                                        <DropdownMenuItem><Edit className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}


'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Search, FileDown, Clock, Check, FileText } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const scheduledReports = [
  { id: 'sch_1', name: 'Weekly SAR Filing', frequency: 'Weekly', nextRun: '2024-08-19', status: 'Active' },
  { id: 'sch_2', name: 'Monthly LTR to FinCEN', frequency: 'Monthly', nextRun: '2024-09-01', status: 'Active' },
  { id: 'sch_3', name: 'Quarterly UK Compliance', frequency: 'Quarterly', nextRun: '2024-10-01', status: 'Paused' },
];

const reportHistory = [
    { id: 'rep_123', name: 'SAR-2024-08-12', type: 'SAR', date: '2024-08-12', generatedBy: 'Admin User' },
    { id: 'rep_122', name: 'LTR-2024-08-01', type: 'LTR', date: '2024-08-01', generatedBy: 'System' },
    { id: 'rep_121', name: 'Custom-Fraud-Report', type: 'Custom', date: '2024-07-30', generatedBy: 'Admin User' },
];

export default function RegulatoryReportingPage() {
    const { toast } = useToast();

    const handleGenerateReport = () => {
        toast({
            title: "Report Generation Started",
            description: "Your report is being generated and will be available in the history section shortly.",
        });
    }

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Regulatory Reporting</h2>
                    <p className="text-muted-foreground">Generate, schedule, and download compliance reports.</p>
                </div>
                 <div className="flex items-center space-x-2">
                    <Button variant="outline">View Audit Logs</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Generate Report</CardTitle>
                            <CardDescription>Create a one-time report based on specific templates and date ranges.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Report Type</Label>
                                    <Select>
                                        <SelectTrigger><SelectValue placeholder="Select report type..."/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sar">Suspicious Activity Report (SAR)</SelectItem>
                                            <SelectItem value="ltr">Large Transaction Report (LTR)</SelectItem>
                                            <SelectItem value="custom">Custom Report</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="space-y-2">
                                    <Label>Country Template</Label>
                                    <Select>
                                        <SelectTrigger><SelectValue placeholder="Select a template..."/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="us-fincen">USA - FinCEN</SelectItem>
                                            <SelectItem value="uk-nca">UK - NCA</SelectItem>
                                            <SelectItem value="ca-fintrac">Canada - FINTRAC</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Date Range</Label>
                                <DateRangePicker />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleGenerateReport}>Generate Report</Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Report History</CardTitle>
                            <CardDescription>List of recently generated reports.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Report Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reportHistory.map(report => (
                                        <TableRow key={report.id}>
                                            <TableCell className="font-medium">{report.name}</TableCell>
                                            <TableCell><Badge variant="outline">{report.type}</Badge></TableCell>
                                            <TableCell>{report.date}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm"><FileDown className="mr-2 h-4 w-4"/>Download</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                </div>
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Scheduled Reports</CardTitle>
                            <CardDescription>Manage automated recurring reports.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {scheduledReports.map(report => (
                                        <TableRow key={report.id}>
                                            <TableCell>
                                                <div className="font-medium">{report.name}</div>
                                                <div className="text-xs text-muted-foreground">Next run: {report.nextRun}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={report.status === 'Active' ? 'default' : 'secondary'}>{report.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem>Edit Schedule</DropdownMenuItem>
                                                        <DropdownMenuItem>Pause/Resume</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" className="w-full"><PlusCircle className="mr-2 h-4 w-4"/>New Scheduled Report</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </>
    );
}

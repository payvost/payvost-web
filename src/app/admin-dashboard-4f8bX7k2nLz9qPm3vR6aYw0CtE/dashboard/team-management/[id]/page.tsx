
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, Mail, User, Clock, Shield, KeyRound, Monitor, Power, FileClock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { TeamMember } from '@/types/team-member';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const memberDetails: TeamMember = {
    id: 'tm_1',
    name: 'Admin User',
    email: 'admin@qwibik.com',
    role: 'Super Admin',
    status: 'Active',
    lastActive: '2024-08-15 10:30 AM',
    sessions: [
        { id: 'sess_1', ip: '192.168.1.1', device: 'Chrome on macOS', lastSeen: '2 hours ago' },
        { id: 'sess_2', ip: '10.0.0.5', device: 'Safari on iPhone', lastSeen: '5 hours ago' },
    ],
    activityLog: [
        { id: 'log_1', action: 'Suspended merchant: Gourmet Goods', timestamp: '2024-08-15 10:45 AM' },
        { id: 'log_3', action: 'Rolled live secret API key', timestamp: '2024-08-15 09:15 AM' },
    ]
};

const statusConfig = {
    Active: { color: 'text-green-600', variant: 'default' as const },
    Invited: { color: 'text-yellow-600', variant: 'secondary' as const },
    Suspended: { color: 'text-red-600', variant: 'destructive' as const },
};

export default function TeamMemberDetailsPage() {
    const member = memberDetails; // Fetch by params.id in real app
    const status = statusConfig[member.status];

     const getInitials = (name: string) => {
        const names = name.split(' ');
        if (names.length > 1 && names[1]) return `${names[0][0]}${names[1][0]}`;
        return name.substring(0, 2).toUpperCase();
    }

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                        <Link href="/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/team-management">
                           <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                     <Avatar className="h-12 w-12">
                        <AvatarImage src={`https://placehold.co/100x100.png`} data-ai-hint="admin portrait" />
                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-3xl font-bold tracking-tight">{member.name}</h2>
                             <Badge variant={status.variant} className={cn("capitalize", status.color.replace('text-','bg-').replace('-600','-500/20'))}>{member.status}</Badge>
                        </div>
                        <p className="text-muted-foreground">{member.email}</p>
                    </div>
                </div>
                 <div className="flex items-center space-x-2">
                    <Button variant="outline"><KeyRound className="mr-2 h-4 w-4" />Force Logout</Button>
                    <Button variant="destructive"><Power className="mr-2 h-4 w-4" />Suspend User</Button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>A log of the most recent actions taken by this user.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Action</TableHead>
                                        <TableHead className="text-right">Timestamp</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {member.activityLog?.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell>{log.action}</TableCell>
                                            <TableCell className="text-right">{log.timestamp}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                         <CardFooter>
                            <Button variant="secondary">View Full Activity Log</Button>
                        </CardFooter>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>Active Sessions</CardTitle>
                            <CardDescription>Manage this user's logged-in sessions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Device</TableHead>
                                        <TableHead>IP Address</TableHead>
                                        <TableHead>Last Seen</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {member.sessions?.map((session) => (
                                        <TableRow key={session.id}>
                                            <TableCell className="font-medium flex items-center gap-2"><Monitor className="h-4 w-4"/>{session.device}</TableCell>
                                            <TableCell className="font-mono">{session.ip}</TableCell>
                                            <TableCell>{session.lastSeen}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="destructive" size="sm">Revoke</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5"/>Role & Permissions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="space-y-2">
                            <Label htmlFor="role">Assigned Role</Label>
                            <Select defaultValue={member.role}>
                                <SelectTrigger id="role">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Super Admin">Super Admin</SelectItem>
                                    <SelectItem value="Admin">Admin</SelectItem>
                                    <SelectItem value="Support">Support</SelectItem>
                                    <SelectItem value="Compliance">Compliance</SelectItem>
                                    <SelectItem value="Developer">Developer</SelectItem>
                                </SelectContent>
                            </Select>
                           </div>
                           <Button className="w-full">Update Role</Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><FileClock className="h-5 w-5"/>User Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">User ID</span>
                                <span className="font-mono">{member.id}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Last Active</span>
                                <span className="font-medium">{member.lastActive}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

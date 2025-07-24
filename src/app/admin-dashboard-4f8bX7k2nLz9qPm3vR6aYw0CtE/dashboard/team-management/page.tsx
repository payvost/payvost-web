
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Search, UserCheck, UserCog, UserX, Shield, FileClock, ShieldCheck } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { TeamMember, MemberRole, MemberStatus } from '@/types/team-member';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const sampleMembers: TeamMember[] = [
    { id: 'tm_1', name: 'Admin User', email: 'admin@qwibik.com', role: 'Super Admin', status: 'Active', lastActive: '2024-08-15 10:30 AM' },
    { id: 'tm_2', name: 'Support Staff', email: 'support@qwibik.com', role: 'Support', status: 'Active', lastActive: '2024-08-15 11:00 AM' },
    { id: 'tm_3', name: 'Compliance Officer', email: 'compliance@qwibik.com', role: 'Compliance', status: 'Invited', lastActive: 'Never' },
    { id: 'tm_4', name: 'Suspended Admin', email: 'suspended@qwibik.com', role: 'Admin', status: 'Suspended', lastActive: '2024-08-14 05:00 PM' },
];

const roles = [
    { id: 'role_1', name: 'Super Admin', description: 'Full access to all modules and settings.', members: 1 },
    { id: 'role_2', name: 'Admin', description: 'Can manage most aspects of the platform.', members: 1 },
    { id: 'role_3', name: 'Support', description: 'Can view customer data and respond to tickets.', members: 1 },
    { id: 'role_4', name: 'Compliance', description: 'Access to KYC/AML and risk management tools.', members: 1 },
    { id: 'role_5', name: 'Developer', description: 'Access to API settings and sandbox environments.', members: 0 },
];

const activityLogs = [
    { id: 'log_1', user: 'Admin User', action: 'Suspended merchant: Gourmet Goods', module: 'Merchant Management', ip: '192.168.1.1', timestamp: '2024-08-15 10:45 AM' },
    { id: 'log_2', user: 'Support Staff', action: 'Viewed customer: Liam Johnson', module: 'Customers', ip: '10.0.0.5', timestamp: '2024-08-15 11:02 AM' },
    { id: 'log_3', user: 'Admin User', action: 'Rolled live secret API key', module: 'API Settings', ip: '192.168.1.1', timestamp: '2024-08-15 09:15 AM' },
];

const statusConfig: Record<MemberStatus, { color: string, variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    Active: { color: 'text-green-600', variant: 'default' },
    Invited: { color: 'text-yellow-600', variant: 'secondary' },
    Suspended: { color: 'text-red-600', variant: 'destructive' },
};

export default function TeamManagementPage() {
    const router = useRouter();

    const getInitials = (name: string) => {
        const names = name.split(' ');
        if (names.length > 1 && names[1]) return `${names[0][0]}${names[1][0]}`;
        return name.substring(0, 2).toUpperCase();
    }

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Team Management</h2>
                    <p className="text-muted-foreground">Manage your internal team, roles, and permissions.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline">Manage Permissions</Button>
                    <Button onClick={() => {}}><PlusCircle className="mr-2 h-4 w-4" />Invite User</Button>
                </div>
            </div>

            <Tabs defaultValue="members">
                <TabsList>
                    <TabsTrigger value="members">Team Members</TabsTrigger>
                    <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
                    <TabsTrigger value="activity">Activity Log</TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="mt-6">
                    <Card>
                        <CardHeader>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input type="search" placeholder="Search by name or email..." className="w-full rounded-lg bg-background pl-8 md:w-[320px]" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Last Active</TableHead>
                                        <TableHead><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sampleMembers.map((member) => {
                                        const status = statusConfig[member.status];
                                        return (
                                        <TableRow key={member.id} onClick={() => router.push(`/admin-panel/dashboard/team-management/${member.id}`)} className="cursor-pointer">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={`https://placehold.co/100x100.png`} data-ai-hint="person portrait" />
                                                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{member.name}</div>
                                                        <div className="text-sm text-muted-foreground">{member.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell><Badge variant={status.variant} className={cn('capitalize', status.color.replace('text-','bg-').replace('-600','-500/20'))}>{member.status}</Badge></TableCell>
                                            <TableCell><Badge variant="outline">{member.role}</Badge></TableCell>
                                            <TableCell>{member.lastActive}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Toggle menu</span></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>View Details</DropdownMenuItem>
                                                        <DropdownMenuItem>Edit Role</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive">Suspend User</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )})}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="roles" className="mt-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Roles</CardTitle>
                            <CardDescription>Define roles to control what your team members can see and do.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {roles.map(role => (
                                <div key={role.id} className="p-4 border rounded-lg flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold">{role.name}</h4>
                                        <p className="text-sm text-muted-foreground">{role.description}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-muted-foreground">{role.members} user(s)</span>
                                        <Button variant="outline" size="sm">Edit Permissions</Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="activity" className="mt-6">
                     <Card>
                        <CardHeader>
                             <CardTitle>Audit Trail</CardTitle>
                             <CardDescription>A log of all actions taken by internal team members.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Timestamp</TableHead>
                                        <TableHead>IP Address</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activityLogs.map(log => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-medium">{log.user}</TableCell>
                                            <TableCell>
                                                <div>{log.action}</div>
                                                <div className="text-xs text-muted-foreground">{log.module}</div>
                                            </TableCell>
                                            <TableCell>{log.timestamp}</TableCell>
                                            <TableCell className="font-mono">{log.ip}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </>
    );
}

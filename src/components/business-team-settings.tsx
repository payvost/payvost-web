
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { TeamMember, MemberRole, MemberStatus } from '@/types/team-member';
import { cn } from '@/lib/utils';

const sampleMembers: TeamMember[] = [
    { id: 'tm_1', name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', status: 'Active', lastActive: '2024-08-15 10:30 AM' },
    { id: 'tm_2', name: 'Bob Williams', email: 'bob@example.com', role: 'Finance', status: 'Active', lastActive: '2024-08-15 11:00 AM' },
    { id: 'tm_3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'Support', status: 'Invited', lastActive: 'Never' },
    { id: 'tm_4', name: 'Diana Miller', email: 'diana@example.com', role: 'Admin', status: 'Suspended', lastActive: '2024-08-14 05:00 PM' },
];

const roles = [
    { id: 'role_1', name: 'Admin', description: 'Can manage team members and business settings.', members: 2 },
    { id: 'role_2', name: 'Finance', description: 'Can initiate payouts and view financial data.', members: 1 },
    { id: 'role_3', name: 'Support', description: 'Can view customer data and respond to tickets.', members: 1 },
    { id: 'role_4', name: 'Developer', description: 'Access to API settings and sandbox environments.', members: 0 },
];

const statusConfig: Record<MemberStatus, { color: string, variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    Active: { color: 'text-green-600', variant: 'default' },
    Invited: { color: 'text-yellow-600', variant: 'secondary' },
    Suspended: { color: 'text-red-600', variant: 'destructive' },
};

export function BusinessTeamSettings() {
    const getInitials = (name: string) => {
        const names = name.split(' ');
        if (names.length > 1 && names[1]) return `${names[0][0]}${names[1][0]}`;
        return name.substring(0, 2).toUpperCase();
    }

    return (
        <Tabs defaultValue="members">
            <TabsList className="mb-4">
                <TabsTrigger value="members">Team Members</TabsTrigger>
                <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
            </TabsList>
            <TabsContent value="members">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Team Members</CardTitle>
                                <CardDescription>Invite and manage your team members.</CardDescription>
                            </div>
                            <Button><PlusCircle className="mr-2 h-4 w-4"/>Invite Member</Button>
                        </div>
                         <div className="relative mt-4">
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
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={`https://i.pravatar.cc/150?u=${member.email}`} />
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
                                                <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Toggle menu</span></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>Edit Role</DropdownMenuItem>
                                                    <DropdownMenuItem>Resend Invitation</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive">Remove User</DropdownMenuItem>
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
            <TabsContent value="roles">
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
                     <CardFooter>
                        <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4"/>Create New Role</Button>
                    </CardFooter>
                </Card>
            </TabsContent>
        </Tabs>
    );
}


'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Search, UserCog, UserPlus, Mail, Trash2, Edit, Eye, Loader2, CheckCircle2, XCircle, Clock, Shield, AlertCircle, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '@/hooks/use-toast';
import type { TeamMember, MemberRole, MemberStatus } from '@/types/team-member';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';

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
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<MemberRole>('Support');
    const [inviteName, setInviteName] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);

    useEffect(() => {
        if (authLoading || !user) {
            if (!authLoading) setLoadingData(false);
            return;
        }

        // Assuming team members are in a subcollection. This can be adjusted.
        const teamMembersRef = collection(db, 'users', user.uid, 'teamMembers');
        const q = query(teamMembersRef);

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const membersData: TeamMember[] = [];
            querySnapshot.forEach((doc) => {
                membersData.push({ id: doc.id, ...doc.data() } as TeamMember);
            });
            setMembers(membersData);
            setLoadingData(false);
        }, (error) => {
            console.error("Error fetching team members: ", error);
            setLoadingData(false);
            toast({
                title: 'Error',
                description: 'Failed to load team members. Please refresh the page.',
                variant: 'destructive',
            });
        });

        return () => unsubscribe();
    }, [user, authLoading, toast]);

    const getInitials = (name: string) => {
        if (!name) return "";
        const names = name.split(' ');
        if (names.length > 1 && names[1]) return `${names[0][0]}${names[1][0]}`;
        return name.substring(0, 2).toUpperCase();
    };

    const handleInviteMember = async () => {
        if (!user || !inviteEmail || !inviteName) {
            toast({
                title: 'Validation Error',
                description: 'Please fill in all required fields.',
                variant: 'destructive',
            });
            return;
        }

        setIsInviting(true);
        try {
            const teamMembersRef = collection(db, 'users', user.uid, 'teamMembers');
            await addDoc(teamMembersRef, {
                name: inviteName,
                email: inviteEmail,
                role: inviteRole,
                status: 'Invited' as MemberStatus,
                lastActive: 'Never',
                invitedAt: serverTimestamp(),
                invitedBy: user.uid,
            });

            toast({
                title: 'Invitation Sent',
                description: `An invitation has been sent to ${inviteEmail}`,
            });

            setInviteEmail('');
            setInviteName('');
            setInviteRole('Support');
            setIsInviteDialogOpen(false);
        } catch (error) {
            console.error('Error inviting member:', error);
            toast({
                title: 'Error',
                description: 'Failed to send invitation. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsInviting(false);
        }
    };

    const handleEditRole = async (memberId: string, newRole: MemberRole) => {
        if (!user) return;

        try {
            const memberDocRef = doc(db, 'users', user.uid, 'teamMembers', memberId);
            await updateDoc(memberDocRef, {
                role: newRole,
                updatedAt: serverTimestamp(),
            });

            toast({
                title: 'Role Updated',
                description: 'Team member role has been updated successfully.',
            });
            setIsEditDialogOpen(false);
            setSelectedMember(null);
        } catch (error) {
            console.error('Error updating role:', error);
            toast({
                title: 'Error',
                description: 'Failed to update role. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handleRemoveMember = async (memberId: string, memberName: string) => {
        if (!user) return;
        if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) return;

        setIsRemoving(true);
        try {
            const memberDocRef = doc(db, 'users', user.uid, 'teamMembers', memberId);
            await deleteDoc(memberDocRef);

            toast({
                title: 'Member Removed',
                description: `${memberName} has been removed from the team.`,
            });
        } catch (error) {
            console.error('Error removing member:', error);
            toast({
                title: 'Error',
                description: 'Failed to remove member. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsRemoving(false);
        }
    };

    const filteredMembers = members.filter(member => 
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const roles: MemberRole[] = ['Super Admin', 'Admin', 'Support', 'Compliance', 'Developer', 'Finance'];

    return (
        <Tabs defaultValue="members">
            <TabsList className="mb-4">
                <TabsTrigger value="members" className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Team Members
                </TabsTrigger>
                <TabsTrigger value="roles" className="flex items-center gap-2">
                    <UserCog className="h-4 w-4" />
                    Roles & Permissions
                </TabsTrigger>
            </TabsList>
            <TabsContent value="members">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Team Members
                                </CardTitle>
                                <CardDescription>Invite and manage your team members with role-based access control.</CardDescription>
                            </div>
                            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <PlusCircle className="mr-2 h-4 w-4"/>
                                        Invite Member
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Invite Team Member</DialogTitle>
                                        <DialogDescription>
                                            Send an invitation to add a new team member to your business account.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name *</Label>
                                            <Input
                                                id="name"
                                                placeholder="John Doe"
                                                value={inviteName}
                                                onChange={(e) => setInviteName(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address *</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="john@example.com"
                                                value={inviteEmail}
                                                onChange={(e) => setInviteEmail(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="role">Role *</Label>
                                            <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as MemberRole)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map((role) => (
                                                        <SelectItem key={role} value={role}>{role}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleInviteMember} disabled={isInviting || !inviteEmail || !inviteName}>
                                            {isInviting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Mail className="mr-2 h-4 w-4" />
                                                    Send Invitation
                                                </>
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                         <div className="relative mt-4">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                type="search" 
                                placeholder="Search by name or email..." 
                                className="w-full rounded-lg bg-background pl-8 md:w-[320px]" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                       {loadingData ? (
                           <div className="space-y-4">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                           </div>
                       ) : filteredMembers.length > 0 ? (
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
                                    {filteredMembers.map((member) => {
                                        const status = statusConfig[member.status];
                                        return (
                                        <TableRow key={member.id} className="hover:bg-muted/50">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={`https://i.pravatar.cc/150?u=${member.email}`} />
                                                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                                            {getInitials(member.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{member.name}</div>
                                                        <div className="text-sm text-muted-foreground">{member.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant={status.variant} 
                                                    className={cn(
                                                        'capitalize flex items-center gap-1 w-fit',
                                                        member.status === 'Active' && 'bg-green-500/20 text-green-700 border-green-500/50',
                                                        member.status === 'Invited' && 'bg-yellow-500/20 text-yellow-700 border-yellow-500/50',
                                                        member.status === 'Suspended' && 'bg-red-500/20 text-red-700 border-red-500/50'
                                                    )}
                                                >
                                                    {member.status === 'Active' && <CheckCircle2 className="h-3 w-3" />}
                                                    {member.status === 'Invited' && <Clock className="h-3 w-3" />}
                                                    {member.status === 'Suspended' && <XCircle className="h-3 w-3" />}
                                                    {member.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-medium">{member.role}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">{member.lastActive}</span>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Toggle menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => { setSelectedMember(member); setIsEditDialogOpen(true); }}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => { setSelectedMember(member); setIsEditDialogOpen(true); }}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit Role
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            className="text-destructive"
                                                            onClick={() => handleRemoveMember(member.id, member.name)}
                                                            disabled={isRemoving}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Remove User
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )})}
                                </TableBody>
                            </Table>
                       ) : (
                           <div className="h-60 flex flex-col items-center justify-center text-center">
                                <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-xl font-semibold">No team members found</h3>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {searchQuery ? 'Try a different search term' : 'Invite team members and assign them roles with our advanced permission rules.'}
                                </p>
                           </div>
                       )}
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="roles">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Roles & Permissions
                        </CardTitle>
                        <CardDescription>Define roles to control what your team members can see and do in your business account.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {roles.map(role => {
                            const memberCount = members.filter(m => m.role === role).length;
                            const roleDescriptions: Record<MemberRole, string> = {
                                'Super Admin': 'Full access to all business settings and team management.',
                                'Admin': 'Can manage team members and business settings.',
                                'Finance': 'Can initiate payouts and view financial data.',
                                'Support': 'Can view customer data and respond to tickets.',
                                'Compliance': 'Access to KYC/AML documents and compliance tools.',
                                'Developer': 'Access to API settings and sandbox environments.',
                            };

                            return (
                                <div key={role} className="p-4 border rounded-lg flex items-center justify-between hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Shield className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-base">{role}</h4>
                                            <p className="text-sm text-muted-foreground mt-1">{roleDescriptions[role]}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant="secondary">{memberCount} user(s)</Badge>
                                        <Button variant="outline" size="sm">Edit Permissions</Button>
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                     <CardFooter>
                        <Button variant="outline">
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            Create New Role
                        </Button>
                    </CardFooter>
                </Card>
            </TabsContent>

            {/* Edit Role Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Team Member Role</DialogTitle>
                        <DialogDescription>
                            Change the role for {selectedMember?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {selectedMember && (
                            <Select 
                                defaultValue={selectedMember.role} 
                                onValueChange={(value) => handleEditRole(selectedMember.id, value as MemberRole)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem key={role} value={role}>{role}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setSelectedMember(null); }}>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Tabs>
    );
}

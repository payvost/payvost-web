
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, Mail, User, Clock, Shield, KeyRound, Monitor, Power, FileClock, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import axios from 'axios';

interface Session {
    id: string;
    device: string;
    lastSeen: string;
    validSince?: string;
}

interface ActivityLog {
    id: string;
    action: string;
    timestamp: Date | string;
    metadata?: any;
}

interface AdminProfile {
    id: string;
    name: string;
    email: string;
    role: string;
    status: 'Active' | 'Invited' | 'Suspended';
    lastActive: string;
    emailVerified?: boolean;
    createdAt?: string;
    photoURL?: string;
    sessions: Session[];
    activityLog: ActivityLog[];
}

const statusConfig = {
    Active: { color: 'text-green-600', variant: 'default' as const },
    Invited: { color: 'text-yellow-600', variant: 'secondary' as const },
    Suspended: { color: 'text-red-600', variant: 'destructive' as const },
};

export default function AdminProfilePage() {
    const [profile, setProfile] = useState<AdminProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [revokingSession, setRevokingSession] = useState<string | null>(null);

    useEffect(() => {
        async function fetchProfile() {
            try {
                setLoading(true);
                setError(null);
                const response = await axios.get('/api/admin/profile');
                setProfile(response.data.profile);
            } catch (err: any) {
                console.error('Error fetching profile:', err);
                setError(err.response?.data?.error || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, []);

    async function handleRevokeSession(sessionId: string) {
        if (!confirm('Are you sure you want to revoke this session? You may be logged out.')) {
            return;
        }

        try {
            setRevokingSession(sessionId);
            await axios.post('/api/admin/revoke-session', { sessionId });
            
            // Refresh profile data
            const response = await axios.get('/api/admin/profile');
            setProfile(response.data.profile);
            
            alert('Session revoked successfully');
        } catch (err: any) {
            console.error('Error revoking session:', err);
            alert(err.response?.data?.error || 'Failed to revoke session');
        } finally {
            setRevokingSession(null);
        }
    }

    if (loading) {
        return (
            <>
                <div className="flex items-center justify-between space-y-2 mb-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div>
                            <Skeleton className="h-8 w-48 mb-2" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-96" />
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        <Skeleton className="h-48" />
                    </div>
                </div>
            </>
        );
    }

    if (error || !profile) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <p className="text-destructive mb-4">⚠️ {error || 'Failed to load profile'}</p>
                    <Button onClick={() => window.location.reload()}>Retry</Button>
                </div>
            </div>
        );
    }

    const status = statusConfig[profile.status];

    const getInitials = (name: string) => {
        const names = name.split(' ');
        if (names.length > 1 && names[1]) return `${names[0][0]}${names[1][0]}`;
        return name.substring(0, 2).toUpperCase();
    };

    const formatTimestamp = (timestamp: Date | string) => {
        const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        return formatTimestamp(date);
    };

    return (
        <>
            {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
                    <p className="text-sm text-destructive">⚠️ {error}</p>
                </div>
            )}

            <div className="flex items-center justify-between space-y-2 mb-6">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={profile.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=100`} />
                        <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-3xl font-bold tracking-tight">{profile.name}</h2>
                            <Badge variant={status.variant} className={cn("capitalize", status.color.replace('text-','bg-').replace('-600','-500/20'))}>{profile.status}</Badge>
                        </div>
                        <p className="text-muted-foreground">{profile.email}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline"><KeyRound className="mr-2 h-4 w-4" />Change Password</Button>
                    <Button>Update Profile</Button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>A log of the most recent actions taken by you.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {profile.activityLog.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Action</TableHead>
                                            <TableHead className="text-right">Timestamp</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {profile.activityLog.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell>{log.action}</TableCell>
                                                <TableCell className="text-right">{formatTimestamp(log.timestamp)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button variant="secondary">View Full Activity Log</Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Active Sessions</CardTitle>
                            <CardDescription>Manage your logged-in sessions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {profile.sessions.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">No active sessions</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Device</TableHead>
                                            <TableHead>Last Seen</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {profile.sessions.map((session) => (
                                            <TableRow key={session.id}>
                                                <TableCell className="font-medium flex items-center gap-2">
                                                    <Monitor className="h-4 w-4"/>
                                                    {session.device}
                                                </TableCell>
                                                <TableCell>{session.lastSeen}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => handleRevokeSession(session.id)}
                                                        disabled={revokingSession === session.id}
                                                    >
                                                        {revokingSession === session.id ? (
                                                            <>
                                                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                                                Revoking...
                                                            </>
                                                        ) : (
                                                            'Revoke'
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
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
                                <Label htmlFor="role">Your Role</Label>
                                <Input id="role" value={profile.role} readOnly disabled />
                            </div>
                            <p className="text-xs text-muted-foreground">Your role determines your access level. Contact a Super Admin to make changes.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><FileClock className="h-5 w-5"/>User Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">User ID</span>
                                <span className="font-mono text-xs">{profile.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Last Active</span>
                                <span className="font-medium">{formatRelativeTime(profile.lastActive)}</span>
                            </div>
                            {profile.createdAt && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Account Created</span>
                                    <span className="font-medium">{formatTimestamp(profile.createdAt)}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Email Verified</span>
                                <span className="font-medium">{profile.emailVerified ? '✅ Yes' : '❌ No'}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

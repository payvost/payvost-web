'use client';

import { useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

import { workspacesService, type WorkspaceMember, type WorkspaceRole } from '@/services/workspacesService';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const ROLES: WorkspaceRole[] = ['OWNER', 'ADMIN', 'SPEND_MANAGER', 'CARDHOLDER', 'VIEWER'];

export function WorkspaceTeamDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string | null;
  members: WorkspaceMember[];
  onMembersChanged: (next: WorkspaceMember[]) => void;
}) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('CARDHOLDER');
  const [saving, setSaving] = useState(false);

  const canSubmit = useMemo(() => Boolean(props.workspaceId && email.trim()), [props.workspaceId, email]);

  const add = async () => {
    if (!props.workspaceId) return;
    try {
      setSaving(true);
      const resp = await workspacesService.addMember(props.workspaceId, { email: email.trim(), role });
      const next = [...props.members.filter((m) => m.userId !== resp.member.userId), resp.member];
      props.onMembersChanged(next);
      setEmail('');
      toast({ title: 'Member added', description: 'Workspace member was added/updated.' });
    } catch (e: any) {
      toast({ title: 'Failed to add member', description: e?.message || 'Could not add member.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateRole = async (userId: string, nextRole: WorkspaceRole) => {
    if (!props.workspaceId) return;
    try {
      setSaving(true);
      await workspacesService.updateMemberRole(props.workspaceId, userId, { role: nextRole });
      props.onMembersChanged(props.members.map((m) => (m.userId === userId ? { ...m, role: nextRole } : m)));
    } catch (e: any) {
      toast({ title: 'Failed to update role', description: e?.message || 'Could not update role.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (userId: string) => {
    if (!props.workspaceId) return;
    try {
      setSaving(true);
      await workspacesService.removeMember(props.workspaceId, userId);
      props.onMembersChanged(props.members.filter((m) => m.userId !== userId));
      toast({ title: 'Member removed' });
    } catch (e: any) {
      toast({ title: 'Failed to remove', description: e?.message || 'Could not remove member.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Business Team</DialogTitle>
          <DialogDescription>Add members and assign roles. Roles gate card issuing, controls, and termination.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          <Input
            className="sm:col-span-3"
            placeholder="member@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Select value={role} onValueChange={(v) => setRole(v as WorkspaceRole)}>
            <SelectTrigger className="sm:col-span-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.filter((r) => r !== 'OWNER').map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="sm:col-span-5 flex justify-end">
            <Button onClick={add} disabled={!canSubmit || saving}>
              Add member
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.members.length ? (
                props.members.map((m) => (
                  <TableRow key={m.userId}>
                    <TableCell>
                      <div className="font-medium">{m.user?.name || m.user?.email || m.userId}</div>
                      <div className="text-xs text-muted-foreground font-mono">{m.userId}</div>
                    </TableCell>
                    <TableCell>
                      <Select value={m.role} onValueChange={(v) => updateRole(m.userId, v as WorkspaceRole)} disabled={saving || m.role === 'OWNER'}>
                        <SelectTrigger className="w-[190px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r} value={r} disabled={m.role === 'OWNER' && r !== 'OWNER'}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(m.userId)}
                        disabled={saving || m.role === 'OWNER'}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No members found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)} disabled={saving}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


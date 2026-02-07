import { Router, Response } from 'express';
import { z } from 'zod';
import admin from 'firebase-admin';

import { prisma } from '../../common/prisma';
import { logger } from '../../common/logger';
import { verifyFirebaseToken, AuthenticatedRequest } from '../../gateway/middleware';
import { ensurePrismaUser } from '../user/syncUser';

const roleSchema = z.enum(['OWNER', 'ADMIN', 'SPEND_MANAGER', 'CARDHOLDER', 'VIEWER']);

async function requireWorkspaceAccess(params: { uid: string; workspaceId: string }) {
  const workspace = await prisma.workspace.findUnique({ where: { id: params.workspaceId } });
  if (!workspace) return { ok: false as const, status: 404, error: 'Workspace not found' };

  if (workspace.ownerUserId === params.uid) return { ok: true as const, workspace, role: 'OWNER' as const };

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: params.uid } },
  });
  if (!member) return { ok: false as const, status: 403, error: 'Forbidden' };
  return { ok: true as const, workspace, role: String(member.role) as any };
}

function isAdminRole(role: string) {
  return ['OWNER', 'ADMIN'].includes(role);
}

function isSpendManagerRole(role: string) {
  return ['OWNER', 'ADMIN', 'SPEND_MANAGER'].includes(role);
}

export default function createWorkspacesRouter() {
  const router = Router();

  // List workspaces user can access
  router.get('/', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });
      await ensurePrismaUser(uid).catch(() => null);

      const type =
        typeof req.query.type === 'string' && (req.query.type === 'PERSONAL' || req.query.type === 'BUSINESS')
          ? (req.query.type as 'PERSONAL' | 'BUSINESS')
          : undefined;

      const owned = await prisma.workspace.findMany({
        where: {
          ownerUserId: uid,
          ...(type ? { type: type as any } : {}),
        },
        orderBy: { createdAt: 'asc' },
      });

      const memberships = await prisma.workspaceMember.findMany({
        where: { userId: uid },
        include: { Workspace: true },
      });

      const byId = new Map<string, { id: string; role: string; workspace: any }>();
      for (const w of owned) byId.set(w.id, { id: w.id, role: 'OWNER', workspace: w });
      for (const m of memberships) byId.set(m.workspaceId, { id: m.workspaceId, role: String(m.role), workspace: m.Workspace });

      const items = Array.from(byId.values())
        .filter((x) => (type ? String(x.workspace.type) === type : true))
        .map((x) => ({
          id: x.workspace.id,
          type: x.workspace.type,
          name: x.workspace.name,
          businessId: x.workspace.businessId,
          ownerUserId: x.workspace.ownerUserId,
          defaultCurrency: x.workspace.defaultCurrency,
          defaultLocale: x.workspace.defaultLocale,
          createdAt: x.workspace.createdAt,
          updatedAt: x.workspace.updatedAt,
          role: x.role,
        }));

      res.status(200).json({ workspaces: items });
    } catch (error: any) {
      logger.error({ err: error }, '[workspaces] list failed');
      res.status(500).json({ error: error.message || 'Failed to list workspaces' });
    }
  });

  // List members (includes owner as implicit member)
  router.get('/:workspaceId/members', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });
      const workspaceId = req.params.workspaceId;

      const access = await requireWorkspaceAccess({ uid, workspaceId });
      if (!access.ok) return res.status(access.status).json({ error: access.error });

      const members = await prisma.workspaceMember.findMany({
        where: { workspaceId },
        include: { User: { select: { id: true, email: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      });

      // Ensure owner is always present (in case membership row wasn't created or was deleted).
      const hasOwner = members.some((m) => m.userId === access.workspace.ownerUserId);
      if (!hasOwner) {
        await prisma.workspaceMember.upsert({
          where: { workspaceId_userId: { workspaceId, userId: access.workspace.ownerUserId } },
          create: { workspaceId, userId: access.workspace.ownerUserId, role: 'OWNER' as any },
          update: {},
        });
      }

      const refreshed = await prisma.workspaceMember.findMany({
        where: { workspaceId },
        include: { User: { select: { id: true, email: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      });

      res.status(200).json({
        workspaceId,
        members: refreshed.map((m) => ({
          userId: m.userId,
          role: m.role,
          createdAt: m.createdAt,
          user: m.User,
        })),
      });
    } catch (error: any) {
      logger.error({ err: error }, '[workspaces] list members failed');
      res.status(500).json({ error: error.message || 'Failed to list members' });
    }
  });

  const addMemberSchema = z
    .object({
      email: z.string().email().optional(),
      userId: z.string().min(1).optional(),
      role: roleSchema.optional(),
    })
    .refine((v) => Boolean(v.email || v.userId), { message: 'Provide email or userId' });

  // Add member by email (preferred) or userId
  router.post('/:workspaceId/members', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });
      const workspaceId = req.params.workspaceId;

      const access = await requireWorkspaceAccess({ uid, workspaceId });
      if (!access.ok) return res.status(access.status).json({ error: access.error });
      if (!isSpendManagerRole(access.role)) return res.status(403).json({ error: 'Insufficient permissions' });

      const parsed = addMemberSchema.safeParse(req.body || {});
      if (!parsed.success) return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });

      let memberUid = parsed.data.userId;
      if (!memberUid && parsed.data.email) {
        try {
          const authUser = await admin.auth().getUserByEmail(parsed.data.email);
          memberUid = authUser.uid;
        } catch (e: any) {
          return res.status(404).json({ error: 'User not found for email' });
        }
      }
      if (!memberUid) return res.status(400).json({ error: 'Provide email or userId' });

      await ensurePrismaUser(memberUid).catch(() => null);

      const role = (parsed.data.role || 'CARDHOLDER') as any;
      const member = await prisma.workspaceMember.upsert({
        where: { workspaceId_userId: { workspaceId, userId: memberUid } },
        create: { workspaceId, userId: memberUid, role },
        update: { role },
      });

      const user = await prisma.user.findUnique({ where: { id: memberUid }, select: { id: true, email: true, name: true } });
      res.status(201).json({ member: { userId: member.userId, role: member.role, createdAt: member.createdAt, user } });
    } catch (error: any) {
      logger.error({ err: error }, '[workspaces] add member failed');
      res.status(500).json({ error: error.message || 'Failed to add member' });
    }
  });

  const updateRoleSchema = z.object({ role: roleSchema });

  // Update member role
  router.patch('/:workspaceId/members/:userId', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });
      const workspaceId = req.params.workspaceId;
      const userId = req.params.userId;

      const access = await requireWorkspaceAccess({ uid, workspaceId });
      if (!access.ok) return res.status(access.status).json({ error: access.error });
      if (!isAdminRole(access.role)) return res.status(403).json({ error: 'Insufficient permissions' });

      const parsed = updateRoleSchema.safeParse(req.body || {});
      if (!parsed.success) return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });

      if (userId === access.workspace.ownerUserId && parsed.data.role !== 'OWNER') {
        return res.status(400).json({ error: 'Cannot change owner role' });
      }

      const updated = await prisma.workspaceMember.update({
        where: { workspaceId_userId: { workspaceId, userId } },
        data: { role: parsed.data.role as any },
      });

      res.status(200).json({ member: { userId: updated.userId, role: updated.role, createdAt: updated.createdAt } });
    } catch (error: any) {
      logger.error({ err: error }, '[workspaces] update member role failed');
      res.status(500).json({ error: error.message || 'Failed to update member role' });
    }
  });

  // Remove member
  router.delete('/:workspaceId/members/:userId', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });
      const workspaceId = req.params.workspaceId;
      const userId = req.params.userId;

      const access = await requireWorkspaceAccess({ uid, workspaceId });
      if (!access.ok) return res.status(access.status).json({ error: access.error });
      if (access.workspace.ownerUserId !== uid) return res.status(403).json({ error: 'Only owner can remove members' });
      if (userId === access.workspace.ownerUserId) return res.status(400).json({ error: 'Cannot remove owner' });

      await prisma.workspaceMember.delete({ where: { workspaceId_userId: { workspaceId, userId } } });
      res.status(200).json({ removed: true });
    } catch (error: any) {
      logger.error({ err: error }, '[workspaces] remove member failed');
      res.status(500).json({ error: error.message || 'Failed to remove member' });
    }
  });

  return router;
}


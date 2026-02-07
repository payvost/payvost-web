import { apiClient } from '@/services/apiClient';

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'SPEND_MANAGER' | 'CARDHOLDER' | 'VIEWER';
export type WorkspaceType = 'PERSONAL' | 'BUSINESS';

export type WorkspaceSummary = {
  id: string;
  type: WorkspaceType;
  name: string;
  businessId: string;
  ownerUserId: string;
  defaultCurrency: string;
  defaultLocale: string;
  createdAt: string;
  updatedAt: string;
  role: WorkspaceRole;
};

export type ListWorkspacesResponse = { workspaces: WorkspaceSummary[] };

export type WorkspaceMember = {
  userId: string;
  role: WorkspaceRole;
  createdAt: string;
  user?: { id: string; email: string; name?: string | null } | null;
};

export type ListMembersResponse = { workspaceId: string; members: WorkspaceMember[] };

export type AddMemberRequest = { email?: string; userId?: string; role?: WorkspaceRole };
export type AddMemberResponse = { member: WorkspaceMember };

export type UpdateMemberRoleRequest = { role: WorkspaceRole };
export type UpdateMemberRoleResponse = { member: Pick<WorkspaceMember, 'userId' | 'role' | 'createdAt'> };

export const workspacesService = {
  listWorkspaces: async (params?: { type?: WorkspaceType }) => {
    const suffix = params?.type ? `?type=${encodeURIComponent(params.type)}` : '';
    return apiClient.get<ListWorkspacesResponse>(`/api/v1/workspaces${suffix}`);
  },
  listMembers: async (workspaceId: string) => {
    return apiClient.get<ListMembersResponse>(`/api/v1/workspaces/${encodeURIComponent(workspaceId)}/members`);
  },
  addMember: async (workspaceId: string, payload: AddMemberRequest) => {
    return apiClient.post<AddMemberResponse>(`/api/v1/workspaces/${encodeURIComponent(workspaceId)}/members`, payload);
  },
  updateMemberRole: async (workspaceId: string, userId: string, payload: UpdateMemberRoleRequest) => {
    return apiClient.patch<UpdateMemberRoleResponse>(
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(userId)}`,
      payload
    );
  },
  removeMember: async (workspaceId: string, userId: string) => {
    return apiClient.delete<{ removed: boolean }>(
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(userId)}`
    );
  },
};


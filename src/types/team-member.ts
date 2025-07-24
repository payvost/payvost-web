
export type MemberRole = 'Super Admin' | 'Admin' | 'Support' | 'Compliance' | 'Developer';
export type MemberStatus = 'Active' | 'Invited' | 'Suspended';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  lastActive: string;
  sessions?: {
    id: string;
    ip: string;
    device: string;
    lastSeen: string;
  }[];
  activityLog?: {
    id: string;
    action: string;
    timestamp: string;
    module?: string;
    ip?: string;
  }[];
}

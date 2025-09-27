
export type SupportTicketStatus = 'Open' | 'Pending' | 'Resolved' | 'Closed';
export type SupportTicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface SupportTicket {
  id: string;
  subject: string;
  customerName: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  assigneeName: string;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

export interface TicketMessage {
    id: string;
    author: string;
    content: string;
    timestamp: string; // ISO 8601 timestamp
    type: 'public_reply' | 'internal_note';
}


export type ErrorSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type ErrorStatus = 'Unresolved' | 'Resolved' | 'Ignored';

export interface ErrorLog {
  id: string;
  type: string; // e.g., 'APIError', 'FrontendException'
  message: string;
  severity: ErrorSeverity;
  count: number;
  lastSeen: string; // ISO 8601
  status: ErrorStatus;
}

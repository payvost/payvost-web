
export type AlertStatus = 'Pending Review' | 'Under Review' | 'Closed - Safe' | 'Closed - Fraud';
export type AlertRiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type AlertReason = 'Sanctions List Match' | 'Unusual Transaction Pattern' | 'High-Risk Jurisdiction' | 'Structuring' | 'Velocity Check';

export interface ComplianceAlert {
  id: string; // Case ID
  userId: string;
  userName: string;
  reason: AlertReason;
  riskLevel: AlertRiskLevel;
  status: AlertStatus;
  date: string;
  source: 'Transaction Monitoring' | 'Sanctions Screening' | 'Onboarding' | 'Manual';
  details?: {
    description: string;
    matchedRule?: string;
    geoData?: {
        ip: string;
        country: string;
        city: string;
    };
    device?: {
        id: string;
        type: 'Web Browser' | 'iOS App' | 'Android Browser' | 'API';
    }
  }
}

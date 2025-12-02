import { ReferralCampaignManager } from '@/components/admin/referral-campaign-manager';
import AdminDashboardLayout from '@/components/admin-dashboard-layout';

export default function ReferralCampaignsPage() {
  return (
    <AdminDashboardLayout>
      <ReferralCampaignManager />
    </AdminDashboardLayout>
  );
}


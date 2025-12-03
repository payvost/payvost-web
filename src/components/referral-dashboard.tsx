'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Share2, Users, DollarSign, Gift, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface ReferralStats {
  referralCode: string | null;
  totalReferrals: number;
  activeReferrals: number;
  totalRewards: number;
  totalEarned: string;
  referrals: Array<{
    id: string;
    referredUser: {
      id: string;
      email: string;
      name: string | null;
      kycStatus: string;
      createdAt: Date;
    };
    joinedAt: Date;
    kycStatus: string;
    firstTransactionAt: Date | null;
  }>;
}

export function ReferralDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/v1/referral/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch referral stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load referral statistics. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    if (!stats?.referralCode) return;

    setCopying(true);
    try {
      const link = `${window.location.origin}/signup?ref=${stats.referralCode}`;
      await navigator.clipboard.writeText(link);
      toast({
        title: 'Copied!',
        description: 'Referral link copied to clipboard',
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy referral link',
        variant: 'destructive',
      });
    } finally {
      setCopying(false);
    }
  };

  const shareReferralLink = async () => {
    if (!stats?.referralCode) return;

    const link = `${window.location.origin}/signup?ref=${stats.referralCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Payvost',
          text: 'Join me on Payvost and get rewarded! Use my referral code to get started.',
          url: link,
        });
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    } else {
      // Fallback to copy
      copyReferralLink();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Unable to load referral information.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Code</CardTitle>
          <CardDescription>
            Share your code and earn rewards when friends join and complete their first transaction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 p-4 bg-muted rounded-lg font-mono text-2xl text-center">
              {stats.referralCode || 'Loading...'}
            </div>
            <Button 
              onClick={copyReferralLink} 
              variant="outline"
              disabled={copying || !stats.referralCode}
            >
              {copying ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              Copy
            </Button>
            <Button 
              onClick={shareReferralLink}
              disabled={!stats.referralCode}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Share this link: <span className="font-mono text-xs">{window.location.origin}/signup?ref={stats.referralCode}</span>
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.totalReferrals}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">People you've referred</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{stats.activeReferrals}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Active accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">
                ${parseFloat(stats.totalEarned || '0').toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Rewards paid out</p>
          </CardContent>
        </Card>
      </div>

      {/* Referrals List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referrals</CardTitle>
          <CardDescription>
            Track the status of people you've referred
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.referrals.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No referrals yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Share your referral code to start earning rewards!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.referrals.map((ref) => (
                <div 
                  key={ref.id} 
                  className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">
                        {ref.referredUser.name || ref.referredUser.email}
                      </p>
                      <Badge 
                        variant={
                          ref.kycStatus === 'verified' || ref.kycStatus === 'approved' 
                            ? 'default' 
                            : 'secondary'
                        }
                        className="text-xs"
                      >
                        {ref.kycStatus}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Joined: {new Date(ref.joinedAt).toLocaleDateString()}
                    </p>
                    {ref.firstTransactionAt && (
                      <p className="text-sm text-green-600 mt-1">
                        ✓ First transaction completed on {new Date(ref.firstTransactionAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {ref.firstTransactionAt && (
                    <div className="ml-4">
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Active
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


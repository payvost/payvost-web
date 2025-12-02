'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignStats,
  type ReferralCampaign,
  type CreateCampaignInput,
  type CampaignStats,
} from '@/lib/api/referral-campaigns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  BarChart3,
  Gift,
} from 'lucide-react';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// Form validation schema
const campaignFormSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  signupBonus: z.preprocess(
    (val) => (val === '' || val === null ? undefined : Number(val)),
    z.number().positive('Signup bonus must be greater than 0').optional()
  ),
  signupCurrency: z.string().optional(),
  firstTxBonus: z.preprocess(
    (val) => (val === '' || val === null ? undefined : Number(val)),
    z.number().positive('First transaction bonus must be greater than 0').optional()
  ),
  firstTxCurrency: z.string().optional(),
  firstTxMinAmount: z.preprocess(
    (val) => (val === '' || val === null ? undefined : Number(val)),
    z.number().positive('Minimum amount must be greater than 0').optional()
  ),
  tier2Percentage: z.preprocess(
    (val) => (val === '' || val === null ? undefined : Number(val)),
    z.number().min(0, 'Percentage must be 0 or greater').max(100, 'Percentage cannot exceed 100').optional()
  ),
  tier3Percentage: z.preprocess(
    (val) => (val === '' || val === null ? undefined : Number(val)),
    z.number().min(0, 'Percentage must be 0 or greater').max(100, 'Percentage cannot exceed 100').optional()
  ),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  eligibleCountries: z.string().optional(),
  excludedCountries: z.string().optional(),
});

type CampaignFormValues = z.infer<typeof campaignFormSchema>;

const CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD'];
const COMMON_COUNTRIES = ['US', 'GB', 'CA', 'AU', 'NG', 'KE', 'GH', 'ZA', 'EG', 'MA'];

export function ReferralCampaignManager() {
  const [campaigns, setCampaigns] = useState<ReferralCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<ReferralCampaign | null>(null);
  const [viewingStats, setViewingStats] = useState<CampaignStats | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<ReferralCampaign | null>(null);
  const { toast } = useToast();

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
      signupBonus: undefined,
      signupCurrency: 'USD',
      firstTxBonus: undefined,
      firstTxCurrency: 'USD',
      firstTxMinAmount: undefined,
      tier2Percentage: undefined,
      tier3Percentage: undefined,
      startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      endDate: '',
      eligibleCountries: '',
      excludedCountries: '',
    },
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await getCampaigns();
      setCampaigns(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load campaigns',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCampaign(null);
    form.reset({
      name: '',
      description: '',
      isActive: true,
      signupBonus: undefined,
      signupCurrency: 'USD',
      firstTxBonus: undefined,
      firstTxCurrency: 'USD',
      firstTxMinAmount: undefined,
      tier2Percentage: undefined,
      tier3Percentage: undefined,
      startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      endDate: '',
      eligibleCountries: '',
      excludedCountries: '',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (campaign: ReferralCampaign) => {
    setEditingCampaign(campaign);
    form.reset({
      name: campaign.name,
      description: campaign.description || '',
      isActive: campaign.isActive,
      signupBonus: campaign.signupBonus ? parseFloat(campaign.signupBonus) : undefined,
      signupCurrency: campaign.signupCurrency || 'USD',
      firstTxBonus: campaign.firstTxBonus ? parseFloat(campaign.firstTxBonus) : undefined,
      firstTxCurrency: campaign.firstTxCurrency || 'USD',
      firstTxMinAmount: campaign.firstTxMinAmount ? parseFloat(campaign.firstTxMinAmount) : undefined,
      tier2Percentage: campaign.tier2Percentage ? parseFloat(campaign.tier2Percentage) : undefined,
      tier3Percentage: campaign.tier3Percentage ? parseFloat(campaign.tier3Percentage) : undefined,
      startDate: campaign.startDate ? format(new Date(campaign.startDate), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      endDate: campaign.endDate ? format(new Date(campaign.endDate), "yyyy-MM-dd'T'HH:mm") : '',
      eligibleCountries: campaign.eligibleCountries.join(', '),
      excludedCountries: campaign.excludedCountries.join(', '),
    });
    setIsDialogOpen(true);
  };

  const handleViewStats = async (campaign: ReferralCampaign) => {
    try {
      const stats = await getCampaignStats(campaign.id);
      setViewingStats(stats);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load campaign statistics',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: CampaignFormValues) => {
    try {
      const campaignData: CreateCampaignInput = {
        name: data.name,
        description: data.description || undefined,
        isActive: data.isActive,
        signupBonus: data.signupBonus,
        signupCurrency: data.signupCurrency,
        firstTxBonus: data.firstTxBonus,
        firstTxCurrency: data.firstTxCurrency,
        firstTxMinAmount: data.firstTxMinAmount,
        tier2Percentage: data.tier2Percentage,
        tier3Percentage: data.tier3Percentage,
        startDate: data.startDate,
        endDate: data.endDate || undefined,
        eligibleCountries: data.eligibleCountries
          ? data.eligibleCountries.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean)
          : undefined,
        excludedCountries: data.excludedCountries
          ? data.excludedCountries.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean)
          : undefined,
      };

      if (editingCampaign) {
        await updateCampaign(editingCampaign.id, campaignData);
        toast({
          title: 'Success',
          description: 'Campaign updated successfully',
        });
      } else {
        await createCampaign(campaignData);
        toast({
          title: 'Success',
          description: 'Campaign created successfully',
        });
      }

      setIsDialogOpen(false);
      fetchCampaigns();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save campaign',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClick = (campaign: ReferralCampaign) => {
    setCampaignToDelete(campaign);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async (hardDelete: boolean = false) => {
    if (!campaignToDelete) return;

    try {
      await deleteCampaign(campaignToDelete.id, hardDelete);
      toast({
        title: 'Success',
        description: hardDelete ? 'Campaign deleted permanently' : 'Campaign deactivated',
      });
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
      fetchCampaigns();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete campaign',
        variant: 'destructive',
      });
    }
  };

  const toggleActive = async (campaign: ReferralCampaign) => {
    try {
      await updateCampaign(campaign.id, { isActive: !campaign.isActive });
      toast({
        title: 'Success',
        description: campaign.isActive ? 'Campaign deactivated' : 'Campaign activated',
      });
      fetchCampaigns();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update campaign',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Referral Campaigns</h1>
          <p className="text-muted-foreground">Manage referral campaigns and rewards</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gift className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground mb-4">Create your first referral campaign to get started</p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Campaigns</CardTitle>
            <CardDescription>View and manage all referral campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Signup Bonus</TableHead>
                  <TableHead>First TX Bonus</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>
                      <Badge variant={campaign.isActive ? 'default' : 'secondary'}>
                        {campaign.isActive ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(campaign.startDate), 'MMM d, yyyy')}</div>
                        {campaign.endDate && (
                          <div className="text-muted-foreground">
                            to {format(new Date(campaign.endDate), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {campaign.signupBonus ? (
                        <span className="font-medium">
                          {parseFloat(campaign.signupBonus).toFixed(2)} {campaign.signupCurrency || 'USD'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {campaign.firstTxBonus ? (
                        <span className="font-medium">
                          {parseFloat(campaign.firstTxBonus).toFixed(2)} {campaign.firstTxCurrency || 'USD'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewStats(campaign)}
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(campaign)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(campaign)}
                        >
                          {campaign.isActive ? (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(campaign)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
            </DialogTitle>
            <DialogDescription>
              {editingCampaign
                ? 'Update the referral campaign details'
                : 'Create a new referral campaign with reward settings'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Q1 2025 Campaign" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>Enable this campaign</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Campaign description..." rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Signup Rewards</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="signupBonus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Signup Bonus</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="10.00"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="signupCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CURRENCIES.map((currency) => (
                              <SelectItem key={currency} value={currency}>
                                {currency}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">First Transaction Rewards</h3>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="firstTxBonus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First TX Bonus</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="5.00"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="firstTxCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CURRENCIES.map((currency) => (
                              <SelectItem key={currency} value={currency}>
                                {currency}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="firstTxMinAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="50.00"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Multi-Tier Rewards</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tier2Percentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tier 2 Percentage</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="10.00"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                          />
                        </FormControl>
                        <FormDescription>Percentage of direct referral reward (0-100)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tier3Percentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tier 3 Percentage</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="5.00"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                          />
                        </FormControl>
                        <FormDescription>Percentage of direct referral reward (0-100)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Eligibility</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="eligibleCountries"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Eligible Countries</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="US, GB, CA (comma-separated)"
                          />
                        </FormControl>
                        <FormDescription>Country codes separated by commas</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="excludedCountries"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Excluded Countries</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="XX, YY (comma-separated)"
                          />
                        </FormControl>
                        <FormDescription>Country codes to exclude</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Statistics Dialog */}
      <Dialog open={!!viewingStats} onOpenChange={() => setViewingStats(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Campaign Statistics</DialogTitle>
            <DialogDescription>
              Performance metrics for {viewingStats?.campaign.name}
            </DialogDescription>
          </DialogHeader>
          {viewingStats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <span className="text-2xl font-bold">{viewingStats.totalReferrals}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Active Referrals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="text-2xl font-bold">{viewingStats.activeReferrals}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">First TX Completed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      <span className="text-2xl font-bold">{viewingStats.firstTxCompleted}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Rewards Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      <span className="text-2xl font-bold">
                        ${parseFloat(viewingStats.totalRewardsValue).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {campaignToDelete?.isActive ? 'deactivate' : 'delete'} the campaign &quot;{campaignToDelete?.name}&quot;?
              {campaignToDelete?.isActive && (
                <span className="block mt-2 text-amber-600">
                  This will deactivate the campaign. Active campaigns with existing referrals cannot be permanently deleted.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete(false)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {campaignToDelete?.isActive ? 'Deactivate' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


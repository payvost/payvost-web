'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ShieldCheck, 
  FileText, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Search,
  Filter,
  Download,
  User,
  Calendar,
  Globe,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import Link from 'next/link';

interface KycSubmission {
  id: string;
  userId: string;
  countryCode: string;
  level: 'Basic' | 'Full' | 'Advanced';
  documents: Array<{
    key: string;
    name: string;
    url: string;
    signedUrl?: string;
    contentType?: string;
    size?: number;
    status?: string;
  }>;
  status: 'submitted' | 'in_review' | 'approved' | 'rejected';
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
  rejectionReason?: string;
  userEmail?: string;
  userName?: string;
}

export default function KycReviewPage() {
  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<KycSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingDecision, setProcessingDecision] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<KycSubmission | null>(null);
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<'approved' | 'rejected'>('approved');
  const [rejectionReason, setRejectionReason] = useState('');
  const [approveLevel, setApproveLevel] = useState<'Basic' | 'Full' | 'Advanced'>('Full');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { toast } = useToast();

  // Fetch all KYC submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/admin/kyc/submissions');
        const submissionsData = response.data || [];

        // Fetch user details for each submission
        const submissionsWithUsers = await Promise.all(
          submissionsData.map(async (submission: KycSubmission) => {
            try {
              const userResponse = await axios.get(`/api/admin/customers/${submission.userId}`);
              return {
                ...submission,
                userEmail: userResponse.data?.email,
                userName: userResponse.data?.name,
              };
            } catch (err) {
              console.error(`Error fetching user ${submission.userId}:`, err);
              return submission;
            }
          })
        );

        setSubmissions(submissionsWithUsers);
        setFilteredSubmissions(submissionsWithUsers);
      } catch (err) {
        console.error('Error fetching KYC submissions:', err);
        toast({
          title: 'Error',
          description: 'Failed to load KYC submissions',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [toast]);

  // Apply filters
  useEffect(() => {
    let filtered = [...submissions];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    if (levelFilter !== 'all') {
      filtered = filtered.filter(s => s.level === levelFilter);
    }

    if (countryFilter !== 'all') {
      filtered = filtered.filter(s => s.countryCode === countryFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.userEmail?.toLowerCase().includes(query) ||
        s.userName?.toLowerCase().includes(query) ||
        s.userId.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query)
      );
    }

    // Sort by created date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredSubmissions(filtered);
  }, [submissions, statusFilter, levelFilter, countryFilter, searchQuery]);

  const handleDecision = async () => {
    if (!selectedSubmission) return;

    try {
      setProcessingDecision(selectedSubmission.id);
      await axios.post('/api/admin/kyc/decision', {
        submissionId: selectedSubmission.id,
        decision: decisionType,
        reason: decisionType === 'rejected' ? rejectionReason : undefined,
        level: decisionType === 'approved' ? approveLevel : undefined,
      });

      toast({
        title: `KYC ${decisionType === 'approved' ? 'Approved' : 'Rejected'}`,
        description: `User has been notified of the decision.`,
      });

      // Refresh submissions
      const response = await axios.get('/api/admin/kyc/submissions');
      const submissionsData = response.data || [];
      const submissionsWithUsers = await Promise.all(
        submissionsData.map(async (submission: KycSubmission) => {
          try {
            const userResponse = await axios.get(`/api/admin/customers/${submission.userId}`);
            return {
              ...submission,
              userEmail: userResponse.data?.email,
              userName: userResponse.data?.name,
            };
          } catch (err) {
            return submission;
          }
        })
      );

      setSubmissions(submissionsWithUsers);
      setDecisionDialogOpen(false);
      setSelectedSubmission(null);
      setRejectionReason('');
    } catch (err: any) {
      console.error('Error processing KYC decision:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.error || 'Failed to process KYC decision',
        variant: 'destructive',
      });
    } finally {
      setProcessingDecision(null);
    }
  };

  const openDecisionDialog = (submission: KycSubmission, type: 'approved' | 'rejected') => {
    setSelectedSubmission(submission);
    setDecisionType(type);
    setDecisionDialogOpen(true);
    if (type === 'approved') {
      setApproveLevel(submission.level);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'in_review':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getUniqueCountries = () => {
    const countries = new Set(submissions.map(s => s.countryCode));
    return Array.from(countries).sort();
  };

  const pendingCount = submissions.filter(s => s.status === 'submitted' || s.status === 'in_review').length;

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">KYC Review</h2>
          <p className="text-muted-foreground">Review and process user verification documents</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {pendingCount} Pending
            </Badge>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="User email, name, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Level</label>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Basic">Basic</SelectItem>
                  <SelectItem value="Full">Full</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Country</label>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {getUniqueCountries().map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>KYC Submissions</CardTitle>
          <CardDescription>
            {filteredSubmissions.length} submission(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShieldCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No KYC submissions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => (
                <Card key={submission.id} className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">
                            {submission.userName || submission.userEmail || 'Unknown User'}
                          </CardTitle>
                          <Badge variant={getStatusBadgeVariant(submission.status)}>
                            {submission.status}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {submission.userEmail || submission.userId}
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {submission.countryCode}
                          </span>
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            {submission.level}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(submission.createdAt).toLocaleDateString()}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link href={`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/customers/${submission.userId}`}>
                            View User
                          </Link>
                        </Button>
                        {(submission.status === 'submitted' || submission.status === 'in_review') && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => openDecisionDialog(submission, 'approved')}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openDecisionDialog(submission, 'rejected')}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-2">Documents ({submission.documents?.length || 0}):</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {submission.documents?.map((doc, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{doc.name || doc.key}</p>
                                  {doc.size && (
                                    <p className="text-xs text-muted-foreground">
                                      {(doc.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(doc.signedUrl || doc.url, '_blank')}
                                className="ml-2 flex-shrink-0"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                      {submission.rejectionReason && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                          <p className="text-sm font-medium text-destructive mb-1">Rejection Reason:</p>
                          <p className="text-sm text-destructive">{submission.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decision Dialog */}
      <Dialog open={decisionDialogOpen} onOpenChange={setDecisionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decisionType === 'approved' ? 'Approve' : 'Reject'} KYC Submission
            </DialogTitle>
            <DialogDescription>
              {selectedSubmission && (
                <>
                  Processing submission for {selectedSubmission.userName || selectedSubmission.userEmail || selectedSubmission.userId}
                  <br />
                  Level: {selectedSubmission.level} • Country: {selectedSubmission.countryCode}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {decisionType === 'approved' && (
              <div>
                <label className="text-sm font-medium mb-1 block">KYC Level</label>
                <Select value={approveLevel} onValueChange={(v) => setApproveLevel(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Basic">Basic</SelectItem>
                    <SelectItem value="Full">Full</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {decisionType === 'rejected' && (
              <div>
                <label className="text-sm font-medium mb-1 block">Rejection Reason *</label>
                <Textarea
                  placeholder="Enter reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setDecisionDialogOpen(false);
                setSelectedSubmission(null);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDecision}
              disabled={processingDecision !== null || (decisionType === 'rejected' && !rejectionReason.trim())}
              variant={decisionType === 'approved' ? 'default' : 'destructive'}
            >
              {processingDecision ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {decisionType === 'approved' ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
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
  Mail,
  Phone,
  Globe,
  Briefcase,
  FileCheck,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import Link from 'next/link';
import { format } from 'date-fns';

interface BusinessOnboarding {
  id: string;
  userId: string;
  name: string;
  type: string;
  industry: string;
  registrationNumber: string;
  taxId: string;
  address: string;
  email: string;
  website?: string;
  documents?: Array<{
    key: string;
    name: string;
    url: string;
    contentType?: string;
    size?: number;
    status?: string;
  }>;
  status: 'submitted' | 'pending_review' | 'under_review' | 'approved' | 'rejected';
  submittedAt?: any;
  createdAt?: any;
  decidedAt?: any;
  decidedBy?: string;
  rejectionReason?: string;
  adminResponse?: string;
  userEmail?: string;
  userName?: string;
}

export default function BusinessOnboardingPage() {
  const [submissions, setSubmissions] = useState<BusinessOnboarding[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<BusinessOnboarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingDecision, setProcessingDecision] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<BusinessOnboarding | null>(null);
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<'approved' | 'rejected'>('approved');
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminResponse, setAdminResponse] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { toast } = useToast();

  // Fetch all business onboarding submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/admin/business-onboarding/submissions');
        const submissionsData = response.data || [];

        // Fetch user details for each submission
        const submissionsWithUsers = await Promise.all(
          submissionsData.map(async (submission: BusinessOnboarding) => {
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
        console.error('Error fetching business onboarding submissions:', err);
        toast({
          title: 'Error',
          description: 'Failed to load business onboarding submissions',
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

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.userEmail?.toLowerCase().includes(query) ||
        s.userName?.toLowerCase().includes(query) ||
        s.name?.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query) ||
        s.userId.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query)
      );
    }

    // Sort by created date (newest first)
    filtered.sort((a, b) => {
      const dateA = a.submittedAt?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.submittedAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    setFilteredSubmissions(filtered);
  }, [submissions, statusFilter, searchQuery]);

  const handleDecision = async () => {
    if (!selectedSubmission) return;

    if (decisionType === 'rejected' && !rejectionReason.trim()) {
      toast({
        title: 'Rejection reason required',
        description: 'Please provide a reason for rejection.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessingDecision(selectedSubmission.id);
      await axios.post('/api/admin/business-onboarding/decision', {
        submissionId: selectedSubmission.id,
        decision: decisionType,
        reason: decisionType === 'rejected' ? rejectionReason : undefined,
        adminResponse: adminResponse.trim() || undefined,
      });

      toast({
        title: `Business Onboarding ${decisionType === 'approved' ? 'Approved' : 'Rejected'}`,
        description: `User has been notified of the decision.`,
      });

      // Refresh submissions
      const response = await axios.get('/api/admin/business-onboarding/submissions');
      const submissionsData = response.data || [];
      const submissionsWithUsers = await Promise.all(
        submissionsData.map(async (submission: BusinessOnboarding) => {
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
      setAdminResponse('');
    } catch (err: any) {
      console.error('Error processing business onboarding decision:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.error || 'Failed to process decision',
        variant: 'destructive',
      });
    } finally {
      setProcessingDecision(null);
    }
  };

  const openDecisionDialog = (submission: BusinessOnboarding, type: 'approved' | 'rejected') => {
    setSelectedSubmission(submission);
    setDecisionType(type);
    setRejectionReason('');
    setAdminResponse('');
    setDecisionDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'under_review':
      case 'pending_review':
        return <Badge variant="secondary">Under Review</Badge>;
      case 'submitted':
        return <Badge variant="outline">Submitted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      if (date.toDate) {
        return format(date.toDate(), 'PPp');
      }
      if (date instanceof Date) {
        return format(date, 'PPp');
      }
      if (typeof date === 'string') {
        return format(new Date(date), 'PPp');
      }
      return 'N/A';
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Business Onboarding Review</h1>
          <p className="text-muted-foreground mt-1">
            Review and manage business onboarding submissions for Tier 3 upgrade
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-1 min-w-[300px]">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, email, business name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No business onboarding submissions found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">{submission.name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{submission.userName || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{submission.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{submission.type}</TableCell>
                      <TableCell>{submission.industry}</TableCell>
                      <TableCell>{formatDate(submission.submittedAt || submission.createdAt)}</TableCell>
                      <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setDecisionDialogOpen(true);
                            setDecisionType('approved');
                          }}
                          className="mr-2"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                        {submission.status === 'submitted' || submission.status === 'pending_review' || submission.status === 'under_review' ? (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => openDecisionDialog(submission, 'approved')}
                              className="mr-2"
                              disabled={processingDecision === submission.id}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openDecisionDialog(submission, 'rejected')}
                              disabled={processingDecision === submission.id}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review/Decision Dialog */}
      <Dialog open={decisionDialogOpen} onOpenChange={setDecisionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSubmission ? `Review: ${selectedSubmission.name}` : 'Review Business Onboarding'}
            </DialogTitle>
            <DialogDescription>
              Review business information and documents, then approve or reject the submission.
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              {/* Business Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Business Name</label>
                    <p className="font-medium">{selectedSubmission.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Business Type</label>
                    <p className="font-medium">{selectedSubmission.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Industry</label>
                    <p className="font-medium">{selectedSubmission.industry}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Registration Number</label>
                    <p className="font-medium">{selectedSubmission.registrationNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tax ID</label>
                    <p className="font-medium">{selectedSubmission.taxId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Contact Email</label>
                    <p className="font-medium flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {selectedSubmission.email}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Business Address</label>
                    <p className="font-medium">{selectedSubmission.address}</p>
                  </div>
                  {selectedSubmission.website && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Website</label>
                      <p className="font-medium flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        <a href={selectedSubmission.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {selectedSubmission.website}
                        </a>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* User Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    User Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="font-medium">{selectedSubmission.userName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="font-medium">{selectedSubmission.userEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">User ID</label>
                    <p className="font-mono text-sm">{selectedSubmission.userId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Submitted</label>
                    <p className="font-medium">{formatDate(selectedSubmission.submittedAt || selectedSubmission.createdAt)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Documents */}
              {selectedSubmission.documents && selectedSubmission.documents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileCheck className="h-5 w-5" />
                      Documents ({selectedSubmission.documents.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedSubmission.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {doc.key} {doc.size ? `• ${(doc.size / 1024 / 1024).toFixed(2)} MB` : ''}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Decision Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {decisionType === 'approved' ? 'Approve Submission' : 'Reject Submission'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {decisionType === 'rejected' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Rejection Reason <span className="text-destructive">*</span>
                      </label>
                      <Textarea
                        placeholder="Please provide a clear reason for rejection..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                        required
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Admin Response (Optional)</label>
                    <Textarea
                      placeholder="Add any additional comments or instructions for the user..."
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Previous Decision Info */}
              {selectedSubmission.decidedAt && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Previous Decision</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        {getStatusBadge(selectedSubmission.status)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Decided At:</span>
                        <span className="text-sm font-medium">{formatDate(selectedSubmission.decidedAt)}</span>
                      </div>
                      {selectedSubmission.rejectionReason && (
                        <div>
                          <span className="text-sm text-muted-foreground">Rejection Reason:</span>
                          <p className="text-sm mt-1">{selectedSubmission.rejectionReason}</p>
                        </div>
                      )}
                      {selectedSubmission.adminResponse && (
                        <div>
                          <span className="text-sm text-muted-foreground">Admin Response:</span>
                          <p className="text-sm mt-1">{selectedSubmission.adminResponse}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDecisionDialogOpen(false);
                setSelectedSubmission(null);
                setRejectionReason('');
                setAdminResponse('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant={decisionType === 'approved' ? 'default' : 'destructive'}
              onClick={handleDecision}
              disabled={processingDecision === selectedSubmission?.id || (decisionType === 'rejected' && !rejectionReason.trim())}
            >
              {processingDecision === selectedSubmission?.id && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
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
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { Briefcase, Clock, CheckCircle, XCircle, Eye, Calendar } from 'lucide-react';

interface Application {
  id: string;
  jobId: string;
  jobTitle?: string;
  status: 'pending' | 'shortlisted' | 'rejected' | 'accepted';
  appliedAt: any;
  coverLetter?: string;
}

export default function MyApplicationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/careers/my-applications');
      return;
    }

    async function fetchApplications() {
      try {
        const response = await fetch('/api/hr/applications?userId=' + user?.uid);
        if (response.ok) {
          const data = await response.json();
          setApplications(data.applications || []);
          
          // Fetch job titles for each application
          const appsWithTitles = await Promise.all(
            (data.applications || []).map(async (app: Application) => {
              try {
                const jobResponse = await fetch(`/api/hr/jobs/${app.jobId}`);
                if (jobResponse.ok) {
                  const jobData = await jobResponse.json();
                  return { ...app, jobTitle: jobData.job.title };
                }
              } catch (error) {
                console.error('Error fetching job:', error);
              }
              return app;
            })
          );
          setApplications(appsWithTitles);
        }
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchApplications();
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center">Loading your applications...</div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case 'shortlisted':
        return <Badge variant="default" className="bg-blue-100 text-blue-800"><CheckCircle className="mr-1 h-3 w-3" />Shortlisted</Badge>;
      case 'accepted':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString();
    }
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Job Applications</h1>
              <p className="text-muted-foreground">
                Track the status of your job applications
              </p>
            </div>
            <Link href="/careers">
              <Button variant="outline">
                <Briefcase className="mr-2 h-4 w-4" />
                Browse Jobs
              </Button>
            </Link>
          </div>

          {applications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start applying to jobs to see your applications here.
                </p>
                <Link href="/careers">
                  <Button>Browse Open Positions</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <Card key={app.id} className="hover:bg-muted/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="mb-2">
                          {app.jobTitle || 'Job Application'}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Applied on {formatDate(app.appliedAt)}
                          </div>
                        </CardDescription>
                      </div>
                      {getStatusBadge(app.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {app.coverLetter && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {app.coverLetter}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Link href={`/careers/jobs/${app.jobId}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          View Job
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}


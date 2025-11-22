'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Briefcase, MapPin, Clock, DollarSign, Calendar, Users, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salary?: string;
  postedDate?: string;
  description?: string;
  requirements?: string[];
  responsibilities?: string[];
  status?: 'active' | 'closed';
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJob() {
      try {
        const response = await fetch(`/api/hr/jobs/${jobId}`);
        if (response.ok) {
          const data = await response.json();
          setJob(data.job);
        } else {
          router.push('/careers');
        }
      } catch (error) {
        console.error('Error fetching job:', error);
        router.push('/careers');
      } finally {
        setLoading(false);
      }
    }
    if (jobId) {
      fetchJob();
    }
  }, [jobId, router]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center">Loading job details...</div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!job || job.status !== 'active') {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
            <Link href="/careers">
              <Button>Back to Careers</Button>
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <Link href="/careers">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Careers
            </Button>
          </Link>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-3xl mb-2">{job.title}</CardTitle>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          {job.department}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {job.type}
                        </div>
                        {job.salary && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            {job.salary}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="default" className="ml-4">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {job.description && (
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Job Description</h3>
                      <p className="text-muted-foreground whitespace-pre-line">{job.description}</p>
                    </div>
                  )}

                  {job.responsibilities && job.responsibilities.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Key Responsibilities</h3>
                      <ul className="space-y-2">
                        {job.responsibilities.map((resp, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{resp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {job.requirements && job.requirements.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Requirements</h3>
                      <ul className="space-y-2">
                        {job.requirements.map((req, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Apply</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user ? (
                    <Link href={`/careers/jobs/${job.id}/apply`}>
                      <Button className="w-full" size="lg">
                        Apply Now
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Sign in or create an account to apply for this position.
                      </p>
                      <Link href={`/login?redirect=/careers/jobs/${job.id}/apply`}>
                        <Button className="w-full" size="lg">
                          Sign in to Apply
                        </Button>
                      </Link>
                      <Link href={`/register?redirect=/careers/jobs/${job.id}/apply`}>
                        <Button variant="outline" className="w-full">
                          Create Account
                        </Button>
                      </Link>
                    </>
                  )}
                  {job.postedDate && (
                    <div className="pt-4 border-t text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Posted {new Date(job.postedDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}


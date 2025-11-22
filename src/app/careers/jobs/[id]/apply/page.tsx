'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { ArrowLeft, Upload, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function JobApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/careers/jobs/${jobId}/apply`);
      return;
    }

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

    if (user && jobId) {
      fetchJob();
    }
  }, [user, authLoading, jobId, router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a real implementation, upload to Firebase Storage
    // For now, we'll just store the file name
    setResumeUrl(file.name);
    toast({
      title: 'Resume uploaded',
      description: `File: ${file.name}`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/hr/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          coverLetter,
          resumeUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      toast({
        title: 'Application submitted!',
        description: 'Your application has been successfully submitted.',
      });

      router.push('/careers/my-applications');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit application',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
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
        <div className="max-w-2xl mx-auto">
          <Link href={`/careers/jobs/${jobId}`}>
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Job Details
            </Button>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>Apply for {job.title}</CardTitle>
              <CardDescription>
                {job.department} • {job.location} • {job.type}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="resume">Resume / CV</Label>
                  <div className="mt-2">
                    <Input
                      id="resume"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="cursor-pointer"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload your resume (PDF, DOC, or DOCX)
                    </p>
                    {resumeUrl && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-primary">
                        <FileText className="h-4 w-4" />
                        {resumeUrl}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="coverLetter">Cover Letter</Label>
                  <Textarea
                    id="coverLetter"
                    placeholder="Tell us why you're interested in this position and why you'd be a great fit..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={8}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {coverLetter.length} characters
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={submitting || !resumeUrl || !coverLetter.trim()}
                    className="flex-1"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Application'
                    )}
                  </Button>
                  <Link href={`/careers/jobs/${jobId}`}>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}


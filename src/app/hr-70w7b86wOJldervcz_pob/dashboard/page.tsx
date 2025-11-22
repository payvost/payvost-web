'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, FileText, UserCheck, Calendar, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HrDashboardPage() {
  // Mock data - replace with real API calls
  const stats = {
    activeJobs: 12,
    totalApplications: 245,
    pendingReview: 38,
    interviewsScheduled: 8,
    shortlisted: 15,
    rejected: 192,
    newApplications: 5,
  };

  const recentApplications = [
    { id: '1', name: 'John Doe', position: 'Senior Frontend Engineer', status: 'pending', date: '2024-01-15' },
    { id: '2', name: 'Jane Smith', position: 'Product Manager', status: 'shortlisted', date: '2024-01-14' },
    { id: '3', name: 'Bob Johnson', position: 'UX/UI Designer', status: 'pending', date: '2024-01-14' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">HR Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your hiring activities and job postings
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeJobs}</div>
            <p className="text-xs text-muted-foreground">
              Currently posted positions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              All-time applications received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReview}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting HR review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.interviewsScheduled}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/hr-70w7b86wOJldervcz_pob/jobs/create">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Create New Job</CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Post a Job</Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/hr-70w7b86wOJldervcz_pob/applications/pending">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Review Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingReview}</div>
              <p className="text-xs text-muted-foreground">Pending review</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/hr-70w7b86wOJldervcz_pob/interviews">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Schedule Interview</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Schedule</Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/hr-70w7b86wOJldervcz_pob/analytics">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-sm font-medium">View Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Applications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
          <CardDescription>
            Latest job applications requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentApplications.map((app) => (
              <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-semibold">{app.name}</h4>
                  <p className="text-sm text-muted-foreground">{app.position}</p>
                  <p className="text-xs text-muted-foreground mt-1">Applied on {app.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  {app.status === 'pending' && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                      Pending
                    </span>
                  )}
                  {app.status === 'shortlisted' && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      Shortlisted
                    </span>
                  )}
                  <Link href={`/hr-70w7b86wOJldervcz_pob/applications/${app.id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link href="/hr-70w7b86wOJldervcz_pob/applications">
              <Button variant="outline" className="w-full">View All Applications</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


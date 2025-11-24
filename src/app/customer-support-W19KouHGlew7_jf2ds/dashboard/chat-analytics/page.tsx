'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  Star,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { supportService } from '@/services/supportService';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ChatAnalyticsPage() {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30);
  const [startDate, setStartDate] = useState(subDays(new Date(), 30).toISOString());
  const [endDate, setEndDate] = useState(new Date().toISOString());

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await supportService.getChatAnalytics(startDate, endDate);
      setAnalytics(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (days: string) => {
    const daysNum = parseInt(days);
    setDateRange(daysNum);
    setStartDate(subDays(new Date(), daysNum).toISOString());
    setEndDate(new Date().toISOString());
  };

  // Prepare chart data
  const chartData = analytics ? [
    {
      name: 'Total',
      Sessions: analytics.totalSessions || 0,
      Messages: analytics.totalMessages || 0,
    },
    {
      name: 'Active',
      Sessions: analytics.activeSessions || 0,
      Messages: 0,
    },
    {
      name: 'Ended',
      Sessions: analytics.endedSessions || 0,
      Messages: 0,
    },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chat Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive metrics and insights for your chat support
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={dateRange.toString()} onValueChange={handleDateRangeChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : analytics ? (
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalSessions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.activeSessions || 0} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">First Response Time</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.avgFirstResponseTime ? `${analytics.avgFirstResponseTime.toFixed(1)}m` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">Average time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolution Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.avgResolutionTime ? `${analytics.avgResolutionTime.toFixed(1)}m` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">Average time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.avgRating ? analytics.avgRating.toFixed(1) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">Out of 5 stars</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sessions Overview</CardTitle>
                <CardDescription>Total sessions by status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Sessions" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Session Status Distribution</CardTitle>
                <CardDescription>Breakdown of session statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Active', value: analytics.activeSessions || 0 },
                        { name: 'Ended', value: analytics.endedSessions || 0 },
                        { name: 'Waiting', value: (analytics.totalSessions || 0) - (analytics.activeSessions || 0) - (analytics.endedSessions || 0) },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Active', value: analytics.activeSessions || 0 },
                        { name: 'Ended', value: analytics.endedSessions || 0 },
                        { name: 'Waiting', value: (analytics.totalSessions || 0) - (analytics.activeSessions || 0) - (analytics.endedSessions || 0) },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Stats */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Total Messages</span>
                  </div>
                  <span className="font-semibold">{analytics.totalMessages || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Avg First Response</span>
                  </div>
                  <span className="font-semibold">
                    {analytics.avgFirstResponseTime ? `${analytics.avgFirstResponseTime.toFixed(1)} min` : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Avg Resolution Time</span>
                  </div>
                  <span className="font-semibold">
                    {analytics.avgResolutionTime ? `${analytics.avgResolutionTime.toFixed(1)} min` : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Average Rating</span>
                  </div>
                  <span className="font-semibold">
                    {analytics.avgRating ? `${analytics.avgRating.toFixed(1)}/5` : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Session Statistics</CardTitle>
                <CardDescription>Session breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Total Sessions</span>
                  </div>
                  <span className="font-semibold">{analytics.totalSessions || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Active Sessions</span>
                  </div>
                  <span className="font-semibold">{analytics.activeSessions || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Ended Sessions</span>
                  </div>
                  <span className="font-semibold">{analytics.endedSessions || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Completion Rate</span>
                  </div>
                  <span className="font-semibold">
                    {analytics.totalSessions > 0
                      ? `${((analytics.endedSessions / analytics.totalSessions) * 100).toFixed(1)}%`
                      : '0%'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Period Info */}
          <Card>
            <CardHeader>
              <CardTitle>Report Period</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {format(new Date(startDate), 'PP')} - {format(new Date(endDate), 'PP')}
              </p>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No analytics data available</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


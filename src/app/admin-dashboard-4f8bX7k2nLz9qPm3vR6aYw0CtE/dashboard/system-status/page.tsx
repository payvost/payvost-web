'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertTriangle, XCircle, Info, RefreshCw, Clock, Search, Filter, Download, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type ServiceStatus = 'Operational' | 'Degraded Performance' | 'Major Outage';

interface ServiceComponent {
  name: string;
  status: ServiceStatus;
}

interface Service {
  name: string;
  status: ServiceStatus;
  description: string;
  responseTime?: number;
  lastChecked?: string;
  uptime?: number;
  components?: ServiceComponent[];
}

interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'resolved' | 'monitoring' | 'investigating';
  severity: 'high' | 'medium' | 'low';
  startedAt: string;
  resolvedAt?: string;
  affectedServices: string[];
}

interface SystemStatusData {
  overallStatus: ServiceStatus;
  services: Service[];
  incidents: Incident[];
  lastUpdated: string;
  systemUptime: number;
}

const statusConfig: Record<ServiceStatus, { 
  icon: React.ReactNode; 
  color: string; 
  bgColor: string;
  badgeVariant: 'default' | 'secondary' | 'destructive';
  label: string;
}> = {
  'Operational': { 
    icon: <CheckCircle className="h-5 w-5 text-green-500" />, 
    color: 'text-green-500', 
    bgColor: 'bg-green-500/10 border-green-500/20',
    badgeVariant: 'default',
    label: 'Operational'
  },
  'Degraded Performance': { 
    icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />, 
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10 border-yellow-500/20',
    badgeVariant: 'secondary',
    label: 'Degraded'
  },
  'Major Outage': { 
    icon: <XCircle className="h-5 w-5 text-red-500" />, 
    color: 'text-red-500',
    bgColor: 'bg-red-500/10 border-red-500/20',
    badgeVariant: 'destructive',
    label: 'Outage'
  },
};

const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

export default function SystemStatusPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SystemStatusData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  const fetchSystemStatus = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Get Firebase auth token
      const token = await user?.getIdToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/admin/system-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch system status: ${response.statusText}`);
      }

      const statusData = await response.json();
      setData(statusData);
      setLastRefreshTime(new Date());
    } catch (err) {
      console.error('Error fetching system status:', err);
      setError(err instanceof Error ? err.message : 'Failed to load system status');
      
      // Fallback to mock data for development
      if (process.env.NODE_ENV === 'development') {
        setData({
          overallStatus: 'Degraded Performance',
          services: [
            { name: 'API Gateway', status: 'Operational', description: 'All API endpoints are responding normally.', responseTime: 120, uptime: 99.9, lastChecked: new Date().toISOString(), components: [
              { name: 'Public API', status: 'Operational' },
              { name: 'Internal API', status: 'Operational' },
            ]},
            { name: 'Authentication Service', status: 'Operational', description: 'User login and authentication are functioning correctly.', responseTime: 85, uptime: 99.8 },
            { name: 'Payment Processing', status: 'Degraded Performance', description: 'We are experiencing intermittent delays with some payment providers.', responseTime: 450, uptime: 98.5, components: [
              { name: 'Stripe Gateway', status: 'Operational' },
              { name: 'PayPal Gateway', status: 'Degraded Performance' },
              { name: 'Bank Transfer Processor', status: 'Operational' },
            ]},
            { name: 'Settlement Engine', status: 'Operational', description: 'All automated settlements are processing on schedule.', responseTime: 200, uptime: 99.7 },
            { name: 'Database Cluster', status: 'Operational', description: 'Database performance is normal.', responseTime: 95, uptime: 99.9 },
            { name: 'Third-Party FX Provider', status: 'Major Outage', description: 'Our primary FX rate provider is down. We have failed over to our secondary provider. Some rates may be slightly delayed.', responseTime: 1200, uptime: 97.2 },
            { name: 'Web Dashboard', status: 'Operational', description: 'The customer and admin dashboards are fully functional.', responseTime: 150, uptime: 99.6 },
            { name: 'Email Notifications', status: 'Operational', description: 'Transactional emails are being sent without delays.', responseTime: 180, uptime: 99.5 },
          ],
          incidents: [
            {
              id: '1',
              title: 'Third-Party FX Provider Outage',
              description: 'Primary FX rate provider experienced connectivity issues. Automatically failed over to secondary provider.',
              status: 'monitoring',
              severity: 'high',
              startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              affectedServices: ['Third-Party FX Provider'],
            },
            {
              id: '2',
              title: 'Payment Processing Delays',
              description: 'Intermittent delays detected with PayPal gateway. Transactions processed successfully but with increased latency.',
              status: 'monitoring',
              severity: 'medium',
              startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
              affectedServices: ['Payment Processing'],
            },
          ],
          lastUpdated: new Date().toISOString(),
          systemUptime: 99.7,
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchSystemStatus();
    }
  }, [user, fetchSystemStatus]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !user) return;

    const interval = setInterval(() => {
      fetchSystemStatus(true);
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [autoRefresh, user, fetchSystemStatus]);

  const handleRefresh = () => {
    fetchSystemStatus(true);
  };

  const filteredServices = React.useMemo(() => {
    if (!data) return [];
    
    let filtered = data.services;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.components?.some(c => c.name.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [data, statusFilter, searchQuery]);

  const servicesWithIssues = data?.services.filter(s => s.status !== 'Operational') || [];
  const overallConfig = data ? statusConfig[data.overallStatus] : statusConfig['Operational'];

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-32 w-full" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Status</h2>
          <p className="text-muted-foreground">
            Live status of all Payvost services and components.
            {lastRefreshTime && (
              <span className="ml-2 text-xs">
                Last updated: {lastRefreshTime.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(autoRefresh && 'bg-primary/10')}
          >
            <Activity className={cn("mr-2 h-4 w-4", autoRefresh && "animate-pulse")} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
            {refreshing ? 'Refreshing...' : 'Refresh Status'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Overall Status Banner */}
      {data && (
        <Card className={cn("mb-6", overallConfig.bgColor)}>
          <CardHeader className="flex-row items-center gap-4">
            {overallConfig.icon}
            <div className="flex-1">
              <CardTitle className={cn(overallConfig.color, "dark:text-green-300")}>
                {data.overallStatus === 'Operational' 
                  ? 'All systems operational' 
                  : data.overallStatus === 'Degraded Performance'
                  ? 'Some services experiencing issues'
                  : 'System outage detected'}
              </CardTitle>
              <CardDescription className={cn(overallConfig.color.replace('text-', 'text-').replace('-500', '-700'), "dark:text-green-400")}>
                {servicesWithIssues.length > 0 
                  ? `${servicesWithIssues.length} service(s) are experiencing issues.`
                  : "All services are running smoothly."}
                {data.systemUptime && (
                  <span className="ml-2">System uptime: {data.systemUptime.toFixed(2)}%</span>
                )}
              </CardDescription>
            </div>
            {data.systemUptime && (
              <div className="text-right">
                <div className="text-2xl font-bold">{data.systemUptime.toFixed(2)}%</div>
                <div className="text-xs text-muted-foreground">Uptime</div>
              </div>
            )}
          </CardHeader>
        </Card>
      )}

      {/* System Metrics */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Operational Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {data.services.filter(s => s.status === 'Operational').length} / {data.services.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All services</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {data.incidents.filter(i => i.status !== 'resolved').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Ongoing issues</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(
                  data.services
                    .filter(s => s.responseTime)
                    .reduce((acc, s) => acc + (s.responseTime || 0), 0) /
                  data.services.filter(s => s.responseTime).length
                )}ms
              </div>
              <p className="text-xs text-muted-foreground mt-1">Across all services</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Incidents Timeline */}
      {data && data.incidents.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Recent Incidents</CardTitle>
            <CardDescription>Active and recently resolved system incidents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.incidents.map(incident => (
              <div key={incident.id} className="border-l-4 pl-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {incident.severity === 'high' && <XCircle className="h-4 w-4 text-red-500" />}
                    {incident.severity === 'medium' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                    {incident.severity === 'low' && <Info className="h-4 w-4 text-blue-500" />}
                    <h4 className="font-semibold">{incident.title}</h4>
                    <Badge variant={incident.status === 'resolved' ? 'default' : 'destructive'}>
                      {incident.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(incident.startedAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{incident.description}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Affected:</span>
                  {incident.affectedServices.map((service, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Services List */}
      <Tabs defaultValue="all" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">All Services ({data?.services.length || 0})</TabsTrigger>
            <TabsTrigger value="issues">Issues ({servicesWithIssues.length})</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Operational">Operational</SelectItem>
                <SelectItem value="Degraded Performance">Degraded</SelectItem>
                <SelectItem value="Major Outage">Outage</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <TabsContent value="all" className="mt-4">
          <div className="space-y-4">
            {filteredServices.length > 0 ? (
              filteredServices.map(service => (
                <ServiceStatusCard key={service.name} service={service} />
              ))
            ) : (
              <Card className="flex flex-col items-center justify-center p-12 text-center">
                <Info className="h-16 w-16 text-muted-foreground mb-4"/>
                <h3 className="text-xl font-semibold">No services found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="issues" className="mt-4">
          <div className="space-y-4">
            {servicesWithIssues.length > 0 ? (
              servicesWithIssues
                .filter(s => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(service => (
                  <ServiceStatusCard key={service.name} service={service} />
                ))
            ) : (
              <Card className="flex flex-col items-center justify-center p-12 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4"/>
                <h3 className="text-xl font-semibold">No issues to report</h3>
                <p className="text-muted-foreground">All systems are currently operational.</p>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

function ServiceStatusCard({ service }: { service: Service }) {
  const config = statusConfig[service.status];
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={cn("transition-all hover:shadow-md", config.bgColor)}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3 flex-1">
            {config.icon}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold">{service.name}</h3>
                <Badge variant={config.badgeVariant} className={cn("capitalize text-xs", config.color.replace('text-', 'bg-').replace('-500','-500/20'))}>
                  {config.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{service.description}</p>
              
              {/* Service Metrics */}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                {service.responseTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{service.responseTime}ms</span>
                  </div>
                )}
                {service.uptime && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>{service.uptime.toFixed(2)}% uptime</span>
                  </div>
                )}
                {service.lastChecked && (
                  <div className="flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    <span>Checked {new Date(service.lastChecked).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {service.components && service.components.length > 0 && (
          <>
            <Separator className="my-4" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="w-full justify-between"
            >
              <span className="text-sm">
                {service.components.length} component{service.components.length > 1 ? 's' : ''}
              </span>
              <span className={cn("transition-transform", expanded && "rotate-180")}>▼</span>
            </Button>
            {expanded && (
              <div className="mt-2 space-y-2 pl-4 border-l-2">
                {service.components.map(comp => {
                  const compConfig = statusConfig[comp.status];
                  return (
                    <div key={comp.name} className="flex items-center gap-2 text-sm">
                      {React.cloneElement(compConfig.icon as React.ReactElement, { className: 'h-4 w-4' })}
                      <span className="flex-1">{comp.name}</span>
                      <Badge variant={compConfig.badgeVariant} className={cn("text-xs", compConfig.color.replace('text-', 'bg-').replace('-500','-500/20'))}>
                        {compConfig.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

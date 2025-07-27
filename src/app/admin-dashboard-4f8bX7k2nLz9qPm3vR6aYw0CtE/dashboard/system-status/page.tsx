
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertTriangle, XCircle, Info, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type ServiceStatus = 'Operational' | 'Degraded Performance' | 'Major Outage';

interface Service {
  name: string;
  status: ServiceStatus;
  description: string;
  components?: { name: string; status: ServiceStatus }[];
}

const services: Service[] = [
  { name: 'API Gateway', status: 'Operational', description: 'All API endpoints are responding normally.', components: [
      { name: 'Public API', status: 'Operational' },
      { name: 'Internal API', status: 'Operational' },
  ]},
  { name: 'Authentication Service', status: 'Operational', description: 'User login and authentication are functioning correctly.' },
  { name: 'Payment Processing', status: 'Degraded Performance', description: 'We are experiencing intermittent delays with some payment providers.', components: [
      { name: 'Stripe Gateway', status: 'Operational' },
      { name: 'PayPal Gateway', status: 'Degraded Performance' },
      { name: 'Bank Transfer Processor', status: 'Operational' },
  ]},
  { name: 'Settlement Engine', status: 'Operational', description: 'All automated settlements are processing on schedule.' },
  { name: 'Database Cluster', status: 'Operational', description: 'Database performance is normal.' },
  { name: 'Third-Party FX Provider', status: 'Major Outage', description: 'Our primary FX rate provider is down. We have failed over to our secondary provider. Some rates may be slightly delayed.' },
  { name: 'Web Dashboard', status: 'Operational', description: 'The customer and admin dashboards are fully functional.' },
  { name: 'Email Notifications', status: 'Operational', description: 'Transactional emails are being sent without delays.' },
];

const statusConfig: Record<ServiceStatus, { icon: React.ReactNode; color: string; badgeVariant: 'default' | 'secondary' | 'destructive' }> = {
  'Operational': { icon: <CheckCircle className="h-5 w-5 text-green-500" />, color: 'text-green-500', badgeVariant: 'default' },
  'Degraded Performance': { icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />, color: 'text-yellow-500', badgeVariant: 'secondary' },
  'Major Outage': { icon: <XCircle className="h-5 w-5 text-red-500" />, color: 'text-red-500', badgeVariant: 'destructive' },
};

const filterServices = (status: string) => {
    if (status === 'all') return services;
    if (status === 'issues') return services.filter(s => s.status !== 'Operational');
    return services.filter(s => s.status.toLowerCase().replace(' ', '-') === status);
}

export default function SystemStatusPage() {
    const servicesWithIssues = services.filter(s => s.status !== 'Operational');

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">System Status</h2>
                    <p className="text-muted-foreground">Live status of all Qwibik services and components.</p>
                </div>
                <Button variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Status
                </Button>
            </div>
            
            <Card className="mb-6 bg-green-500/10 border-green-500/20">
                <CardHeader className="flex-row items-center gap-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                        <CardTitle className="text-green-800 dark:text-green-300">All systems operational</CardTitle>
                        <CardDescription className="text-green-700 dark:text-green-400">
                            {servicesWithIssues.length > 0 
                                ? `${servicesWithIssues.length} service(s) are experiencing issues.`
                                : "All services are running smoothly."}
                        </CardDescription>
                    </div>
                </CardHeader>
            </Card>

            <Tabs defaultValue="all" className="w-full">
                <TabsList>
                    <TabsTrigger value="all">All Services</TabsTrigger>
                    <TabsTrigger value="issues">Issues ({servicesWithIssues.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                    <div className="space-y-4">
                        {services.map(service => (
                            <ServiceStatusCard key={service.name} service={service} />
                        ))}
                    </div>
                </TabsContent>
                <TabsContent value="issues" className="mt-4">
                     <div className="space-y-4">
                        {servicesWithIssues.length > 0 ? servicesWithIssues.map(service => (
                            <ServiceStatusCard key={service.name} service={service} />
                        )) : (
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
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {config.icon}
                        <h3 className="text-lg font-semibold">{service.name}</h3>
                    </div>
                    <Badge variant={config.badgeVariant} className={cn("capitalize", config.color.replace('text-', 'bg-').replace('-500','-500/20'))}>{service.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2 ml-8">{service.description}</p>
                {service.components && (
                    <>
                        <Separator className="my-4 ml-8" />
                        <div className="ml-8 space-y-2">
                             {service.components.map(comp => {
                                 const compConfig = statusConfig[comp.status];
                                 return (
                                     <div key={comp.name} className="flex items-center gap-2 text-sm">
                                         {React.cloneElement(compConfig.icon as React.ReactElement, { className: 'h-4 w-4' })}
                                         <span>{comp.name}</span>
                                         <span className={cn('text-muted-foreground capitalize', compConfig.color)}>{comp.status}</span>
                                     </div>
                                 )
                             })}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

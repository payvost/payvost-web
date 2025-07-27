'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bot, ShieldAlert, Users, MessageCircleWarning, PlusCircle, Edit, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const fraudRules = [
    { id: 'rule_1', condition: 'Amount > $10,000 in 24h', action: 'Flag for review', status: 'Active' },
    { id: 'rule_2', condition: 'IP Country != Card Country', action: 'Block transaction', status: 'Active' },
    { id: 'rule_3', condition: 'More than 5 transactions in 1h', action: 'Flag for review', status: 'Inactive' },
];

export default function AiAutomationPage() {
    const { toast } = useToast();
    const [riskThreshold, setRiskThreshold] = useState(75);

    const handleSaveChanges = () => {
        toast({
            title: "Settings Saved",
            description: "AI and Automation settings have been updated.",
        });
    };

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">AI & Automation</h2>
                    <p className="text-muted-foreground">Manage AI-powered features and automation rules.</p>
                </div>
                 <Button onClick={handleSaveChanges}><Save className="mr-2 h-4 w-4"/>Save All Changes</Button>
            </div>
            
            <div className="space-y-6">
                {/* Fraud Detection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-destructive"/>AI-Powered Fraud Detection</CardTitle>
                        <CardDescription>Configure the automated fraud scoring and rule-based system.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="fraud-detection-switch" className="text-base font-semibold">Enable AI Fraud Scoring</Label>
                                <p className="text-sm text-muted-foreground">Automatically analyze transactions for fraud risk.</p>
                            </div>
                            <Switch id="fraud-detection-switch" defaultChecked />
                        </div>
                        <div className="space-y-4">
                             <Label htmlFor="risk-threshold">Risk Score Threshold for Alert</Label>
                             <div className="flex items-center gap-4">
                                <Slider
                                    id="risk-threshold"
                                    defaultValue={[riskThreshold]}
                                    max={100}
                                    step={1}
                                    onValueChange={(value) => setRiskThreshold(value[0])}
                                />
                                <span className="font-mono text-lg w-16 text-center">{riskThreshold}</span>
                             </div>
                             <p className="text-xs text-muted-foreground">Transactions with a risk score above this value will be automatically flagged.</p>
                        </div>
                        <Separator />
                        <div>
                             <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h4 className="font-semibold">Custom Fraud Rules</h4>
                                    <p className="text-sm text-muted-foreground">Add specific rules to supplement the AI model.</p>
                                </div>
                                <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4"/>Add Rule</Button>
                             </div>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Condition</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fraudRules.map(rule => (
                                        <TableRow key={rule.id}>
                                            <TableCell className="font-mono text-xs">{rule.condition}</TableCell>
                                            <TableCell>{rule.action}</TableCell>
                                            <TableCell><Switch defaultChecked={rule.status === 'Active'} /></TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Other Automation sections */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                     {/* User Segmentation */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5"/>Automated User Segmentation</CardTitle>
                            <CardDescription>Automatically group users into segments based on their activity.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex items-center justify-between"><Label>High-Value Customers</Label><Switch defaultChecked /></div>
                             <div className="flex items-center justify-between"><Label>New Users</Label><Switch defaultChecked /></div>
                             <div className="flex items-center justify-between"><Label>At-Risk of Churn</Label><Switch /></div>
                        </CardContent>
                    </Card>

                    {/* Content Moderation */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><MessageCircleWarning className="h-5 w-5"/>AI Content Moderation</CardTitle>
                            <CardDescription>Automatically moderate user-generated content.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex items-center justify-between"><Label>Block Profanity in Chat</Label><Switch defaultChecked /></div>
                             <div className="flex items-center justify-between"><Label>Flag Spam in Reviews</Label><Switch defaultChecked /></div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

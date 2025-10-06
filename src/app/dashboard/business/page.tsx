
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function BusinessDashboardPage() {
  return (
    <main className="flex-1 p-4 lg:p-6">
        <h1 className="text-2xl font-bold mb-4">Business Dashboard</h1>
        <Card>
            <CardHeader>
                <CardTitle>Welcome to your Business Dashboard</CardTitle>
                <CardDescription>This is where your business operations will be managed.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>More features coming soon!</p>
            </CardContent>
        </Card>
    </main>
  );
}

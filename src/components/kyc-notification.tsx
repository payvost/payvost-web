
'use client';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight, X } from "lucide-react";
import Link from "next/link";

interface KycNotificationProps {
    onDismiss: () => void;
}

export function KycNotification({ onDismiss }: KycNotificationProps) {
  return (
    <Alert className="mb-4 bg-yellow-500/10 border-yellow-500/20 text-yellow-800 dark:text-yellow-300 [&>svg]:text-yellow-600">
      <AlertTriangle className="h-4 w-4" />
      <div className="flex items-center justify-between">
        <div className="flex-1">
            <AlertTitle className="font-bold">Account Under Review</AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                Your profile is being reviewed. Please complete your profile to unlock all features, including payments and wallets.
            </AlertDescription>
        </div>
        <div className="flex items-center gap-2">
            <Button size="sm" asChild>
                <Link href="/dashboard/profile">Complete Profile <ArrowRight className="ml-2 h-4 w-4"/></Link>
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-yellow-800 dark:text-yellow-300" onClick={onDismiss}>
                <X className="h-4 w-4"/>
                <span className="sr-only">Dismiss</span>
            </Button>
        </div>
      </div>
    </Alert>
  );
}

    

'use client'

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Textarea } from "./ui/textarea"
import { AlertCircle, CheckCircle2, Circle, Mail, ShieldCheck, UserPlus, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Link from "next/link"


export function AccountCompletion() {
  const { user } = useAuth();
  const [checklistItems, setChecklistItems] = useState([
    { id: 'verify-email', label: 'Verify your email address', icon: <Mail className="h-5 w-5" />, completed: false, href: '/verify-email' },
    { id: 'add-recipient', label: 'Add your first recipient', icon: <UserPlus className="h-5 w-5" />, completed: false, href: '/dashboard/payments' },
    { id: 'first-transfer', label: 'Make your first transfer', icon: <Send className="h-5 w-5" />, completed: false, href: '/dashboard/payments' },
    { id: 'setup-2fa', label: 'Secure your account with 2FA', icon: <ShieldCheck className="h-5 w-5" />, completed: false, href: '/dashboard/settings' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
        setLoading(true);
        const userData = doc.data();
        
        const updatedChecklist = [
            { id: 'verify-email', label: 'Verify your email address', icon: <Mail className="h-5 w-5" />, completed: user.emailVerified, href: '/verify-email' },
            { id: 'add-recipient', label: 'Add your first recipient', icon: <UserPlus className="h-5 w-5" />, completed: userData?.beneficiaries?.length > 0, href: '/dashboard/payments' },
            { id: 'first-transfer', label: 'Make your first transfer', icon: <Send className="h-5 w-5" />, completed: userData?.transactions?.length > 0, href: '/dashboard/payments' },
            { id: 'setup-2fa', label: 'Secure your account with 2FA', icon: <ShieldCheck className="h-5 w-5" />, completed: false, href: '/dashboard/settings' }, // 2FA status might need a different check
        ];

        setChecklistItems(updatedChecklist);
        setLoading(false);
    });

    return () => unsub();

  }, [user]);

  const completedCount = checklistItems.filter(item => item.completed).length;
  const totalCount = checklistItems.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Your Setup</CardTitle>
        <CardDescription>
          Follow these steps to get the most out of Payvost.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <Progress value={progressPercentage} className="flex-1" />
          <span className="text-sm font-medium text-muted-foreground">{completedCount}/{totalCount}</span>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {checklistItems.map((item, index) => (
             <AccordionItem value={`item-${index}`} key={item.id}>
               <AccordionTrigger>
                 <div className="flex items-center gap-3">
                    {item.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                   <span className={cn("text-sm", item.completed && "line-through text-muted-foreground")}>
                     {item.label}
                   </span>
                 </div>
               </AccordionTrigger>
               <AccordionContent className="pl-8">
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                    {item.icon}
                    <div className="flex-1">
                        <p className="text-sm font-semibold mb-2">How to complete this step:</p>
                        <p className="text-xs text-muted-foreground">
                            {item.id === 'verify-email' && 'Check your inbox for a verification link we sent you.'}
                            {item.id === 'add-recipient' && 'Go to the payments page and add a new beneficiary to send money to.'}
                            {item.id === 'first-transfer' && 'Initiate your first money transfer to anyone in the world.'}
                            {item.id === 'setup-2fa' && 'Add an extra layer of security to your account by enabling Two-Factor Authentication.'}
                        </p>
                        <div className="mt-4">
                             <Button size="sm" asChild>
                                <Link href={item.href}>
                                    {item.id === 'verify-email' && 'Resend Email'}
                                    {item.id === 'add-recipient' && 'Add Recipient'}
                                    {item.id === 'first-transfer' && 'Send Money'}
                                    {item.id === 'setup-2fa' && 'Enable 2FA'}
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
               </AccordionContent>
             </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}


'use client'

import { useState } from "react"
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

const checklistItems = [
  { id: 'verify-email', label: 'Verify your email address', icon: <Mail className="h-5 w-5" />, completed: true },
  { id: 'add-recipient', label: 'Add your first recipient', icon: <UserPlus className="h-5 w-5" />, completed: false },
  { id: 'first-transfer', label: 'Make your first transfer', icon: <Send className="h-5 w-5" />, completed: false },
  { id: 'setup-2fa', label: 'Secure your account with 2FA', icon: <ShieldCheck className="h-5 w-5" />, completed: false },
]

export function AccountCompletion() {
  const [checkedItems, setCheckedItems] = useState<string[]>(
    checklistItems.filter(item => item.completed).map(item => item.id)
  );

  const handleCheckboxChange = (id: string, isChecked: boolean) => {
    setCheckedItems(prev => 
      isChecked ? [...prev, id] : prev.filter(item => item !== id)
    );
  };

  const completedCount = checkedItems.length;
  const totalCount = checklistItems.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Your Setup</CardTitle>
        <CardDescription>
          Follow these steps to get the most out of Qwibik Remit.
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
                    {checkedItems.includes(item.id) ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                   <span className={cn("text-sm", checkedItems.includes(item.id) && "line-through text-muted-foreground")}>
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
                            Here are some brief instructions for completing the task. For example, to verify your email, check your inbox for a verification link.
                        </p>
                        <div className="mt-4">
                            {item.id === 'add-recipient' && (
                                <Button size="sm">Add Recipient</Button>
                            )}
                            {item.id === 'first-transfer' && (
                                <Button size="sm">Send Money</Button>
                            )}
                             {item.id === 'setup-2fa' && (
                                <Button size="sm">Enable 2FA</Button>
                            )}
                             {item.id === 'verify-email' && (
                                 <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-amber-500"/>
                                    <p className="text-xs text-amber-600">Verification pending.</p>
                                 </div>
                            )}
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

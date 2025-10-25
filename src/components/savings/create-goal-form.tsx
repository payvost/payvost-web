
'use client';

import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, CalendarIcon, Loader2, PiggyBank, PlusCircle, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

const goalSchema = z.object({
  goalName: z.string().min(3, 'Goal name is required'),
  targetAmount: z.preprocess((val) => Number(String(val)), z.number().positive('Target must be > 0')),
  emoji: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  debitAmount: z.preprocess((val) => Number(String(val)), z.number().positive('Amount must be > 0')),
  autoDebit: z.boolean(),
  startDate: z.date({ required_error: 'Start date is required' }),
  durationInMonths: z.preprocess((val) => Number(String(val)), z.number().min(1, 'Duration is required')),
});

type GoalFormValues = z.infer<typeof goalSchema>;

interface CreateGoalFormProps {
    onBack: () => void;
    onGoalCreated: () => void;
}

const emojiList = ['🏠', '🚗', '🎓', '✈️', '💻', '🎁', '💼'];


export function CreateGoalForm({ onBack, onGoalCreated }: CreateGoalFormProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<GoalFormValues>({
        resolver: zodResolver(goalSchema),
        defaultValues: {
            frequency: 'monthly',
            autoDebit: true,
            startDate: new Date(),
        },
    });

    const onSubmit: SubmitHandler<GoalFormValues> = async (data) => {
        if (!user) {
            toast({ title: 'Not Authenticated', variant: 'destructive' });
            return;
        }
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'users', user.uid, 'savings_plans'), {
                ...data,
                startDate: Timestamp.fromDate(data.startDate),
                currentAmount: 0,
                status: 'active',
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Goal Created!', description: 'Your new savings plan is active.' });
            onGoalCreated();
        } catch (error) {
            console.error("Error creating goal:", error);
            toast({ title: 'Error', description: 'Could not create your savings goal.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Card>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={onBack}>
                           <ArrowLeft className="h-4 w-4" />
                           <span className="sr-only">Back</span>
                        </Button>
                        <div>
                            <CardTitle>Create a New Savings Goal</CardTitle>
                            <CardDescription>Plan your savings and reach your goals faster.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-end gap-4">
                        <div className="space-y-2">
                             <Label>Goal Icon</Label>
                             <Controller
                                name="emoji"
                                control={control}
                                render={({ field }) => (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-20 h-20 text-4xl">{field.value || '🏦'}</Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto grid grid-cols-4 gap-2">
                                            {emojiList.map(emoji => (
                                                <Button key={emoji} variant="ghost" size="icon" className="text-2xl" onClick={() => field.onChange(emoji)}>{emoji}</Button>
                                            ))}
                                        </PopoverContent>
                                    </Popover>
                                )}
                             />
                        </div>
                        <div className="space-y-2 flex-1">
                            <Label htmlFor="goalName">What are you saving for?</Label>
                            <Input id="goalName" {...register('goalName')} placeholder="e.g., New Laptop, Vacation" />
                            {errors.goalName && <p className="text-sm text-destructive">{errors.goalName.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="targetAmount">Target Amount (USD)</Label>
                        <Input id="targetAmount" type="number" {...register('targetAmount')} placeholder="5000" />
                        {errors.targetAmount && <p className="text-sm text-destructive">{errors.targetAmount.message}</p>}
                    </div>
                    
                    <Separator />
                    
                     <div className="space-y-4">
                         <h4 className="font-semibold text-sm">Automation</h4>
                          <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="autoDebit">Enable Auto-Debit</Label>
                                <p className="text-xs text-muted-foreground">Automatically save money from your wallet.</p>
                            </div>
                            <Controller name="autoDebit" control={control} render={({field}) => (<Switch id="autoDebit" checked={field.value} onCheckedChange={field.onChange} />)}/>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="debitAmount">Amount to Save</Label>
                                <Input id="debitAmount" type="number" {...register('debitAmount')} placeholder="250" />
                                {errors.debitAmount && <p className="text-sm text-destructive">{errors.debitAmount.message}</p>}
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="frequency">Frequency</Label>
                                <Controller name="frequency" control={control} render={({field}) => (<Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent></Select>)}/>
                            </div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Controller name="startDate" control={control} render={({ field }) => (
                                    <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover>
                                )}/>
                                {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="durationInMonths">Duration (in months)</Label>
                                <Input id="durationInMonths" type="number" {...register('durationInMonths')} placeholder="12" />
                                {errors.durationInMonths && <p className="text-sm text-destructive">{errors.durationInMonths.message}</p>}
                            </div>
                         </div>
                    </div>


                </CardContent>
                <CardFooter>
                     <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Creating Goal...</> : <><PlusCircle className="mr-2 h-4 w-4"/>Create Savings Goal</>}
                     </Button>
                </CardFooter>
            </form>
        </Card>
    )
}

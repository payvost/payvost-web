
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { SavingsGoal } from '@/types/savings-goal';
import { format } from 'date-fns';

interface SavingsGoalListProps {
  goals: SavingsGoal[];
  onEditGoal: (id: string) => void;
}

export function SavingsGoalList({ goals, onEditGoal }: SavingsGoalListProps) {

  if (goals.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>My Savings Goals</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground py-10">
                <p>You haven't set any savings goals yet.</p>
                <p className="text-xs">Click "New Savings Goal" to get started.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Savings Goals</CardTitle>
        <CardDescription>An overview of your active and completed savings plans.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {goals.map((goal) => {
          const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
          return (
            <div key={goal.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="text-4xl">{goal.emoji || '🎯'}</div>
                        <div>
                            <h4 className="font-semibold">{goal.goalName}</h4>
                            <p className="text-sm text-muted-foreground">
                                Next payment: {format(new Date(), 'MMM dd, yyyy')}
                            </p>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => onEditGoal(goal.id)}>Edit Goal</DropdownMenuItem>
                            <DropdownMenuItem>Pause Goal</DropdownMenuItem>
                             <DropdownMenuItem className="text-destructive">Delete Goal</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="mt-4 space-y-2">
                    <Progress value={progress} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>${goal.currentAmount.toLocaleString()}</span>
                        <span>Target: ${goal.targetAmount.toLocaleString()}</span>
                    </div>
                </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  );
}

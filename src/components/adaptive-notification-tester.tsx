'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getAdaptiveNotification } from '@/app/actions';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';

type FormValues = {
  messageType: string;
  messageDetails: string;
}

interface AdaptiveNotificationTesterProps {
  language: GenerateNotificationInput['languagePreference'];
}

export function AdaptiveNotificationTester({ language }: AdaptiveNotificationTesterProps) {
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      messageType: 'transaction update',
      messageDetails: 'Transaction ID 12345 for $50 to John Doe was successful.'
    }
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setError('');
    setGeneratedMessage('');

    const input: GenerateNotificationInput = {
      languagePreference: language,
      messageType: data.messageType,
      messageDetails: data.messageDetails,
    }
    const result = await getAdaptiveNotification(input);
    if (result.success) {
      setGeneratedMessage(result.message);
    } else {
      setError(result.message);
    }
    setIsLoading(false);
  };

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>Adaptive Notification Tool</CardTitle>
          <CardDescription>
            Generate language-appropriate notifications based on user preferences.
            Current language: <span className="font-bold uppercase">{language}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="messageType">Message Type</Label>
            <Select
              onValueChange={(value) => setValue('messageType', value)}
              defaultValue={watch('messageType')}
            >
              <SelectTrigger id="messageType">
                <SelectValue placeholder="Select a message type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transaction update">Transaction Update</SelectItem>
                <SelectItem value="account activity">Account Activity</SelectItem>
                <SelectItem value="security alert">Security Alert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="messageDetails">Message Details</Label>
            <Input 
              id="messageDetails"
              {...register('messageDetails', { required: 'Details are required' })}
              placeholder="e.g. Transaction ID 12345 for $50"
            />
            {errors.messageDetails && <p className="text-sm text-destructive">{errors.messageDetails.message}</p>}
          </div>

          {generatedMessage && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Generated Notification</AlertTitle>
              <AlertDescription>{generatedMessage}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Notification
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

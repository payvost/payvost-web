'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { userService, type UserProfile } from '@/services';
import { Loader2, CheckCircle2, XCircle, User, ShieldCheck, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';

interface SendToUserFormProps {
  onRecipientChange?: (recipient: UserProfile | null) => void;
  onAmountChange?: (amount: string) => void;
  onNoteChange?: (note: string) => void;
  disabled?: boolean;
  defaultAmount?: string;
  defaultNote?: string;
}

export function SendToUserForm({
  onRecipientChange,
  onAmountChange,
  onNoteChange,
  disabled = false,
  defaultAmount = '',
  defaultNote = '',
}: SendToUserFormProps) {
  const [paymentId, setPaymentId] = useState('');
  const [amount, setAmount] = useState(defaultAmount);
  const [note, setNote] = useState(defaultNote);
  const [recipient, setRecipient] = useState<UserProfile | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedPaymentId = useDebounce(paymentId, 500);

  // Lookup user when payment ID changes
  useEffect(() => {
    const lookupUser = async () => {
      if (!debouncedPaymentId || debouncedPaymentId.length < 3) {
        setRecipient(null);
        setSearchError(null);
        setHasSearched(false);
        onRecipientChange?.(null);
        return;
      }

      setIsSearching(true);
      setSearchError(null);
      setHasSearched(true);

      try {
        const user = await userService.lookupUser(debouncedPaymentId);
        
        if (user) {
          setRecipient(user);
          setSearchError(null);
          onRecipientChange?.(user);
        } else {
          setRecipient(null);
          setSearchError('User not found. Please check the Payment ID or email.');
          onRecipientChange?.(null);
        }
      } catch (error) {
        console.error('Error looking up user:', error);
        setRecipient(null);
        setSearchError('Unable to search. Please try again.');
        onRecipientChange?.(null);
      } finally {
        setIsSearching(false);
      }
    };

    lookupUser();
  }, [debouncedPaymentId, onRecipientChange]);

  // Notify parent of amount changes
  useEffect(() => {
    onAmountChange?.(amount);
  }, [amount, onAmountChange]);

  // Notify parent of note changes
  useEffect(() => {
    onNoteChange?.(note);
  }, [note, onNoteChange]);

  const handlePaymentIdChange = (value: string) => {
    setPaymentId(value);
    if (!value) {
      setRecipient(null);
      setSearchError(null);
      setHasSearched(false);
      onRecipientChange?.(null);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      {/* Payment ID Input with Search */}
      <div className="space-y-2">
        <Label htmlFor="payment-id">
          Payment ID (Username or Email)
          <span className="text-xs text-muted-foreground ml-2">
            Free transfers to Payvost users
          </span>
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="payment-id"
            placeholder="@username or user@example.com"
            value={paymentId}
            onChange={(e) => handlePaymentIdChange(e.target.value)}
            disabled={disabled}
            className={cn(
              "pl-10",
              searchError && hasSearched && "border-destructive",
              recipient && "border-green-500"
            )}
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {!isSearching && hasSearched && recipient && (
            <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
          )}
          {!isSearching && hasSearched && !recipient && debouncedPaymentId.length >= 3 && (
            <XCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-destructive" />
          )}
        </div>
        {searchError && hasSearched && (
          <p className="text-sm text-destructive">{searchError}</p>
        )}
        {!searchError && !recipient && debouncedPaymentId.length >= 3 && hasSearched && (
          <p className="text-sm text-muted-foreground">
            No user found with that Payment ID
          </p>
        )}
      </div>

      {/* Recipient Verification Card */}
      {recipient && (
        <div className="p-4 border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 rounded-lg space-y-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={recipient.photoURL} alt={recipient.fullName || 'User'} />
              <AvatarFallback>
                {getInitials(recipient.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm truncate">
                  {recipient.fullName || recipient.username || recipient.email}
                </p>
                {recipient.isVerified && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {recipient.username && `@${recipient.username}`}
                {recipient.email && recipient.email}
              </p>
              {recipient.country && (
                <p className="text-xs text-muted-foreground">
                  {recipient.country}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
            <CheckCircle2 className="h-3 w-3" />
            <span>Free instant transfer to Payvost users</span>
          </div>
        </div>
      )}

      {/* Amount Input */}
      <div className="space-y-2">
        <Label htmlFor="amount-user">Amount to Send</Label>
        <Input
          id="amount-user"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={disabled || !recipient}
          min="0"
          step="0.01"
        />
        {recipient && (
          <p className="text-xs text-muted-foreground">
            {recipient.fullName || 'Recipient'} will receive this amount instantly
          </p>
        )}
      </div>

      {/* Note Input */}
      <div className="space-y-2">
        <Label htmlFor="note">Note (Optional)</Label>
        <Input
          id="note"
          placeholder="e.g. For lunch, Thanks for the help!"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={disabled || !recipient}
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground text-right">
          {note.length}/100
        </p>
      </div>

      {/* Payment ID Benefits Info */}
      {!recipient && !hasSearched && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Why use Payment IDs?</strong>
          </p>
          <ul className="text-xs text-blue-800 dark:text-blue-200 mt-1 space-y-1 list-disc list-inside">
            <li>Free transfers (no fees)</li>
            <li>Instant delivery</li>
            <li>Secure and verified users</li>
            <li>Easy to remember usernames</li>
          </ul>
        </div>
      )}
    </div>
  );
}

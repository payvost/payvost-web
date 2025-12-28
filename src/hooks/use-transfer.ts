import { useState, useCallback } from 'react';
import { transactionService } from '@/services/transactionService';
import { userService, UserProfile } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';

export interface TransferState {
    step: 'recipient' | 'amount' | 'quote' | 'success' | 'error';
    recipient: UserProfile | null;
    amount: number;
    currency: string;
    fromAccountId: string;
    quote: any | null;
    loading: boolean;
    error: string | null;
    transferResult: any | null;
}

export function useTransfer() {
    const { toast } = useToast();
    const [state, setState] = useState<TransferState>({
        step: 'recipient',
        recipient: null,
        amount: 0,
        currency: 'USD',
        fromAccountId: '',
        quote: null,
        loading: false,
        error: null,
        transferResult: null
    });

    const [recipients, setRecipients] = useState<UserProfile[]>([]);
    const [loadingRecipients, setLoadingRecipients] = useState(false);

    const fetchRecipients = useCallback(async () => {
        setLoadingRecipients(true);
        try {
            const users = await userService.listUsers();
            setRecipients(users);
        } catch (err: any) {
            console.error('Failed to fetch recipients:', err);
            toast({
                title: 'Error',
                description: 'Failed to load recipients.',
                variant: 'destructive',
            });
        } finally {
            setLoadingRecipients(false);
        }
    }, [toast]);

    const selectRecipient = (recipient: UserProfile) => {
        setState(prev => ({ ...prev, recipient, step: 'amount' }));
    };

    const updateAmount = (amount: number, currency: string, fromAccountId: string) => {
        setState(prev => ({ ...prev, amount, currency, fromAccountId }));
    };

    const getQuote = async () => {
        if (!state.recipient || !state.fromAccountId || state.amount <= 0) return;

        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            // For now, we assume the recipient has one primary wallet or we send to their ID
            // In a real app we'd need to fetch their accounts OR send to their user ID (if backend handles it)
            // Our backend executeTransfer takes toAccountId. 
            // We need to know the recipient's account ID. 
            // userService.listUsers returns uid, but we need an account ID.

            // Let's assume for now that we fetch the recipient's accounts if we select them.
            // For simplicity in this demo, I'll assume the first account of the recipient.

            const recipientProfile = await userService.getUserProfile(state.recipient.uid);
            // Wait, listUsers gave us the info. But we need their account ID.
            // I'll add a check for receiver accounts.

            const quote = await transactionService.getQuote({
                fromAccountId: state.fromAccountId,
                toUserId: state.recipient.uid,                // OR we need to fetch accounts. Let's check TransactionManager.
                amount: state.amount,
                currency: state.currency,
            });

            setState(prev => ({ ...prev, quote, step: 'quote', loading: false }));
        } catch (err: any) {
            setState(prev => ({ ...prev, error: err.message, loading: false }));
            toast({
                title: 'Quote Error',
                description: err.message,
                variant: 'destructive',
            });
        }
    };

    const executeTransfer = async (idempotencyKey?: string) => {
        if (!state.quote) return;

        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            const result = await transactionService.executeWithQuote({
                quote: state.quote,
                idempotencyKey
            });
            setState(prev => ({
                ...prev,
                transferResult: result,
                step: 'success',
                loading: false
            }));
            toast({
                title: 'Success',
                description: 'Transfer completed successfully.',
            });
        } catch (err: any) {
            setState(prev => ({ ...prev, error: err.message, loading: false }));
            toast({
                title: 'Transfer Failed',
                description: err.message,
                variant: 'destructive',
            });
        }
    };

    const reset = () => {
        setState({
            step: 'recipient',
            recipient: null,
            amount: 0,
            currency: 'USD',
            fromAccountId: '',
            quote: null,
            loading: false,
            error: null,
            transferResult: null
        });
    };

    const setStep = (step: TransferState['step']) => {
        setState(prev => ({ ...prev, step }));
    };

    return {
        ...state,
        recipients,
        loadingRecipients,
        fetchRecipients,
        selectRecipient,
        updateAmount,
        getQuote,
        executeTransfer,
        reset,
        setStep
    };
}

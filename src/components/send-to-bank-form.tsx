
'use client';

import { useState } from 'react';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const countryBankData: Record<string, string[]> = {
    USA: ['Chase Bank', 'Bank of America', 'Wells Fargo'],
    NGA: ['Guaranty Trust Bank', 'Zenith Bank', 'Access Bank'],
    GBR: ['Barclays', 'HSBC', 'Lloyds Bank'],
    GHA: ['GCB Bank', 'Ecobank Ghana', 'Fidelity Bank'],
};

interface SendToBankFormProps {
    onCountryChange?: (country: string) => void;
    onBankChange?: (bank: string) => void;
    onAccountNumberChange?: (accountNumber: string) => void;
    onRecipientNameChange?: (name: string) => void;
    onAmountChange?: (amount: string) => void;
    onSaveBeneficiaryChange?: (save: boolean) => void;
    disabled?: boolean;
}

export function SendToBankForm({
    onCountryChange,
    onBankChange,
    onAccountNumberChange,
    onRecipientNameChange,
    onAmountChange,
    onSaveBeneficiaryChange,
    disabled
}: SendToBankFormProps) {
    const [selectedCountry, setSelectedCountry] = useState('');
    const [saveBeneficiary, setSaveBeneficiary] = useState(false);
    const banks = selectedCountry ? countryBankData[selectedCountry] : [];

    const handleCountryChange = (val: string) => {
        setSelectedCountry(val);
        onCountryChange?.(val);
    };

    const handleSaveChange = (checked: boolean) => {
        setSaveBeneficiary(checked);
        onSaveBeneficiaryChange?.(checked);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="country">Recipient's Country</Label>
                <Select onValueChange={handleCountryChange} disabled={disabled}>
                    <SelectTrigger id="country">
                        <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="USA">United States</SelectItem>
                        <SelectItem value="NGA">Nigeria</SelectItem>
                        <SelectItem value="GBR">United Kingdom</SelectItem>
                        <SelectItem value="GHA">Ghana</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="bank">Bank</Label>
                <Select
                    disabled={!selectedCountry || disabled}
                    onValueChange={onBankChange}
                >
                    <SelectTrigger id="bank">
                        <SelectValue placeholder={selectedCountry ? "Select a bank" : "Select a country first"} />
                    </SelectTrigger>
                    <SelectContent>
                        {banks.map(bank => (
                            <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="account-number">Account Number</Label>
                <Input
                    id="account-number"
                    placeholder="Enter recipient's account number"
                    onChange={(e) => onAccountNumberChange?.(e.target.value)}
                    disabled={disabled}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="recipient-name">Recipient's Name</Label>
                <Input
                    id="recipient-name"
                    placeholder="Name on the bank account"
                    onChange={(e) => onRecipientNameChange?.(e.target.value)}
                    disabled={disabled}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="amount">Amount to Send (USD)</Label>
                <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    onChange={(e) => onAmountChange?.(e.target.value)}
                    disabled={disabled}
                />
            </div>
            <div className="flex items-center space-x-2 pt-2">
                <input
                    type="checkbox"
                    id="save-beneficiary"
                    checked={saveBeneficiary}
                    onChange={(e) => handleSaveChange(e.target.checked)}
                    disabled={disabled}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="save-beneficiary" className="text-sm font-medium cursor-pointer">
                    Save as beneficiary for future use
                </Label>
            </div>
        </div>
    )
}

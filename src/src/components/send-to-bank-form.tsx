
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

export function SendToBankForm() {
    const [selectedCountry, setSelectedCountry] = useState('');
    const banks = selectedCountry ? countryBankData[selectedCountry] : [];

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="country">Recipient's Country</Label>
                <Select onValueChange={setSelectedCountry}>
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
                 <Select disabled={!selectedCountry}>
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
                <Input id="account-number" placeholder="Enter recipient's account number" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="recipient-name">Recipient's Name</Label>
                <Input id="recipient-name" placeholder="Name on the bank account" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="amount">Amount to Send (USD)</Label>
                <Input id="amount" type="number" placeholder="0.00" />
            </div>
        </div>
    )
}


'use client';

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function SendToBankForm() {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="country">Recipient's Country</Label>
                <Select>
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
                <Input id="bank" placeholder="e.g. Guaranty Trust Bank" />
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

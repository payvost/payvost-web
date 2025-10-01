
'use client';

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SendToUserForm() {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="username">Username or Email</Label>
                <Input id="username" placeholder="@username or user@example.com" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="amount-user">Amount to Send (USD)</Label>
                <Input id="amount-user" type="number" placeholder="0.00" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="note">Note (Optional)</Label>
                <Input id="note" placeholder="e.g. For lunch" />
            </div>
        </div>
    )
}

'use client';

import { PosTerminal } from "@/components/pos-terminal";

export default function PosTerminalPage() {
    return (
        <>
             <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Virtual POS Terminal</h2>
                    <p className="text-muted-foreground">Accept in-person payments with our point-of-sale terminal.</p>
                </div>
            </div>
            <div className="max-w-md mx-auto">
                <PosTerminal />
            </div>
        </>
    )
}

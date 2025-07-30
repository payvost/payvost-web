
'use client';

import { useState } from "react";
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
import { ArrowRightLeft, Landmark, Users, AtSign, ArrowDown } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { SendToBankForm } from "./send-to-bank-form"
import { SendToUserForm } from "./send-to-user-form"
import { PaymentConfirmationDialog } from "./payment-confirmation-dialog";


export function QuickRemit() {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSendMoney = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
  }

  const transactionDetails = {
    sendAmount: "1,000.00",
    sendCurrency: "USD",
    recipientGets: "1,450,500.00",
    recipientCurrency: "NGN",
    recipientName: "John Doe",
    exchangeRate: "1 USD = 1,450.50 NGN",
    fee: "$5.00"
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Money</CardTitle>
        <CardDescription>Choose a recipient and send money in just a few clicks.</CardDescription>
      </CardHeader>
      <Tabs defaultValue="beneficiary">
        <CardContent className="pb-0">
             <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="beneficiary"><Users className="mr-2 h-4 w-4"/>To Beneficiary</TabsTrigger>
                <TabsTrigger value="bank"><Landmark className="mr-2 h-4 w-4"/>Send to Bank</TabsTrigger>
                <TabsTrigger value="user"><AtSign className="mr-2 h-4 w-4"/>Send to User</TabsTrigger>
            </TabsList>
        </CardContent>
        <TabsContent value="beneficiary">
             <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient</Label>
                  <Select>
                      <SelectTrigger id="recipient">
                      <SelectValue placeholder="Select a saved recipient" />
                      </SelectTrigger>
                      <SelectContent>
                      <SelectItem value="john-doe">John Doe (USA)</SelectItem>
                      <SelectItem value="jane-smith">Jane Smith (UK)</SelectItem>
                      <SelectItem value="pierre-dupont">Pierre Dupont (France)</SelectItem>
                      </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="from-wallet">From Wallet</Label>
                      <Select defaultValue="USD">
                          <SelectTrigger id="from-wallet">
                              <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="USD">USD Wallet ($1,250.75)</SelectItem>
                              <SelectItem value="EUR">EUR Wallet (€2,500.50)</SelectItem>
                              <SelectItem value="GBP">GBP Wallet (£850.00)</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                   <div className="space-y-2">
                        <Label htmlFor="send-amount">You send</Label>
                        <Input id="send-amount" defaultValue="1000.00" />
                    </div>
                </div>

                <div className="flex justify-center items-center my-4">
                   <div className="w-full border-t border-dashed"></div>
                   <ArrowDown className="h-5 w-5 text-muted-foreground mx-4" />
                   <div className="w-full border-t border-dashed"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="recipient-currency">Recipient Currency</Label>
                         <Select defaultValue="NGN">
                            <SelectTrigger id="recipient-currency">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="NGN">Nigerian Naira (NGN)</SelectItem>
                                <SelectItem value="GHS">Ghanaian Cedi (GHS)</SelectItem>
                                <SelectItem value="KES">Kenyan Shilling (KES)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="recipient-gets">Recipient gets</Label>
                        <Input id="recipient-gets" defaultValue="1,450,500.00" readOnly/>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="note">Note / Reference (Optional)</Label>
                    <Input id="note" placeholder="e.g., For school fees" />
                </div>
                
                <div className="text-sm text-muted-foreground pt-2">
                <p>Exchange rate: 1 USD = 1,450.50 NGN | Fee: $5.00</p>
                </div>
            </CardContent>
             <CardFooter>
                 <PaymentConfirmationDialog onConfirm={handleSendMoney} transactionDetails={transactionDetails} isLoading={isLoading}>
                    <Button className="w-full" disabled={isLoading}>Send Money</Button>
                 </PaymentConfirmationDialog>
            </CardFooter>
        </TabsContent>
        <TabsContent value="bank">
            <CardContent className="space-y-4 pt-4">
                <SendToBankForm />
            </CardContent>
             <CardFooter>
                <PaymentConfirmationDialog onConfirm={handleSendMoney} transactionDetails={{...transactionDetails, recipientName: "New Bank Recipient"}} isLoading={isLoading}>
                    <Button className="w-full" disabled={isLoading}>Continue to Transfer</Button>
                </PaymentConfirmationDialog>
            </CardFooter>
        </TabsContent>
        <TabsContent value="user">
            <CardContent className="space-y-4 pt-4">
                <SendToUserForm />
            </CardContent>
             <CardFooter>
                 <PaymentConfirmationDialog onConfirm={handleSendMoney} transactionDetails={{...transactionDetails, recipientName: "Payvost User"}} isLoading={isLoading}>
                    <Button className="w-full" disabled={isLoading}>Send to User</Button>
                 </PaymentConfirmationDialog>
            </CardFooter>
        </TabsContent>
      </Tabs>
    </Card>
  )
}

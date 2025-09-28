'use client';

import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Copy, QrCode, Link as LinkIcon } from 'lucide-react';

export default function PaymentLinkTab() {
  const [generatedLink, setGeneratedLink] = useState('');
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Fetch recent requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const q = query(collection(db, 'paymentRequests'), orderBy('createdAt', 'desc'), limit(5));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setRecentRequests(data);
      } catch (err) {
        console.error('Error fetching requests:', err);
      }
    };
    fetchRequests();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const amount = (form as any).amount.value;
    const description = (form as any).description.value;
    const payerEmail = (form as any)['payer-email'].value;
    const currency = (form as any).currency.value;

    const link = `https://qwibik.remit/pay/${Math.random().toString(36).substring(2, 10)}`;
    setGeneratedLink(link);

    try {
      let fileURL = '';

      // Upload file to storage if selected
      if (file) {
        const storageRef = ref(storage, `payment_banners/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        fileURL = await getDownloadURL(storageRef);
      }

      // Add document to Firestore
      await addDoc(collection(db, 'paymentRequests'), {
        to: payerEmail || 'No email (Link)',
        amount: `${currency} ${amount}`,
        description,
        status: 'Pending',
        date: new Date().toISOString().split('T')[0],
        createdAt: Timestamp.now(),
        link,
        bannerURL: fileURL,
      });

      toast({
        title: 'Payment Link Generated!',
        description: 'You can now share the link with your payer.',
      });

      // Refresh recent requests
      const q = query(collection(db, 'paymentRequests'), orderBy('createdAt', 'desc'), limit(5));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRecentRequests(data);
      setFile(null); // Reset file input
    } catch (err) {
      console.error('Error saving request:', err);
      toast({
        title: 'Error',
        description: 'Failed to save request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    toast({
      title: 'Copied to Clipboard!',
      description: 'The payment link has been copied.',
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div>
        <form onSubmit={handleCreateRequest}>
          <Card>
            <CardHeader>
              <CardTitle>Create Payment Link</CardTitle>
              <CardDescription>
                Generate a secure link to get paid by anyone, for anything.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input id="amount" name="amount" type="number" placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select name="currency" defaultValue="USD">
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="NGN">NGN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">What is this for?</Label>
                <Input id="description" name="description" placeholder="Description" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payer-email">Payer's Email (Optional)</Label>
                <Input id="payer-email" name="payer-email" type="email" placeholder="Send invoice to email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banner">Upload Banner (Optional)</Label>
                <Input
                  type="file"
                  id="banner"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <p className="text-sm text-muted-foreground">Fees may apply.</p>
              <Button type="submit">
                <LinkIcon className="mr-2 h-4 w-4" />
                Create Payment Link
              </Button>
            </CardFooter>
          </Card>
        </form>

        {generatedLink && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Your Payment Link is Ready!</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Input value={generatedLink} readOnly />
              <Button variant="outline" size="icon" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <QrCode className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
            <CardDescription>A log of your recent payment requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>To</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="font-medium truncate">{req.to}</div>
                      <div className="text-sm text-muted-foreground">{req.date}</div>
                    </TableCell>
                    <TableCell>{req.amount}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          req.status === 'Paid'
                            ? 'default'
                            : req.status === 'Pending'
                            ? 'secondary'
                            : 'destructive'
                        }
                        className="capitalize"
                      >
                        {req.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              View All Requests
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

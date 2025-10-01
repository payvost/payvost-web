
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export function PosTerminal() {
  const [amount, setAmount] = useState('0.00');

  const handleKeyPress = (key: string) => {
    if (key === 'del') {
      setAmount(prev => {
        const newAmount = prev.replace(/\D/g, '').slice(0, -1);
        return formatAmount(newAmount);
      });
      return;
    }
    
    if (key === 'C') {
        setAmount('0.00');
        return;
    }

    setAmount(prev => {
      const currentDigits = prev.replace(/\D/g, '');
      const newAmount = currentDigits + key;
      return formatAmount(newAmount);
    });
  };

  const formatAmount = (digits: string) => {
    if (!digits) return '0.00';
    const num = parseInt(digits, 10);
    return (num / 100).toFixed(2);
  };

  const keypadButtons = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    'C', '0', 'del'
  ];

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Display */}
        <div className="bg-muted/50 rounded-lg p-4 text-right">
            <p className="text-sm text-muted-foreground">Charge Amount</p>
            <p className="text-5xl font-bold tracking-tight">${amount}</p>
        </div>

        {/* Note */}
        <Input placeholder="Add a note or description (optional)" />
        
        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2">
          {keypadButtons.map(key => (
            <Button
              key={key}
              variant="outline"
              className="h-20 text-2xl font-semibold"
              onClick={() => handleKeyPress(key)}
            >
              {key === 'del' ? <X className="h-8 w-8" /> : key}
            </Button>
          ))}
        </div>

        {/* Action Button */}
        <Button className="w-full h-16 text-xl" size="lg">
          Charge ${amount}
        </Button>
      </CardContent>
    </Card>
  );
}

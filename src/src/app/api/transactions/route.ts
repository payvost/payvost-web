
import { NextResponse } from 'next/server';

const transactions = [
    { id: 'txn_01', recipient: 'John Doe', amount: '-$250.00', currency: 'USD', status: 'Completed', type: 'Transfer', date: '2024-05-23' },
    { id: 'txn_02', recipient: 'Jane Smith', amount: '-$150.00', currency: 'USD', status: 'Pending', type: 'Transfer', date: '2024-05-22' },
    { id: 'txn_03', recipient: 'MTN Airtime', amount: '-$10.00', currency: 'USD', status: 'Completed', type: 'Bill Payment', date: '2024-05-22' },
    { id: 'txn_04', recipient: 'Pierre Dupont', amount: '-$350.00', currency: 'USD', status: 'Completed', type: 'Transfer', date: '2024-05-21' },
    { id: 'txn_05', recipient: 'Adebayo Adekunle', amount: '-$50.00', currency: 'USD', status: 'Failed', type: 'Transfer', date: '2024-05-20' },
    { id: 'txn_06', recipient: 'Amazon Gift Card', amount: '-$100.00', currency: 'USD', status: 'Completed', type: 'Gift Card', date: '2024-05-20' },
    { id: 'txn_07', recipient: 'Emily White', amount: '-$500.00', currency: 'USD', status: 'Completed', type: 'Transfer', date: '2024-05-19' },
    { id: 'txn_08', recipient: 'Ikeja Electric', amount: '-$75.00', currency: 'USD', status: 'Completed', type: 'Bill Payment', date: '2024-05-18' },
  ];
  

export async function GET(request: Request) {
    // In a real application, you would fetch this data from a database
    // based on the logged-in user.
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const searchQuery = searchParams.get('q');

    let filteredTransactions = transactions;

    if (status) {
        filteredTransactions = filteredTransactions.filter(tx => tx.status.toLowerCase() === status.toLowerCase());
    }

    if (type) {
        filteredTransactions = filteredTransactions.filter(tx => tx.type.toLowerCase().replace(' ', '') === type.toLowerCase());
    }

    if(searchQuery) {
        filteredTransactions = filteredTransactions.filter(tx => tx.recipient.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return NextResponse.json(filteredTransactions);
}

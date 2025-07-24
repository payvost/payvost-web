import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpRight } from "lucide-react"
import Link from "next/link"

const transactions = [
  { name: 'John Doe', amount: '-$250.00', date: '2024-05-23', status: 'Completed', currency: 'USD' },
  { name: 'Jane Smith', amount: '-$150.00', date: '2024-05-22', status: 'In Progress', currency: 'USD' },
  { name: 'Pierre Dupont', amount: '-$350.00', date: '2024-05-21', status: 'Completed', currency: 'USD' },
  { name: 'Adebayo Adekunle', amount: '-$50.00', date: '2024-05-20', status: 'Failed', currency: 'USD' },
  { name: 'Emily White', amount: '-$500.00', date: '2024-05-19', status: 'Completed', currency: 'USD' },
];

export function RecentTransactions() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            An overview of your latest transfers.
          </CardDescription>
        </div>
        <Button asChild size="sm" className="ml-auto gap-1">
          <Link href="/dashboard/transactions">
            View All
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recipient</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Status</TableHead>
              <TableHead className="hidden text-right md:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.name}>
                <TableCell>
                  <div className="font-medium">{tx.name}</div>
                  <div className="text-sm text-muted-foreground hidden md:inline">{tx.currency}</div>
                </TableCell>
                <TableCell className="text-right">{tx.amount}</TableCell>
                <TableCell className="hidden text-right sm:table-cell">
                  <Badge 
                    variant={
                      tx.status === 'Completed' ? 'default' : 
                      tx.status === 'In Progress' ? 'secondary' : 'destructive'
                    }
                    className="capitalize"
                  >
                    {tx.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden text-right md:table-cell">{tx.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

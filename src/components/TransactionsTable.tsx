import { MoreHorizontal, Pencil, Trash2, Sparkles, Loader2 } from 'lucide-react';
import type { TransactionVM } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TransactionsTableProps {
  transactions: TransactionVM[];
  onEdit: (transaction: TransactionVM) => void;
  onDelete: (transactionId: number) => void;
}

/**
 * Desktop table view for transactions
 */
export function TransactionsTable({
  transactions,
  onEdit,
  onDelete,
}: TransactionsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Opis</TableHead>
            <TableHead>Kategoria</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead className="text-right">Kwota</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                Brak transakcji do wyświetlenia
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TransactionsTableRow
                key={transaction.id}
                transaction={transaction}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

interface TransactionsTableRowProps {
  transaction: TransactionVM;
  onEdit: (transaction: TransactionVM) => void;
  onDelete: (transactionId: number) => void;
}

/**
 * Single row in the transactions table
 */
function TransactionsTableRow({
  transaction,
  onEdit,
  onDelete,
}: TransactionsTableRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        {transaction.date}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span>{transaction.description}</span>
          {transaction.categorizationStatus === 'pending' ? (
            <Loader2
              className="h-4 w-4 text-blue-500 animate-spin"
              aria-label="Kategoryzacja w toku..."
            />
          ) : transaction.isAiCategorized ? (
            <Sparkles
              className="h-4 w-4 text-purple-500"
              aria-label="Skategoryzowane przez AI"
            />
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{transaction.categoryName}</Badge>
      </TableCell>
      <TableCell>
        <Badge
          variant={transaction.type === 'income' ? 'default' : 'secondary'}
        >
          {transaction.type === 'income' ? 'Przychód' : 'Wydatek'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <span
          className={`font-semibold ${
            transaction.type === 'income'
              ? 'text-green-600 dark:text-green-500'
              : 'text-red-600 dark:text-red-500'
          }`}
        >
          {transaction.type === 'income' ? '+' : '-'}
          {transaction.amount}
        </span>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              aria-label="Otwórz menu akcji"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Akcje</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onEdit(transaction)}
              className="cursor-pointer"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edytuj
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(transaction.id)}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Usuń
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}


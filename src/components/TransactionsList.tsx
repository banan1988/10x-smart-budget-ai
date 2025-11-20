import { MoreVertical, Pencil, Trash2, Sparkles } from 'lucide-react';
import type { TransactionVM } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
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

interface TransactionsListProps {
  transactions: TransactionVM[];
  onEdit: (transaction: TransactionVM) => void;
  onDelete: (transactionId: number) => void;
}

/**
 * Mobile card list view for transactions
 */
export function TransactionsList({
  transactions,
  onEdit,
  onDelete,
}: TransactionsListProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Brak transakcji do wyświetlenia
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <TransactionsCardItem
          key={transaction.id}
          transaction={transaction}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

interface TransactionsCardItemProps {
  transaction: TransactionVM;
  onEdit: (transaction: TransactionVM) => void;
  onDelete: (transactionId: number) => void;
}

/**
 * Single card item in the transactions list
 */
function TransactionsCardItem({
  transaction,
  onEdit,
  onDelete,
}: TransactionsCardItemProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{transaction.description}</h3>
              {transaction.isAiCategorized && (
                <Sparkles
                  className="h-4 w-4 text-purple-500 flex-shrink-0"
                  aria-label="Skategoryzowane przez AI"
                />
              )}
            </div>
            <CardDescription className="text-sm">
              {transaction.date}
            </CardDescription>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 flex-shrink-0"
                aria-label="Otwórz menu akcji"
              >
                <MoreVertical className="h-4 w-4" />
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
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{transaction.categoryName}</Badge>
            <Badge
              variant={transaction.type === 'income' ? 'default' : 'secondary'}
            >
              {transaction.type === 'income' ? 'Przychód' : 'Wydatek'}
            </Badge>
          </div>

          <div
            className={`font-bold text-lg ${
              transaction.type === 'income'
                ? 'text-green-600 dark:text-green-500'
                : 'text-red-600 dark:text-red-500'
            }`}
          >
            {transaction.type === 'income' ? '+' : '-'}
            {transaction.amount}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


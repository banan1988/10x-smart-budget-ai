import { useState } from 'react';
import { toast } from 'sonner';
import { useTransactions } from './hooks/useTransactions';
import { useMediaQuery } from './hooks/useMediaQuery';
import { TransactionsFilters } from './TransactionsFilters';
import { TransactionsTable } from './TransactionsTable';
import { TransactionsList } from './TransactionsList';
import { AddTransactionDialog } from './AddTransactionDialog';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import type { TransactionVM } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';

/**
 * Main component for the Transactions view
 * Manages the state and coordinates all child components
 */
export function TransactionsView() {
  const {
    transactions,
    pagination,
    filters,
    isLoading,
    error,
    setFilters,
    setPage,
    refetch,
  } = useTransactions();

  // Detect if we're on desktop (768px = md breakpoint)
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionVM | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (transaction: TransactionVM) => {
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedTransaction(null);
    setIsDialogOpen(true);
  };

  const handleDelete = (transactionId: number) => {
    setTransactionToDelete(transactionId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/transactions/${transactionToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete transaction');
      }

      // Refetch transactions after successful deletion
      refetch();
      toast.success('Transakcja została usunięta');
    } catch (err) {
      console.error('Error deleting transaction:', err);
      toast.error('Nie udało się usunąć transakcji');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setTransactionToDelete(null);
    }
  };

  const handleTransactionSuccess = () => {
    refetch();
    toast.success(
      selectedTransaction ? 'Transakcja została zaktualizowana' : 'Transakcja została dodana'
    );
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Wystąpił błąd podczas pobierania transakcji: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'SmartBudgetAI', href: '/dashboard' },
          { label: 'Transakcje' },
        ]}
        showSidebarToggle={true}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transakcje</h1>
          <p className="text-muted-foreground">
            Zarządzaj swoimi przychodami i wydatkami
          </p>
        </div>
        <Button onClick={handleAdd}>
          Dodaj transakcję
        </Button>
      </div>

      {/* Filters */}
      <TransactionsFilters filters={filters} onFiltersChange={setFilters} />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Ładowanie transakcji...</p>
          </div>
        </div>
      ) : transactions.length === 0 ? (
        <Alert>
          <AlertDescription>
            Brak transakcji dla wybranych filtrów.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Responsive view: Table for desktop, List for mobile */}
          {isDesktop ? (
            <TransactionsTable
              transactions={transactions}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ) : (
            <TransactionsList
              transactions={transactions}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Strona {pagination.page} z {pagination.totalPages} ({pagination.total} transakcji)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Poprzednia
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Następna
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta operacja jest nieodwracalna. Transakcja zostanie trwale usunięta z bazy danych.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Usuwanie...' : 'Usuń'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add/Edit transaction dialog */}
      <AddTransactionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        transaction={selectedTransaction}
        onSuccess={handleTransactionSuccess}
      />

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}


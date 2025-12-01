import { useState, useCallback } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedbackDialog } from './FeedbackDialog';
import { FeedbackForm } from './FeedbackForm';
import type { FeedbackButtonVM } from '@/types';

interface FeedbackButtonProps {
  isAuthenticated: boolean;
  userId?: string;
}

/**
 * Floating button component that triggers the feedback dialog.
 * Visible to both authenticated and unauthenticated users.
 * For unauthenticated users, shows a prompt to login.
 * Positioned at the bottom-right corner of the screen.
 */
export function FeedbackButton({ isAuthenticated }: FeedbackButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Handle dialog close from form submission
  const handleFormSubmitSuccess = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  // Handle dialog cancel
  const handleFormCancel = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  // Handle button click
  const handleButtonClick = useCallback(() => {
    if (isAuthenticated) {
      setIsDialogOpen(true);
    } else {
      // TEMPORARY SOLUTION: Show prompt for unauthenticated users
      // TODO: Replace with proper login redirect or modal after auth flow is finalized
      setShowLoginPrompt(true);
      setTimeout(() => setShowLoginPrompt(false), 3000); // Auto-hide after 3 seconds
    }
  }, [isAuthenticated]);

  return (
    <>
      {/* Floating button - visible to all users */}
      <Button
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        onClick={handleButtonClick}
        aria-label="Prześlij opinię"
        title={isAuthenticated ? 'Prześlij opinię' : 'Zaloguj się, aby przesłać opinię'}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      {/* Login prompt for unauthenticated users - TEMPORARY SOLUTION */}
      {showLoginPrompt && !isAuthenticated && (
        <div className="fixed bottom-24 right-6 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 shadow-lg max-w-xs animate-in fade-in slide-in-from-bottom-2">
          <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
            Aby przesłać opinię, musisz się <a href="/login" className="underline hover:no-underline font-semibold">zalogować</a>.
          </p>
        </div>
      )}

      {/* Feedback dialog - only for authenticated users */}
      {isAuthenticated && (
        <FeedbackDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <FeedbackForm onSubmitSuccess={handleFormSubmitSuccess} onCancel={handleFormCancel} />
        </FeedbackDialog>
      )}
    </>
  );
}


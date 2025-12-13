import { useState, useCallback } from "react";
import type { FeedbackFormData } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FeedbackFormProps {
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

interface FormError {
  field: string;
  message: string;
}

const MAX_COMMENT_LENGTH = 1000;
const RATING_OPTIONS = [1, 2, 3, 4, 5];

/**
 * Form component for collecting user feedback.
 * Handles rating selection, comment input, validation, and submission.
 */
export function FeedbackForm({ onSubmitSuccess, onCancel }: FeedbackFormProps) {
  const [formData, setFormData] = useState<FeedbackFormData>({
    rating: null,
    comment: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle rating change
  const handleRatingChange = useCallback((value: string) => {
    const rating = parseInt(value, 10);
    setFormData((prev) => ({ ...prev, rating }));
    // Clear errors for rating field when user changes it
    setErrors((prev) => prev.filter((e) => e.field !== "rating"));
  }, []);

  // Handle comment change
  const handleCommentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const comment = e.target.value;
    if (comment.length <= MAX_COMMENT_LENGTH) {
      setFormData((prev) => ({ ...prev, comment }));
      // Clear errors for comment field when user changes it
      setErrors((prev) => prev.filter((e) => e.field !== "comment"));
    }
  }, []);

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: FormError[] = [];

    if (formData.rating === null) {
      newErrors.push({
        field: "rating",
        message: "Ocena jest wymagana",
      });
    }

    if (formData.comment.trim().length > 0 && formData.comment.length > MAX_COMMENT_LENGTH) {
      newErrors.push({
        field: "comment",
        message: `Komentarz nie może przekraczać ${MAX_COMMENT_LENGTH} znaków`,
      });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Clear previous messages
      setSuccessMessage(null);

      // Validate form
      if (!validateForm()) {
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch("/api/feedbacks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rating: formData.rating,
            comment: formData.comment.trim(),
          }),
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.message || "Nie udało się przesłać opinii. Spróbuj ponownie.";

          setErrors([
            {
              field: "form",
              message: errorMessage,
            },
          ]);

          setIsLoading(false);
          return;
        }

        // Success
        const data = await response.json();
        setSuccessMessage(data.message);

        // Reset form
        setFormData({ rating: null, comment: "" });
        setErrors([]);

        // Call success callback after a short delay
        setTimeout(() => {
          onSubmitSuccess?.();
        }, 1500);
      } catch (error) {
        console.error("Error submitting feedback:", error);
        setErrors([
          {
            field: "form",
            message: "Nie udało się przesłać opinii. Spróbuj ponownie.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [formData, onSubmitSuccess]
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    setFormData({ rating: null, comment: "" });
    setErrors([]);
    setSuccessMessage(null);
    onCancel?.();
  }, [onCancel]);

  // Get error for a specific field
  const getFieldError = (field: string): string | undefined => {
    return errors.find((e) => e.field === field)?.message;
  };

  // Get form error (general error)
  const formError = errors.find((e) => e.field === "form");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <fieldset disabled={isLoading} className="space-y-6">
        {/* Rating field */}
        <div className="space-y-2">
          <Label htmlFor="rating-select" className="text-base font-medium">
            Ocena aplikacji (1-5)
          </Label>
          <Select value={formData.rating?.toString() || ""} onValueChange={handleRatingChange}>
            <SelectTrigger id="rating-select" aria-required="true">
              <SelectValue placeholder="Wybierz ocenę..." />
            </SelectTrigger>
            <SelectContent>
              {RATING_OPTIONS.map((rating) => (
                <SelectItem key={rating} value={rating.toString()}>
                  {rating === 1 && "⭐ Słaba (1)"}
                  {rating === 2 && "⭐⭐ Niska (2)"}
                  {rating === 3 && "⭐⭐⭐ Średnia (3)"}
                  {rating === 4 && "⭐⭐⭐⭐ Dobra (4)"}
                  {rating === 5 && "⭐⭐⭐⭐⭐ Doskonała (5)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {getFieldError("rating") && (
            <p className="text-sm text-red-600 dark:text-red-400">{getFieldError("rating")}</p>
          )}
        </div>

        {/* Comment field */}
        <div className="space-y-2">
          <Label htmlFor="comment-textarea" className="text-base font-medium">
            Dodatkowe komentarze (opcjonalnie)
          </Label>
          <textarea
            id="comment-textarea"
            value={formData.comment}
            onChange={handleCommentChange}
            placeholder="Powiedz nam, co moglibyśmy poprawić..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            rows={4}
            maxLength={MAX_COMMENT_LENGTH}
            aria-label="Komentarz do opinii"
          />
          <div className="flex justify-between">
            <span className="text-xs text-muted-foreground">Maksymalnie {MAX_COMMENT_LENGTH} znaków</span>
            <span className="text-xs text-muted-foreground">
              {formData.comment.length} / {MAX_COMMENT_LENGTH}
            </span>
          </div>
          {getFieldError("comment") && (
            <p className="text-sm text-red-600 dark:text-red-400">{getFieldError("comment")}</p>
          )}
        </div>

        {/* Error Alert */}
        {formError && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{formError.message}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {successMessage && (
          <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
            <AlertDescription className="text-green-800 dark:text-green-200">{successMessage}</AlertDescription>
          </Alert>
        )}
      </fieldset>

      {/* Form Actions */}
      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? "Wysyłanie..." : "Prześlij"}
        </Button>
        <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
          Anuluj
        </Button>
      </div>
    </form>
  );
}

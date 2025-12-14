import { useState, useEffect } from "react";
import type { CategoryDto, TransactionVM } from "@/types";
import { UNCATEGORIZED_CATEGORY_NAME } from "@/types";
import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: TransactionVM | null;
  onSuccess: () => void;
}

interface FormData {
  type: "income" | "expense";
  amount: string;
  description: string;
  date: string;
  categoryId?: number | null;
}

interface FormErrors {
  amount?: string;
  description?: string;
  date?: string;
}

/**
 * Dialog for adding or editing a transaction
 */
export function AddTransactionDialog({ open, onOpenChange, transaction, onSuccess }: AddTransactionDialogProps) {
  const isEditing = !!transaction;

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    type: "expense",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    if (open) {
      fetchCategories();
    }
  }, [open]);

  // Populate form when editing
  useEffect(() => {
    if (transaction && open) {
      // Convert formatted amount back to number (remove currency and parse)
      const amountStr = transaction.amount.replace(/[^\d,.-]/g, "").replace(",", ".");
      const amountInCents = Math.round(parseFloat(amountStr) * 100);

      setFormData({
        type: transaction.type,
        amount: (amountInCents / 100).toFixed(2),
        description: transaction.description,
        date: transaction.rawDate, // Use the raw date from the transaction
        categoryId: categories.find((c) => c.key === transaction.categoryKey)?.id,
      });
    } else if (!transaction && open) {
      // Reset form for new transaction
      setFormData({
        type: "expense",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      setErrors({});
      setSubmitError(null);
    }
  }, [transaction, open, categories]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // Amount validation
    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = "Kwota musi być liczbą dodatnią";
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = "Opis jest wymagany";
    } else if (formData.description.length > 255) {
      newErrors.description = "Opis nie może przekraczać 255 znaków";
    }

    // Date validation
    if (!formData.date) {
      newErrors.date = "Data jest wymagana";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Convert amount to cents
      const amountInCents = Math.round(parseFloat(formData.amount) * 100);

      const payload = {
        type: formData.type,
        amount: amountInCents,
        description: formData.description.trim(),
        date: formData.date,
        ...(formData.categoryId && { categoryId: formData.categoryId }),
      };

      const url = isEditing ? `/api/transactions/${transaction.id}` : "/api/transactions";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Nie udało się zapisać transakcji");
      }

      // Success - close dialog and notify parent
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Wystąpił nieznany błąd");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edytuj transakcję" : "Dodaj transakcję"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Wprowadź zmiany w transakcji." : "Wypełnij formularz, aby dodać nową transakcję."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Typ transakcji</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as "income" | "expense" })}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Wydatek</SelectItem>
                <SelectItem value="income">Przychód</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Kwota (PLN) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              aria-invalid={!!errors.amount}
              aria-describedby={errors.amount ? "amount-error" : undefined}
            />
            {errors.amount && (
              <p id="amount-error" className="text-sm text-destructive">
                {errors.amount}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Opis <span className="text-destructive">*</span>
            </Label>
            <Input
              id="description"
              type="text"
              placeholder="Np. Zakupy spożywcze"
              maxLength={255}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? "description-error" : undefined}
            />
            {errors.description && (
              <p id="description-error" className="text-sm text-destructive">
                {errors.description}
              </p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">
              Data <span className="text-destructive">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              aria-invalid={!!errors.date}
              aria-describedby={errors.date ? "date-error" : undefined}
            />
            {errors.date && (
              <p id="date-error" className="text-sm text-destructive">
                {errors.date}
              </p>
            )}
          </div>

          {/* Category (optional) */}
          <div className="space-y-2">
            <Label htmlFor="category">Kategoria (opcjonalna)</Label>
            <Select
              value={formData.categoryId?.toString() || "none"}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  categoryId: value === "none" ? null : parseInt(value),
                })
              }
              disabled={isLoadingCategories}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Wybierz kategorię" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {UNCATEGORIZED_CATEGORY_NAME}{" "}
                  <Sparkles className="h-4 w-4 text-purple-500 ml-2 inline" aria-label="Do kategoryzacji przez AI" />
                </SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Zapisywanie..." : isEditing ? "Zapisz zmiany" : "Dodaj transakcję"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

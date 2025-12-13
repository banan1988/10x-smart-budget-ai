import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import type { EditProfileFormData, UpdateProfileResponse, ValidationError } from "../types";

interface EditProfileSectionProps {
  initialNickname: string | null;
  onProfileUpdated?: (updatedNickname: string) => void;
}

/**
 * Component for editing user profile data (nickname).
 * Includes form fields, action buttons, validation, and error handling.
 */
export function EditProfileSection({ initialNickname, onProfileUpdated }: EditProfileSectionProps) {
  const [formData, setFormData] = useState<EditProfileFormData>({
    nickname: initialNickname || "",
  });
  const [originalNickname] = useState<string>(initialNickname || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ValidationError | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Check if form data has changed
  useEffect(() => {
    setIsDirty(formData.nickname !== originalNickname);
  }, [formData.nickname, originalNickname]);

  // Validate nickname client-side
  const validateNickname = (value: string): ValidationError | null => {
    if (!value || value.trim().length === 0) {
      return {
        field: "nickname",
        message: "Nickname jest wymagany",
      };
    }

    if (value.length > 50) {
      return {
        field: "nickname",
        message: "Nickname jest zbyt długi. Maksimum 50 znaków.",
      };
    }

    const validPattern = /^[a-zA-Z0-9\s\-_]+$/;
    if (!validPattern.test(value)) {
      return {
        field: "nickname",
        message: "Nickname może zawierać tylko litery, cyfry, spacje, myślniki i podkreślenia",
      };
    }

    return null;
  };

  // Handle input change
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ nickname: value });

    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate before submission
    const validationError = validateNickname(formData.nickname);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nickname: formData.nickname.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 400 && errorData.errors) {
          // Validation error from server
          setError(errorData.errors[0]);
          toast.error(errorData.errors[0].message);
        } else if (response.status === 401) {
          toast.error("Sesja wygasła. Zaloguj się ponownie.");
          // Redirect to login
          window.location.href = "/login";
        } else {
          toast.error(errorData.message || "Nie udało się zaktualizować profilu");
        }
        return;
      }

      const result: UpdateProfileResponse = await response.json();

      if (result.success) {
        toast.success("Profil został zaktualizowany");
        setIsDirty(false);

        if (onProfileUpdated && result.data?.nickname) {
          onProfileUpdated(result.data.nickname);
        }
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error("Błąd połączenia. Sprawdź swoją sieć internetową i spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setFormData({ nickname: originalNickname });
    setError(null);
    setIsDirty(false);
  };

  return (
    <section className="rounded-lg border bg-card p-6" aria-labelledby="edit-profile-heading">
      <div className="mb-6">
        <h2 id="edit-profile-heading" className="text-2xl font-semibold">
          Edytuj profil
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">Zaktualizuj swoje dane osobowe</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="nickname">Nickname</Label>
          <Input
            id="nickname"
            type="text"
            value={formData.nickname}
            onChange={handleNicknameChange}
            placeholder="Wprowadź swój nickname"
            disabled={isLoading}
            aria-invalid={error !== null}
            aria-describedby={error ? "nickname-error" : undefined}
            className={error ? "border-destructive" : ""}
          />
          {error && (
            <p id="nickname-error" className="text-sm text-destructive" role="alert">
              {error.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Maksimum 50 znaków. Dozwolone: litery, cyfry, spacje, myślniki i podkreślenia.
          </p>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={!isDirty || isLoading} aria-busy={isLoading}>
            {isLoading ? "Zapisywanie..." : "Zapisz zmiany"}
          </Button>
          <Button type="button" variant="outline" onClick={handleCancel} disabled={!isDirty || isLoading}>
            Anuluj
          </Button>
        </div>
      </form>
    </section>
  );
}

import type { ProfileCardData } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

/**
 * ProfileCard component - displays user profile information in a card.
 * Shows email, nickname, and registration date.
 */
export default function ProfileCard({ email, nickname, registeredAt }: ProfileCardData) {
  // Format the registration date to be more user-friendly
  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informacje o profilu</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-1">
          <dt className="text-sm font-medium text-muted-foreground">Email</dt>
          <dd className="text-base">{email}</dd>
        </div>

        <div className="grid gap-1">
          <dt className="text-sm font-medium text-muted-foreground">Nazwa użytkownika</dt>
          <dd className="text-base">
            {nickname ? nickname : <span className="italic text-muted-foreground">Nie ustawiono</span>}
          </dd>
        </div>

        <div className="grid gap-1">
          <dt className="text-sm font-medium text-muted-foreground">Data rejestracji</dt>
          <dd className="text-base">{formatDate(registeredAt)}</dd>
        </div>
      </CardContent>
    </Card>
  );
}

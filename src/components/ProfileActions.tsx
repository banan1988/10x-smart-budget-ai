import { Button } from "./ui/button";

/**
 * ProfileActions component - provides action buttons for the profile page.
 * Currently includes a link to edit settings.
 */
export default function ProfileActions() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Button asChild>
          <a href="/profile/settings">Edytuj ustawienia</a>
        </Button>
      </div>
    </div>
  );
}

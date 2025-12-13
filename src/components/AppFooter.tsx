/**
 * Application footer component for authenticated pages
 */
export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© {currentYear} SmartBudgetAI. Wszelkie prawa zastrzeżone.</p>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Polityka prywatności
            </a>
            <a href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Regulamin
            </a>
            <a href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Kontakt
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

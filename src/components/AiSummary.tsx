import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface AiSummaryProps {
  summary?: string;
}

/**
 * Component displaying AI-generated financial summary
 * Optimized for both light and dark modes
 */
export function AiSummary({ summary }: AiSummaryProps) {
  if (!summary) {
    return null;
  }

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <span>Podsumowanie AI</span>
        </CardTitle>
        <CardDescription>Analiza Twoich finansów wygenerowana przez sztuczną inteligencję</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-foreground/90">{summary}</p>
      </CardContent>
    </Card>
  );
}

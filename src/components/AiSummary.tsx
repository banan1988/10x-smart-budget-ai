import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AiSummaryProps {
  summary?: string;
}

/**
 * Component displaying AI-generated financial summary
 */
export function AiSummary({ summary }: AiSummaryProps) {
  if (!summary) {
    return null;
  }

  return (
    <Card className="shadow-md bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <span>Podsumowanie AI</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-foreground">{summary}</p>
      </CardContent>
    </Card>
  );
}


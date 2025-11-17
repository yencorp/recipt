import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, ArrowRight, Check } from 'lucide-react';
import { OCRResult } from '@/store/api/ocrApi';
import { SettlementItemFormData } from '@/schemas/settlementSchema';

interface MappingSuggestion {
  ocrResult: OCRResult;
  suggestedItem: SettlementItemFormData | null;
  confidence: number;
  reason: string;
}

interface MappingSuggestionsProps {
  suggestions: MappingSuggestion[];
  onAccept: (ocrResultId: string, itemIndex: number) => void;
  onReject: (ocrResultId: string) => void;
}

export const MappingSuggestions: React.FC<MappingSuggestionsProps> = ({
  suggestions,
  onAccept,
  onReject,
}) => {
  if (suggestions.length === 0) {
    return null;
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge variant="default">높음</Badge>;
    } else if (confidence >= 0.5) {
      return <Badge variant="secondary">중간</Badge>;
    } else {
      return <Badge variant="destructive">낮음</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          <CardTitle>자동 매핑 제안</CardTitle>
          <Badge>{suggestions.length}개</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.ocrResult.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  {getConfidenceBadge(suggestion.confidence)}
                  <span className="text-sm font-medium">
                    {suggestion.ocrResult.merchantName || '알 수 없는 상호'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {suggestion.ocrResult.totalAmount?.toLocaleString()}원
                  </span>
                </div>

                {suggestion.suggestedItem && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">제안:</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">
                      {suggestion.suggestedItem.category}
                    </span>
                    <span className="text-muted-foreground">-</span>
                    <span>{suggestion.suggestedItem.description}</span>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  이유: {suggestion.reason}
                </p>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReject(suggestion.ocrResult.id)}
                >
                  거부
                </Button>
                {suggestion.suggestedItem && (
                  <Button
                    size="sm"
                    onClick={() => onAccept(suggestion.ocrResult.id, index)}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    수락
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

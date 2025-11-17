import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  GripVertical,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { OCRResult } from '@/store/api/ocrApi';
import type { SettlementItemFormData } from '@/schemas/settlementSchema';
import { MappingSuggestions } from './MappingSuggestions';
import { cn } from '@/lib/utils';

interface ReceiptMappingItem extends OCRResult {
  mappedToItemIndex?: number;
  isDuplicate?: boolean;
}

interface ReceiptMappingProps {
  ocrResults: OCRResult[];
  settlementItems: SettlementItemFormData[];
  onMapReceipt: (receiptId: string, itemIndex: number) => void;
  onUnmapReceipt: (receiptId: string) => void;
}

export const ReceiptMapping: React.FC<ReceiptMappingProps> = ({
  ocrResults,
  settlementItems,
  onMapReceipt,
  onUnmapReceipt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [draggedReceipt, setDraggedReceipt] = useState<string | null>(null);

  // 카테고리 목록 추출
  const categories = useMemo(() => {
    const uniqueCategories = new Set(settlementItems.map((item) => item.category));
    return Array.from(uniqueCategories);
  }, [settlementItems]);

  // 영수증별 매핑 상태 관리
  const [mappedReceipts, setMappedReceipts] = useState<Map<string, number>>(
    new Map()
  );

  // 중복 체크
  const getDuplicateReceipts = (): Set<string> => {
    const duplicates = new Set<string>();
    const amountMap = new Map<number, string[]>();

    ocrResults.forEach((result) => {
      if (result.totalAmount) {
        const existing = amountMap.get(result.totalAmount) || [];
        existing.push(result.id);
        amountMap.set(result.totalAmount, existing);
      }
    });

    amountMap.forEach((ids) => {
      if (ids.length > 1) {
        ids.forEach((id) => duplicates.add(id));
      }
    });

    return duplicates;
  };

  const duplicates = getDuplicateReceipts();

  // 자동 매핑 제안 생성
  const generateSuggestions = () => {
    return ocrResults
      .filter((result) => !mappedReceipts.has(result.id))
      .map((result) => {
        // 카테고리 키워드 기반 매칭
        const merchantName = result.merchantName?.toLowerCase() || '';
        let bestMatch: { item: SettlementItemFormData; index: number; score: number } | null = null;

        settlementItems.forEach((item, index) => {
          const category = item.category.toLowerCase();
          const description = item.description.toLowerCase();

          let score = 0;
          if (merchantName.includes(category) || category.includes(merchantName)) {
            score += 0.5;
          }
          if (merchantName.includes(description) || description.includes(merchantName)) {
            score += 0.3;
          }
          if (result.totalAmount && Math.abs(result.totalAmount - item.actualAmount) < 1000) {
            score += 0.2;
          }

          if (!bestMatch || score > bestMatch.score) {
            bestMatch = { item, index, score };
          }
        });

        return {
          ocrResult: result,
          suggestedItem: bestMatch && bestMatch.score > 0.3 ? bestMatch.item : null,
          confidence: bestMatch?.score || 0,
          reason:
            bestMatch && bestMatch.score > 0.3
              ? `카테고리 및 금액 유사도: ${Math.round(bestMatch.score * 100)}%`
              : '매칭 가능한 항목을 찾을 수 없습니다',
        };
      });
  };

  const suggestions = generateSuggestions();

  // 필터링된 영수증
  const filteredReceipts = useMemo(() => {
    return ocrResults.filter((result) => {
      const matchesSearch =
        !searchQuery ||
        result.merchantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.id.toLowerCase().includes(searchQuery.toLowerCase());

      const mappedItemIndex = mappedReceipts.get(result.id);
      const matchesCategory =
        filterCategory === 'all' ||
        (mappedItemIndex !== undefined &&
          settlementItems[mappedItemIndex]?.category === filterCategory);

      return matchesSearch && matchesCategory;
    });
  }, [ocrResults, searchQuery, filterCategory, mappedReceipts, settlementItems]);

  // 드래그앤드롭 핸들러
  const handleDragStart = (receiptId: string) => {
    setDraggedReceipt(receiptId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (itemIndex: number) => {
    if (draggedReceipt) {
      const newMappedReceipts = new Map(mappedReceipts);
      newMappedReceipts.set(draggedReceipt, itemIndex);
      setMappedReceipts(newMappedReceipts);
      onMapReceipt(draggedReceipt, itemIndex);
      setDraggedReceipt(null);
    }
  };

  const handleUnmap = (receiptId: string) => {
    const newMappedReceipts = new Map(mappedReceipts);
    newMappedReceipts.delete(receiptId);
    setMappedReceipts(newMappedReceipts);
    onUnmapReceipt(receiptId);
  };

  const handleAcceptSuggestion = (ocrResultId: string, itemIndex: number) => {
    const newMappedReceipts = new Map(mappedReceipts);
    newMappedReceipts.set(ocrResultId, itemIndex);
    setMappedReceipts(newMappedReceipts);
    onMapReceipt(ocrResultId, itemIndex);
  };

  const handleRejectSuggestion = (ocrResultId: string) => {
    console.log('Suggestion rejected:', ocrResultId);
  };

  const mappedCount = mappedReceipts.size;
  const totalCount = ocrResults.length;

  return (
    <div className="space-y-4">
      {/* 통계 및 필터 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>영수증-결산 항목 매핑</CardTitle>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-muted-foreground">매핑 완료:</span>
                <span className="ml-2 font-semibold">
                  {mappedCount} / {totalCount}
                </span>
              </div>
              {duplicates.size > 0 && (
                <Badge variant="destructive">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  중복 {duplicates.size}개
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="상호명 또는 영수증 ID로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 카테고리</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 자동 매핑 제안 */}
      <MappingSuggestions
        suggestions={suggestions.filter((s) => s.confidence > 0.3)}
        onAccept={handleAcceptSuggestion}
        onReject={handleRejectSuggestion}
      />

      {/* 매핑 영역 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 왼쪽: 영수증 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">영수증 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredReceipts.map((receipt) => {
                const isMapped = mappedReceipts.has(receipt.id);
                const isDuplicate = duplicates.has(receipt.id);

                return (
                  <div
                    key={receipt.id}
                    draggable={!isMapped}
                    onDragStart={() => handleDragStart(receipt.id)}
                    className={cn(
                      'flex items-center gap-2 p-3 border rounded cursor-move transition-all',
                      isMapped && 'opacity-50 cursor-not-allowed',
                      isDuplicate && 'border-yellow-500 bg-yellow-50',
                      draggedReceipt === receipt.id && 'opacity-50 scale-95'
                    )}
                  >
                    {!isMapped && <GripVertical className="w-4 h-4 text-muted-foreground" />}
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {receipt.merchantName || '알 수 없는 상호'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {receipt.totalAmount?.toLocaleString()}원
                        {receipt.transactionDate && ` · ${receipt.transactionDate}`}
                      </p>
                    </div>
                    {isMapped && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUnmap(receipt.id)}
                        >
                          해제
                        </Button>
                      </div>
                    )}
                    {isDuplicate && (
                      <Badge variant="destructive" className="text-xs">
                        중복
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 오른쪽: 결산 항목 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">결산 항목</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {settlementItems.map((item, index) => {
                const mappedReceiptIds = Array.from(mappedReceipts.entries())
                  .filter(([, itemIndex]) => itemIndex === index)
                  .map(([receiptId]) => receiptId);

                return (
                  <div
                    key={index}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(index)}
                    className={cn(
                      'p-3 border-2 border-dashed rounded transition-all',
                      draggedReceipt
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25'
                    )}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{item.category}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {item.actualAmount.toLocaleString()}원
                        </Badge>
                      </div>

                      {mappedReceiptIds.length > 0 && (
                        <div className="space-y-1 pt-2 border-t">
                          {mappedReceiptIds.map((receiptId) => {
                            const receipt = ocrResults.find((r) => r.id === receiptId);
                            return (
                              <div
                                key={receiptId}
                                className="flex items-center gap-2 text-xs p-2 bg-muted rounded"
                              >
                                <CheckCircle2 className="w-3 h-3 text-green-600" />
                                <span className="flex-1">
                                  {receipt?.merchantName || '알 수 없는 상호'}
                                </span>
                                <span className="text-muted-foreground">
                                  {receipt?.totalAmount?.toLocaleString()}원
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

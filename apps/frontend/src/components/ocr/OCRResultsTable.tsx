import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, RotateCcw, Trash2, Plus } from 'lucide-react';
import { EditableCell } from '@/components/common/EditableCell';
import {
  OCRResult,
  OCRLineItem,
  useUpdateOCRResultMutation,
} from '@/store/api/ocrApi';

interface OCRResultsTableProps {
  result: OCRResult;
  onSave?: () => void;
}

export const OCRResultsTable: React.FC<OCRResultsTableProps> = ({
  result,
  onSave,
}) => {
  const [merchantName, setMerchantName] = useState(result.merchantName || '');
  const [transactionDate, setTransactionDate] = useState(result.transactionDate || '');
  const [totalAmount, setTotalAmount] = useState(result.totalAmount || 0);
  const [items, setItems] = useState<OCRLineItem[]>(result.items || []);

  const [updateOCRResult, { isLoading }] = useUpdateOCRResultMutation();

  const handleSaveChanges = async () => {
    try {
      await updateOCRResult({
        id: result.id,
        data: {
          merchantName,
          transactionDate,
          totalAmount,
          items: items.map(({ id, ...rest }) => rest),
        },
      }).unwrap();
      alert('OCR 결과가 저장되었습니다.');
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('OCR 결과 저장 실패:', error);
      alert('OCR 결과 저장에 실패했습니다.');
    }
  };

  const handleReset = () => {
    if (confirm('변경 사항을 되돌리시겠습니까?')) {
      setMerchantName(result.merchantName || '');
      setTransactionDate(result.transactionDate || '');
      setTotalAmount(result.totalAmount || 0);
      setItems(result.items || []);
    }
  };

  const handleUpdateItem = (index: number, field: keyof OCRLineItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };
    setItems(newItems);
  };

  const handleAddItem = () => {
    const newItem: OCRLineItem = {
      id: `temp-${Date.now()}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      confidence: 1.0,
    };
    setItems([...items, newItem]);
  };

  const handleDeleteItem = (index: number) => {
    if (confirm('이 항목을 삭제하시겠습니까?')) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculatedTotal = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>OCR 인식 결과</CardTitle>
          <div className="flex items-center gap-2">
            {result.confidence !== undefined && (
              <Badge
                variant={
                  result.confidence >= 0.9
                    ? 'default'
                    : result.confidence >= 0.7
                      ? 'secondary'
                      : 'destructive'
                }
              >
                정확도: {Math.round(result.confidence * 100)}%
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isLoading}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              되돌리기
            </Button>
            <Button
              size="sm"
              onClick={handleSaveChanges}
              disabled={isLoading}
            >
              <Save className="w-4 h-4 mr-1" />
              {isLoading ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 영수증 기본 정보 */}
          <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                상호명
              </label>
              <EditableCell
                value={merchantName}
                onSave={(value) => setMerchantName(value as string)}
                placeholder="상호명 입력"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                거래일시
              </label>
              <EditableCell
                value={transactionDate}
                onSave={(value) => setTransactionDate(value as string)}
                type="date"
                placeholder="날짜 선택"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                총 금액
              </label>
              <EditableCell
                value={totalAmount}
                onSave={(value) => setTotalAmount(value as number)}
                type="number"
                placeholder="0"
                className="w-full"
              />
            </div>
          </div>

          {/* 항목 테이블 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">항목 상세</h3>
              <Button variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="w-4 h-4 mr-1" />
                항목 추가
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded">
                인식된 항목이 없습니다. 수동으로 추가해주세요.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>품명</TableHead>
                    <TableHead className="text-center">수량</TableHead>
                    <TableHead className="text-right">단가</TableHead>
                    <TableHead className="text-right">금액</TableHead>
                    <TableHead className="text-center w-20">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <EditableCell
                          value={item.description}
                          onSave={(value) =>
                            handleUpdateItem(index, 'description', value)
                          }
                          placeholder="품명 입력"
                          confidence={item.confidence}
                        />
                      </TableCell>
                      <TableCell>
                        <EditableCell
                          value={item.quantity || 1}
                          onSave={(value) =>
                            handleUpdateItem(index, 'quantity', value)
                          }
                          type="number"
                          placeholder="1"
                          className="text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <EditableCell
                          value={item.unitPrice || 0}
                          onSave={(value) =>
                            handleUpdateItem(index, 'unitPrice', value)
                          }
                          type="number"
                          placeholder="0"
                          className="text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <EditableCell
                          value={item.amount}
                          onSave={(value) =>
                            handleUpdateItem(index, 'amount', value)
                          }
                          type="number"
                          placeholder="0"
                          className="text-right"
                          confidence={item.confidence}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(index)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* 합계 및 검증 */}
          {items.length > 0 && (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">항목 합계</p>
                <p className="text-lg font-semibold">
                  {calculatedTotal.toLocaleString()}원
                </p>
              </div>

              {totalAmount !== calculatedTotal && (
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">금액 불일치</Badge>
                  <p className="text-sm text-muted-foreground">
                    차액: {Math.abs(totalAmount - calculatedTotal).toLocaleString()}원
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 원본 텍스트 */}
          {result.rawText && (
            <details className="border rounded p-4">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                원본 OCR 텍스트 보기
              </summary>
              <pre className="mt-2 text-xs whitespace-pre-wrap bg-muted p-2 rounded">
                {result.rawText}
              </pre>
            </details>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

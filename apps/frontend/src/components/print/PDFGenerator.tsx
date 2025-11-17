import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  FileText,
  Loader2,
  Printer,
  Eye,
} from 'lucide-react';
import {
  PDFType,
  useGeneratePDFMutation,
  useGetBudgetPrintDataQuery,
  useGetSettlementPrintDataQuery,
} from '@/store/api/printApi';
import { PrintPreview } from './PrintPreview';

interface PDFGeneratorProps {
  eventId: string;
  type: 'budget' | 'settlement';
  onClose?: () => void;
}

export const PDFGenerator: React.FC<PDFGeneratorProps> = ({
  eventId,
  type,
  onClose,
}) => {
  const [pdfType, setPdfType] = useState<PDFType>(
    type === 'budget' ? PDFType.BUDGET : PDFType.SETTLEMENT
  );
  const [includeReceipts, setIncludeReceipts] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const isBudget = type === 'budget';

  // 인쇄 데이터 조회
  const {
    data: budgetData,
    isLoading: budgetLoading,
    error: budgetError,
  } = useGetBudgetPrintDataQuery(eventId, { skip: !isBudget });

  const {
    data: settlementData,
    isLoading: settlementLoading,
    error: settlementError,
  } = useGetSettlementPrintDataQuery(eventId, { skip: isBudget });

  const [generatePDF, { isLoading: isGenerating }] = useGeneratePDFMutation();

  const printData = isBudget ? budgetData : settlementData;
  const isLoading = budgetLoading || settlementLoading;
  const error = budgetError || settlementError;

  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePDF = async () => {
    try {
      const result = await generatePDF({
        eventId,
        type: pdfType,
        includeReceipts,
      }).unwrap();

      // PDF 다운로드
      const link = document.createElement('a');
      link.href = result.url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert('PDF 파일이 다운로드되었습니다.');
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      alert('PDF 생성에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">데이터 로딩 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-destructive">
            <p className="font-medium">데이터를 불러올 수 없습니다.</p>
            <p className="text-sm mt-1">
              {isBudget
                ? '예산서 데이터가 존재하지 않습니다.'
                : '결산서 데이터가 존재하지 않습니다.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!printData) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* 컨트롤 패널 */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-base">인쇄 옵션</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* PDF 타입 선택 */}
            <div className="space-y-2">
              <Label>문서 형식</Label>
              <Select
                value={pdfType}
                onValueChange={(value) => setPdfType(value as PDFType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value={isBudget ? PDFType.BUDGET : PDFType.SETTLEMENT}
                  >
                    {isBudget ? '예산서 (요약)' : '결산서 (요약)'}
                  </SelectItem>
                  <SelectItem
                    value={
                      isBudget ? PDFType.BUDGET_DETAIL : PDFType.SETTLEMENT_DETAIL
                    }
                  >
                    {isBudget ? '예산서 (상세)' : '결산서 (상세)'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 영수증 포함 옵션 (결산서만) */}
            {!isBudget && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-receipts"
                  checked={includeReceipts}
                  onCheckedChange={(checked) =>
                    setIncludeReceipts(checked as boolean)
                  }
                />
                <Label htmlFor="include-receipts" className="cursor-pointer">
                  영수증 이미지 포함
                </Label>
              </div>
            )}

            {/* 미리보기 토글 */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-preview"
                checked={showPreview}
                onCheckedChange={(checked) => setShowPreview(checked as boolean)}
              />
              <Label htmlFor="show-preview" className="cursor-pointer">
                미리보기 표시
              </Label>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handlePrint}
                className="flex-1"
              >
                <Printer className="w-4 h-4 mr-2" />
                인쇄
              </Button>
              <Button
                onClick={handleGeneratePDF}
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    PDF 다운로드
                  </>
                )}
              </Button>
            </div>

            {onClose && (
              <Button variant="ghost" onClick={onClose} className="w-full">
                닫기
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 미리보기 */}
      {showPreview && (
        <Card>
          <CardHeader className="print:hidden">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              <CardTitle className="text-base">미리보기</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="print:p-0">
            <PrintPreview data={printData} type={type} />
          </CardContent>
        </Card>
      )}

      {!showPreview && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-2" />
              <p>미리보기가 숨겨져 있습니다.</p>
              <p className="text-sm mt-1">
                위의 체크박스를 선택하여 미리보기를 표시하세요.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

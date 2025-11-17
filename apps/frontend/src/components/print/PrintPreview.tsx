import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  BudgetPrintData,
  SettlementPrintData,
} from '@/store/api/printApi';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface PrintPreviewProps {
  data: BudgetPrintData | SettlementPrintData;
  type: 'budget' | 'settlement';
}

export const PrintPreview: React.FC<PrintPreviewProps> = ({ data, type }) => {
  const isBudget = type === 'budget';
  const budgetData = isBudget ? (data as BudgetPrintData) : null;
  const settlementData = !isBudget ? (data as SettlementPrintData) : null;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy년 MM월 dd일', { locale: ko });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-white p-8 print:p-0" id="print-preview">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {isBudget ? '예산서' : '결산서'}
        </h1>
        <p className="text-lg text-muted-foreground">{data.eventName}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {data.organizationName}
        </p>
      </div>

      {/* 기본 정보 */}
      <Card className="mb-6 print:shadow-none">
        <CardHeader>
          <CardTitle className="text-base">기본 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">행사명</p>
              <p className="font-medium">{data.eventName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">단체명</p>
              <p className="font-medium">{data.organizationName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">기간</p>
              <p className="font-medium">
                {formatDate(
                  isBudget
                    ? budgetData!.budgetPeriod.startDate
                    : settlementData!.settlementPeriod.startDate
                )}
                {' ~ '}
                {formatDate(
                  isBudget
                    ? budgetData!.budgetPeriod.endDate
                    : settlementData!.settlementPeriod.endDate
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">작성자</p>
              <p className="font-medium">{data.createdBy}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">작성일</p>
              <p className="font-medium">{formatDate(data.createdAt)}</p>
            </div>
            {settlementData?.approvedBy && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">승인자</p>
                  <p className="font-medium">{settlementData.approvedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">승인일</p>
                  <p className="font-medium">
                    {formatDate(settlementData.approvedAt!)}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 수입 항목 */}
      <Card className="mb-6 print:shadow-none">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            수입 항목
            <Badge variant="secondary">
              {data.incomeItems.length}개
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>카테고리</TableHead>
                <TableHead>설명</TableHead>
                {!isBudget && (
                  <>
                    <TableHead className="text-right">예산</TableHead>
                    <TableHead className="text-right">실제</TableHead>
                    <TableHead className="text-right">차액</TableHead>
                  </>
                )}
                {isBudget && <TableHead className="text-right">금액</TableHead>}
                {!isBudget && settlementData?.incomeItems.some(item => item.receiptCount) && (
                  <TableHead className="text-center">영수증</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.incomeItems.map((item, index) => {
                const settlementItem = settlementData ? (item as any) : null;
                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.category}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    {!isBudget && (
                      <>
                        <TableCell className="text-right">
                          {settlementItem.budgetAmount.toLocaleString()}원
                        </TableCell>
                        <TableCell className="text-right">
                          {settlementItem.actualAmount.toLocaleString()}원
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              settlementItem.difference >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }
                          >
                            {settlementItem.difference >= 0 ? '+' : ''}
                            {settlementItem.difference.toLocaleString()}원
                          </span>
                        </TableCell>
                      </>
                    )}
                    {isBudget && (
                      <TableCell className="text-right">
                        {item.amount.toLocaleString()}원
                      </TableCell>
                    )}
                    {!isBudget && settlementItem?.receiptCount && (
                      <TableCell className="text-center">
                        {settlementItem.receiptCount}개
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              <TableRow className="font-semibold bg-muted/50">
                <TableCell colSpan={isBudget ? 2 : 2}>합계</TableCell>
                {!isBudget && (
                  <>
                    <TableCell className="text-right">
                      {settlementData!.totalBudgetIncome.toLocaleString()}원
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {settlementData!.totalActualIncome.toLocaleString()}원
                    </TableCell>
                    <TableCell className="text-right">
                      {(
                        settlementData!.totalActualIncome -
                        settlementData!.totalBudgetIncome
                      ).toLocaleString()}원
                    </TableCell>
                  </>
                )}
                {isBudget && (
                  <TableCell className="text-right text-green-600">
                    {budgetData!.totalIncome.toLocaleString()}원
                  </TableCell>
                )}
                {!isBudget && settlementData?.incomeItems.some(item => item.receiptCount) && (
                  <TableCell></TableCell>
                )}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 지출 항목 */}
      <Card className="mb-6 print:shadow-none">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            지출 항목
            <Badge variant="secondary">
              {data.expenseItems.length}개
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>카테고리</TableHead>
                <TableHead>설명</TableHead>
                {!isBudget && (
                  <>
                    <TableHead className="text-right">예산</TableHead>
                    <TableHead className="text-right">실제</TableHead>
                    <TableHead className="text-right">차액</TableHead>
                  </>
                )}
                {isBudget && <TableHead className="text-right">금액</TableHead>}
                {!isBudget && settlementData?.expenseItems.some(item => item.receiptCount) && (
                  <TableHead className="text-center">영수증</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.expenseItems.map((item, index) => {
                const settlementItem = settlementData ? (item as any) : null;
                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.category}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    {!isBudget && (
                      <>
                        <TableCell className="text-right">
                          {settlementItem.budgetAmount.toLocaleString()}원
                        </TableCell>
                        <TableCell className="text-right">
                          {settlementItem.actualAmount.toLocaleString()}원
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              settlementItem.difference <= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }
                          >
                            {settlementItem.difference >= 0 ? '+' : ''}
                            {settlementItem.difference.toLocaleString()}원
                          </span>
                        </TableCell>
                      </>
                    )}
                    {isBudget && (
                      <TableCell className="text-right">
                        {item.amount.toLocaleString()}원
                      </TableCell>
                    )}
                    {!isBudget && settlementItem?.receiptCount && (
                      <TableCell className="text-center">
                        {settlementItem.receiptCount}개
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              <TableRow className="font-semibold bg-muted/50">
                <TableCell colSpan={isBudget ? 2 : 2}>합계</TableCell>
                {!isBudget && (
                  <>
                    <TableCell className="text-right">
                      {settlementData!.totalBudgetExpense.toLocaleString()}원
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {settlementData!.totalActualExpense.toLocaleString()}원
                    </TableCell>
                    <TableCell className="text-right">
                      {(
                        settlementData!.totalActualExpense -
                        settlementData!.totalBudgetExpense
                      ).toLocaleString()}원
                    </TableCell>
                  </>
                )}
                {isBudget && (
                  <TableCell className="text-right text-red-600">
                    {budgetData!.totalExpense.toLocaleString()}원
                  </TableCell>
                )}
                {!isBudget && settlementData?.expenseItems.some(item => item.receiptCount) && (
                  <TableCell></TableCell>
                )}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 요약 */}
      <Card className="mb-6 print:shadow-none">
        <CardHeader>
          <CardTitle className="text-base">요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {!isBudget && (
              <>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">예산 수입</span>
                  <span className="font-medium">
                    {settlementData!.totalBudgetIncome.toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">실제 수입</span>
                  <span className="font-semibold text-green-600">
                    {settlementData!.totalActualIncome.toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">예산 지출</span>
                  <span className="font-medium">
                    {settlementData!.totalBudgetExpense.toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">실제 지출</span>
                  <span className="font-semibold text-red-600">
                    {settlementData!.totalActualExpense.toLocaleString()}원
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">예산 차액</span>
                  <span className="font-medium">
                    {settlementData!.budgetBalance.toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold">결산 차액</span>
                  <span
                    className={`font-bold ${
                      settlementData!.actualBalance >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {settlementData!.actualBalance.toLocaleString()}원
                  </span>
                </div>
              </>
            )}
            {isBudget && (
              <>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">총 수입</span>
                  <span className="font-semibold text-green-600">
                    {budgetData!.totalIncome.toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">총 지출</span>
                  <span className="font-semibold text-red-600">
                    {budgetData!.totalExpense.toLocaleString()}원
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold">차액</span>
                  <span
                    className={`font-bold ${
                      budgetData!.balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {budgetData!.balance.toLocaleString()}원
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 비고 */}
      {data.notes && (
        <Card className="print:shadow-none">
          <CardHeader>
            <CardTitle className="text-base">비고</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{data.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* 푸터 */}
      <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground print:mt-4">
        <p>
          본 {isBudget ? '예산서' : '결산서'}는 {data.organizationName}의 공식
          문서입니다.
        </p>
        <p className="mt-1">
          출력일: {formatDate(new Date().toISOString())}
        </p>
      </div>
    </div>
  );
};

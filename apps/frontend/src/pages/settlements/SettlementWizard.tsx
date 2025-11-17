import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { StepIndicator } from '@/components/budgets/StepIndicator';
import { SettlementIncomeList } from '@/components/settlements/SettlementIncomeList';
import { SettlementExpenseList } from '@/components/settlements/SettlementExpenseList';
import { ReceiptUploader } from '@/components/receipts/ReceiptUploader';
import { BudgetComparison } from '@/components/settlements/BudgetComparison';
import { SettlementItemFormData } from '@/schemas/settlementSchema';
import {
  useCreateSettlementMutation,
  useSaveSettlementDraftMutation,
} from '@/store/api/settlementsApi';
import { useGetBudgetQuery } from '@/store/api/budgetsApi';

interface Step {
  id: number;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  { id: 1, title: '수입 항목', description: '실제 수입 입력' },
  { id: 2, title: '지출 항목', description: '실제 지출 입력' },
  { id: 3, title: '영수증 업로드', description: '증빙자료 업로드' },
  { id: 4, title: '검토 및 제출', description: '결산서 확인' },
];

export const SettlementWizard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const budgetId = searchParams.get('budgetId');

  const [currentStep, setCurrentStep] = useState(1);
  const [incomeItems, setIncomeItems] = useState<SettlementItemFormData[]>([]);
  const [expenseItems, setExpenseItems] = useState<SettlementItemFormData[]>([]);
  const [notes, setNotes] = useState('');

  const { data: budget } = useGetBudgetQuery(budgetId || '', { skip: !budgetId });
  const [createSettlement, { isLoading: isCreating }] = useCreateSettlementMutation();
  const [saveDraft, { isLoading: isSaving }] = useSaveSettlementDraftMutation();

  // 예산서 데이터로 초기화
  useEffect(() => {
    if (budget && incomeItems.length === 0 && expenseItems.length === 0) {
      // 예산서의 수입 항목으로 초기화 (budgetAmount는 예산서 금액, actualAmount는 0으로)
      const initialIncomeItems: SettlementItemFormData[] = budget.incomeItems.map(item => ({
        category: item.category,
        description: item.description,
        budgetAmount: item.amount,
        actualAmount: 0,
        notes: item.notes || '',
      }));

      const initialExpenseItems: SettlementItemFormData[] = budget.expenseItems.map(item => ({
        category: item.category,
        description: item.description,
        budgetAmount: item.amount,
        actualAmount: 0,
        notes: item.notes || '',
      }));

      setIncomeItems(initialIncomeItems);
      setExpenseItems(initialExpenseItems);
    }
  }, [budget, incomeItems.length, expenseItems.length]);

  if (!eventId || !budgetId) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              잘못된 접근입니다. 행사와 예산서를 선택해주세요.
            </p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => navigate('/events')}>
                행사 목록으로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalActualIncome = incomeItems.reduce((sum, item) => sum + item.actualAmount, 0);
  const totalActualExpense = expenseItems.reduce((sum, item) => sum + item.actualAmount, 0);
  const balance = totalActualIncome - totalActualExpense;

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return incomeItems.length > 0 && incomeItems.every(item => item.actualAmount >= 0);
      case 2:
        return expenseItems.length > 0 && expenseItems.every(item => item.actualAmount >= 0);
      case 3:
        return true; // 영수증 업로드는 선택사항
      case 4:
        return balance >= 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length && canProceedToNextStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = async () => {
    try {
      await saveDraft({
        settlement: {
          eventId,
          budgetId,
          incomeItems,
          expenseItems,
          notes,
        },
      }).unwrap();
      alert('임시 저장되었습니다.');
    } catch (error) {
      console.error('임시 저장 실패:', error);
      alert('임시 저장에 실패했습니다.');
    }
  };

  const handleSubmit = async () => {
    if (balance < 0) {
      alert('총 수입이 총 지출보다 크거나 같아야 합니다.');
      return;
    }

    if (!confirm('결산서를 제출하시겠습니까?')) {
      return;
    }

    try {
      await createSettlement({
        eventId,
        budgetId,
        incomeItems,
        expenseItems,
        notes,
      }).unwrap();
      alert('결산서가 성공적으로 제출되었습니다.');
      navigate(`/events/${eventId}`);
    } catch (error) {
      console.error('결산서 제출 실패:', error);
      alert('결산서 제출에 실패했습니다.');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">수입 항목 입력</h2>
              <p className="text-sm text-muted-foreground">
                예산서를 기반으로 실제 수입 금액을 입력해주세요.
              </p>
            </div>
            <SettlementIncomeList items={incomeItems} onChange={setIncomeItems} />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">지출 항목 입력</h2>
              <p className="text-sm text-muted-foreground">
                예산서를 기반으로 실제 지출 금액을 입력해주세요.
              </p>
            </div>
            <SettlementExpenseList items={expenseItems} onChange={setExpenseItems} />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">영수증 업로드</h2>
              <p className="text-sm text-muted-foreground">
                결산 내역을 증명할 수 있는 영수증을 업로드해주세요. (선택사항)
              </p>
            </div>
            <ReceiptUploader
              settlementId="draft"
              onUploadComplete={() => {
                console.log('영수증 업로드 완료');
              }}
            />
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>비고</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="notes">추가 메모</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="결산서에 대한 추가 설명을 입력해주세요."
                  rows={5}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">결산서 검토</h2>
              <p className="text-sm text-muted-foreground">
                예산 대비 결산 내역을 확인하고 제출해주세요.
              </p>
            </div>

            <BudgetComparison
              incomeItems={incomeItems}
              expenseItems={expenseItems}
            />

            {notes && (
              <Card>
                <CardHeader>
                  <CardTitle>비고</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{notes}</p>
                </CardContent>
              </Card>
            )}

            {balance < 0 && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <p className="text-destructive font-medium">
                    ⚠️ 총 지출이 총 수입을 초과했습니다. 수입 또는 지출 항목을 다시 확인해주세요.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>결산서 작성</CardTitle>
              <CardDescription>
                예산서를 기반으로 실제 수입/지출을 입력하고 결산서를 제출합니다
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? '저장 중...' : '임시 저장'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-8">
            <StepIndicator steps={STEPS} currentStep={currentStep} />
          </div>

          {renderStepContent()}

          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              이전
            </Button>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => navigate(`/events/${eventId}`)}
              >
                취소
              </Button>

              {currentStep < STEPS.length ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceedToNextStep()}
                >
                  다음
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceedToNextStep() || isCreating}
                >
                  {isCreating ? '제출 중...' : '결산서 제출'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

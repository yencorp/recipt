import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StepIndicator, Step } from '@/components/budgets/StepIndicator';
import { IncomeList } from '@/components/budgets/IncomeList';
import { ExpenseList } from '@/components/budgets/ExpenseList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { BudgetItemFormData } from '@/schemas/budgetSchema';
import {
  useCreateBudgetMutation,
  useSaveBudgetDraftMutation,
  useGetBudgetByEventQuery,
} from '@/store/api/budgetsApi';
import { useGetEventQuery } from '@/store/api/eventsApi';
import { Skeleton } from '@/components/common/Loading';
import { AlertCircle } from 'lucide-react';

const STEPS: Step[] = [
  { id: 1, title: '수입 항목', description: '예상 수입 작성' },
  { id: 2, title: '지출 항목', description: '예상 지출 작성' },
  { id: 3, title: '검토 및 제출', description: '예산서 확인' },
];

export const BudgetWizard: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const { data: event, isLoading: isLoadingEvent } = useGetEventQuery(eventId!);
  const { data: existingBudget } = useGetBudgetByEventQuery(eventId!, {
    skip: !eventId,
  });
  const [createBudget, { isLoading: isCreating }] = useCreateBudgetMutation();
  const [saveDraft, { isLoading: isSaving }] = useSaveBudgetDraftMutation();

  const [currentStep, setCurrentStep] = useState(1);
  const [incomeItems, setIncomeItems] = useState<BudgetItemFormData[]>([]);
  const [expenseItems, setExpenseItems] = useState<BudgetItemFormData[]>([]);
  const [notes, setNotes] = useState('');

  // 기존 예산서 데이터 불러오기
  useEffect(() => {
    if (existingBudget) {
      setIncomeItems(existingBudget.incomeItems || []);
      setExpenseItems(existingBudget.expenseItems || []);
      setNotes(existingBudget.notes || '');
    }
  }, [existingBudget]);

  const totalIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = expenseItems.reduce((sum, item) => sum + item.amount, 0);
  const balance = totalIncome - totalExpense;

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = async () => {
    if (!eventId) return;

    try {
      await saveDraft({
        id: existingBudget?.id,
        budget: {
          eventId,
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
    if (!eventId) return;

    if (incomeItems.length === 0) {
      alert('최소 1개의 수입 항목이 필요합니다.');
      return;
    }

    if (expenseItems.length === 0) {
      alert('최소 1개의 지출 항목이 필요합니다.');
      return;
    }

    if (balance < 0) {
      alert('총 수입이 총 지출보다 크거나 같아야 합니다.');
      return;
    }

    try {
      await createBudget({
        eventId,
        incomeItems,
        expenseItems,
        notes,
      }).unwrap();
      alert('예산서가 성공적으로 작성되었습니다.');
      navigate('/events');
    } catch (error) {
      console.error('예산서 작성 실패:', error);
      alert('예산서 작성에 실패했습니다.');
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return incomeItems.length > 0;
      case 2:
        return expenseItems.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  if (isLoadingEvent) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">행사를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold">예산서 작성</h1>
        <p className="text-muted-foreground mt-1">
          {event.name} - 예산서 작성 마법사
        </p>
      </div>

      {/* 단계 표시 */}
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      {/* 단계별 컨텐츠 */}
      <div className="min-h-[500px]">
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">1단계: 수입 항목 작성</h2>
            <IncomeList items={incomeItems} onChange={setIncomeItems} />
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">2단계: 지출 항목 작성</h2>
            <ExpenseList
              items={expenseItems}
              onChange={setExpenseItems}
              totalIncome={totalIncome}
            />
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">3단계: 검토 및 제출</h2>

            {/* 예산 요약 */}
            <Card>
              <CardHeader>
                <CardTitle>예산 요약</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">총 수입</p>
                    <p className="text-2xl font-bold text-green-600">
                      {totalIncome.toLocaleString()}원
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">총 지출</p>
                    <p className="text-2xl font-bold text-red-600">
                      {totalExpense.toLocaleString()}원
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">예산 차액</p>
                    <p
                      className={`text-2xl font-bold ${
                        balance >= 0 ? 'text-green-600' : 'text-destructive'
                      }`}
                    >
                      {balance.toLocaleString()}원
                    </p>
                  </div>
                </div>

                {balance < 0 && (
                  <div className="flex items-center gap-2 mt-4 p-3 bg-destructive/10 border border-destructive rounded-lg">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    <p className="text-sm text-destructive">
                      총 지출이 총 수입을 초과합니다. 예산을 조정해주세요.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 비고 */}
            <Card>
              <CardHeader>
                <CardTitle>비고</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="예산서에 대한 추가 메모나 설명을 입력하세요 (선택사항)"
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* 네비게이션 버튼 */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/events')}>
            취소
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSaving}
          >
            {isSaving ? '저장 중...' : '임시 저장'}
          </Button>
        </div>

        <div className="flex gap-2">
          {currentStep > 1 && (
            <Button variant="outline" onClick={handlePrevious}>
              이전
            </Button>
          )}
          {currentStep < STEPS.length ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              다음
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || balance < 0 || isCreating}
            >
              {isCreating ? '제출 중...' : '예산서 제출'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

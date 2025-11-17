import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface BudgetItem {
  category: string;
  description: string;
  budgetAmount: number;
  actualAmount: number;
}

interface BudgetComparisonProps {
  incomeItems: BudgetItem[];
  expenseItems: BudgetItem[];
}

export const BudgetComparison: React.FC<BudgetComparisonProps> = ({
  incomeItems,
  expenseItems,
}) => {
  const totalBudgetIncome = incomeItems.reduce((sum, item) => sum + item.budgetAmount, 0);
  const totalActualIncome = incomeItems.reduce((sum, item) => sum + item.actualAmount, 0);
  const totalBudgetExpense = expenseItems.reduce((sum, item) => sum + item.budgetAmount, 0);
  const totalActualExpense = expenseItems.reduce((sum, item) => sum + item.actualAmount, 0);

  const budgetBalance = totalBudgetIncome - totalBudgetExpense;
  const actualBalance = totalActualIncome - totalActualExpense;

  const incomeDiff = totalActualIncome - totalBudgetIncome;
  const expenseDiff = totalActualExpense - totalBudgetExpense;

  const getDifferenceColor = (diff: number, isIncome: boolean) => {
    if (isIncome) {
      return diff >= 0 ? 'text-green-600' : 'text-red-600';
    } else {
      return diff <= 0 ? 'text-green-600' : 'text-red-600';
    }
  };

  const getDifferenceIcon = (diff: number) => {
    return diff >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  const getPercentage = (actual: number, budget: number) => {
    if (budget === 0) return 0;
    return Math.min((actual / budget) * 100, 100);
  };

  return (
    <div className="space-y-6">
      {/* 전체 요약 */}
      <Card>
        <CardHeader>
          <CardTitle>예산 vs 결산 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">수입</p>
              <p className="text-lg font-semibold text-green-600 mt-1">
                {totalActualIncome.toLocaleString()}원
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                예산: {totalBudgetIncome.toLocaleString()}원
              </p>
              <div className={`flex items-center justify-center gap-1 mt-2 ${getDifferenceColor(incomeDiff, true)}`}>
                {getDifferenceIcon(incomeDiff)}
                <span className="text-sm font-medium">
                  {Math.abs(incomeDiff).toLocaleString()}원
                </span>
              </div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">지출</p>
              <p className="text-lg font-semibold text-red-600 mt-1">
                {totalActualExpense.toLocaleString()}원
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                예산: {totalBudgetExpense.toLocaleString()}원
              </p>
              <div className={`flex items-center justify-center gap-1 mt-2 ${getDifferenceColor(expenseDiff, false)}`}>
                {getDifferenceIcon(expenseDiff)}
                <span className="text-sm font-medium">
                  {Math.abs(expenseDiff).toLocaleString()}원
                </span>
              </div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">차액</p>
              <p className={`text-lg font-semibold mt-1 ${actualBalance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {actualBalance.toLocaleString()}원
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                예산: {budgetBalance.toLocaleString()}원
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 수입 항목 상세 비교 */}
      <Card>
        <CardHeader>
          <CardTitle>수입 항목 비교</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {incomeItems.map((item, index) => {
              const diff = item.actualAmount - item.budgetAmount;
              const percentage = getPercentage(item.actualAmount, item.budgetAmount);

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.category}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.description}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">
                          {item.actualAmount.toLocaleString()}원
                        </p>
                        <p className="text-xs text-muted-foreground">
                          예산: {item.budgetAmount.toLocaleString()}원
                        </p>
                      </div>
                      <Badge variant={diff >= 0 ? 'default' : 'secondary'}>
                        {diff >= 0 ? '+' : ''}{diff.toLocaleString()}원
                      </Badge>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 지출 항목 상세 비교 */}
      <Card>
        <CardHeader>
          <CardTitle>지출 항목 비교</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expenseItems.map((item, index) => {
              const diff = item.actualAmount - item.budgetAmount;
              const percentage = getPercentage(item.actualAmount, item.budgetAmount);
              const isSaving = diff < 0;

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.category}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.description}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">
                          {item.actualAmount.toLocaleString()}원
                        </p>
                        <p className="text-xs text-muted-foreground">
                          예산: {item.budgetAmount.toLocaleString()}원
                        </p>
                      </div>
                      <Badge variant={isSaving ? 'default' : 'destructive'}>
                        {diff >= 0 ? '+' : ''}{diff.toLocaleString()}원
                      </Badge>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

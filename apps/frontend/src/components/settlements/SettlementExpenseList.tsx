import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { SettlementItemForm } from './SettlementItemForm';
import { SettlementItemFormData } from '@/schemas/settlementSchema';

interface SettlementExpenseListProps {
  items: SettlementItemFormData[];
  onChange: (items: SettlementItemFormData[]) => void;
}

export const SettlementExpenseList: React.FC<SettlementExpenseListProps> = ({
  items,
  onChange,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const totalBudgetExpense = items.reduce((sum, item) => sum + item.budgetAmount, 0);
  const totalActualExpense = items.reduce((sum, item) => sum + item.actualAmount, 0);
  const difference = totalActualExpense - totalBudgetExpense;

  const handleAdd = (data: SettlementItemFormData) => {
    if (editingIndex !== null) {
      const newItems = [...items];
      newItems[editingIndex] = data;
      onChange(newItems);
      setEditingIndex(null);
    } else {
      onChange([...items, data]);
    }
    setIsFormOpen(false);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setIsFormOpen(true);
  };

  const handleDelete = (index: number) => {
    if (confirm('이 항목을 삭제하시겠습니까?')) {
      onChange(items.filter((_, i) => i !== index));
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingIndex(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>지출 항목</CardTitle>
          {!isFormOpen && (
            <Button onClick={() => setIsFormOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              항목 추가
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isFormOpen ? (
          <SettlementItemForm
            onSubmit={handleAdd}
            onCancel={handleCancel}
            defaultValues={editingIndex !== null ? items[editingIndex] : undefined}
            isEditMode={editingIndex !== null}
          />
        ) : (
          <>
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                지출 항목을 추가해주세요
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>카테고리</TableHead>
                      <TableHead>설명</TableHead>
                      <TableHead className="text-right">예산 금액</TableHead>
                      <TableHead className="text-right">실제 금액</TableHead>
                      <TableHead className="text-right">차액</TableHead>
                      <TableHead className="text-center">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => {
                      const itemDiff = item.actualAmount - item.budgetAmount;
                      const isSaving = itemDiff < 0;
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.category}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">
                            {item.budgetAmount.toLocaleString()}원
                          </TableCell>
                          <TableCell className="text-right">
                            {item.actualAmount.toLocaleString()}원
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={isSaving ? 'default' : 'destructive'}>
                              {itemDiff >= 0 ? '+' : ''}
                              {itemDiff.toLocaleString()}원
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(index)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(index)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-end gap-8">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">예산 총액</p>
                      <p className="text-lg font-semibold">
                        {totalBudgetExpense.toLocaleString()}원
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">실제 총액</p>
                      <p className="text-lg font-semibold text-red-600">
                        {totalActualExpense.toLocaleString()}원
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">차액</p>
                      <p className={`text-lg font-semibold ${difference <= 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {difference >= 0 ? '+' : ''}
                        {difference.toLocaleString()}원
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

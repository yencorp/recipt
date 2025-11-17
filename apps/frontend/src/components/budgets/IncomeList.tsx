import { useState } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BudgetItemForm } from './BudgetItemForm';
import { BudgetItemFormData } from '@/schemas/budgetSchema';

interface IncomeListProps {
  items: BudgetItemFormData[];
  onChange: (items: BudgetItemFormData[]) => void;
}

export const IncomeList: React.FC<IncomeListProps> = ({ items, onChange }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const totalIncome = items.reduce((sum, item) => sum + item.amount, 0);

  const handleAdd = (data: BudgetItemFormData) => {
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
    onChange(items.filter((_, i) => i !== index));
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingIndex(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>수입 항목</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                총 수입: {totalIncome.toLocaleString()}원
              </p>
            </div>
            <Button onClick={() => setIsFormOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              항목 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              수입 항목을 추가해주세요
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.category}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.description}
                      </span>
                    </div>
                    {item.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">
                      {item.amount.toLocaleString()}원
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(index)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={handleCancel}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? '수입 항목 수정' : '수입 항목 추가'}
            </DialogTitle>
          </DialogHeader>
          <BudgetItemForm
            onSubmit={handleAdd}
            onCancel={handleCancel}
            defaultValues={editingIndex !== null ? items[editingIndex] : undefined}
            isIncome={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

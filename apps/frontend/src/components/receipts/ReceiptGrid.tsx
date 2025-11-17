import { useState } from 'react';
import { Trash2, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ReceiptModal } from './ReceiptModal';
import { useDeleteReceiptMutation } from '@/store/api/settlementsApi';

interface Receipt {
  id: string;
  url: string;
  filename: string;
  uploadedAt: string;
}

interface ReceiptGridProps {
  receipts: Receipt[];
  settlementId: string;
  onDelete?: () => void;
}

export const ReceiptGrid: React.FC<ReceiptGridProps> = ({
  receipts,
  settlementId,
  onDelete,
}) => {
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [deleteReceipt, { isLoading: isDeleting }] = useDeleteReceiptMutation();

  const handleDelete = async (receiptId: string) => {
    if (!confirm('이 영수증을 삭제하시겠습니까?')) return;

    try {
      await deleteReceipt({ settlementId, receiptId }).unwrap();
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('영수증 삭제 실패:', error);
      alert('영수증 삭제에 실패했습니다.');
    }
  };

  if (receipts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            업로드된 영수증이 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {receipts.map((receipt) => (
          <Card
            key={receipt.id}
            className="group relative overflow-hidden hover:shadow-md transition-shadow"
          >
            <CardContent className="p-0">
              <div className="aspect-square relative">
                <img
                  src={receipt.url}
                  alt={receipt.filename}
                  className="w-full h-full object-cover"
                />

                {/* 호버 오버레이 */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedReceipt(receipt)}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(receipt.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* 파일 정보 */}
              <div className="p-2 border-t">
                <p className="text-xs font-medium truncate">{receipt.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(receipt.uploadedAt).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 상세 보기 모달 */}
      <ReceiptModal
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </>
  );
};

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Receipt {
  id: string;
  url: string;
  filename: string;
  uploadedAt: string;
}

interface ReceiptModalProps {
  receipt: Receipt | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose }) => {
  if (!receipt) return null;

  return (
    <Dialog open={!!receipt} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{receipt.filename}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            업로드: {new Date(receipt.uploadedAt).toLocaleString('ko-KR')}
          </p>
        </DialogHeader>

        <div className="mt-4">
          <img
            src={receipt.url}
            alt={receipt.filename}
            className="w-full h-auto rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

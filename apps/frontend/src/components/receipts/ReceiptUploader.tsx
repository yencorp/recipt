import { useCallback, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useUploadReceiptsMutation } from '@/store/api/settlementsApi';

interface ReceiptUploaderProps {
  settlementId: string;
  onUploadComplete?: () => void;
}

export const ReceiptUploader: React.FC<ReceiptUploaderProps> = ({
  settlementId,
  onUploadComplete,
}) => {
  const [uploadReceipts, { isLoading }] = useUploadReceiptsMutation();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/')
    );

    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('receipts', file);
    });

    try {
      setUploadProgress(0);
      // 실제로는 XMLHttpRequest나 axios로 진행률을 추적해야 하지만,
      // RTK Query에서는 간단히 시뮬레이션
      const interval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      await uploadReceipts({ settlementId, files: formData }).unwrap();

      clearInterval(interval);
      setUploadProgress(100);
      setSelectedFiles([]);

      if (onUploadComplete) {
        onUploadComplete();
      }

      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error) {
      console.error('영수증 업로드 실패:', error);
      setUploadProgress(0);
      alert('영수증 업로드에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-4">
      {/* 드래그앤드롭 영역 */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Upload className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">
            영수증 이미지를 드래그하거나 클릭하여 업로드
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            PNG, JPG, JPEG 파일 지원 (최대 10MB)
          </p>
          <label htmlFor="file-upload">
            <Button variant="outline" asChild>
              <span>파일 선택</span>
            </Button>
          </label>
          <input
            id="file-upload"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* 선택된 파일 목록 */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium">
                  선택된 파일: {selectedFiles.length}개
                </p>
                <Button onClick={handleUpload} disabled={isLoading} size="sm">
                  {isLoading ? '업로드 중...' : '업로드'}
                </Button>
              </div>

              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center overflow-hidden">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {/* 업로드 진행률 */}
              {uploadProgress > 0 && (
                <div className="space-y-2 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>업로드 진행률</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

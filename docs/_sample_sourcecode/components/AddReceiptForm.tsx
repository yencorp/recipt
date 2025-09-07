import React, { useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { extractReceiptInfoFromImage } from '../services/geminiService';
import { ExtractedReceiptData, Receipt } from '../types';
import { PhotoIcon, ArrowPathIcon, CheckCircleIcon, XCircleIcon } from './Icons';
import ImageModal from './ImageModal';

interface AddReceiptFormProps {
  projectId: string;
  onAddReceipts: (projectId: string, receiptData: Omit<Receipt, 'id'>[]) => void;
}

type PendingReceipt = ExtractedReceiptData & {
    imageUrl: string;
    id: string; // Client-side unique ID for list rendering and updates
};

const AddReceiptForm: React.FC<AddReceiptFormProps> = ({ projectId, onAddReceipts }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingReceipts, setPendingReceipts] = useState<PendingReceipt[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    pendingReceipts.forEach(receipt => URL.revokeObjectURL(receipt.imageUrl));
    setIsProcessing(false);
    setError(null);
    setPendingReceipts([]);
    setProcessingStatus('');
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }, [pendingReceipts]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Clear state from any previous batch processing.
    // The previous incorrect call to resetForm() is replaced by this logic.
    pendingReceipts.forEach(receipt => URL.revokeObjectURL(receipt.imageUrl));
    setPendingReceipts([]);
    setError(null);
    setProcessingStatus('');
    setIsProcessing(true);

    const results: PendingReceipt[] = [];
    const failedFiles: string[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProcessingStatus(`영수증 분석 중 ${i + 1} / ${files.length}: ${file.name}`);
        
        try {
            const result = await extractReceiptInfoFromImage(file);
            if (result) {
                results.push({
                    ...result,
                    imageUrl: URL.createObjectURL(file),
                    id: uuidv4(),
                });
            } else {
                failedFiles.push(file.name);
            }
        } catch (e) {
            failedFiles.push(file.name);
        }
    }

    setPendingReceipts(results);

    if (failedFiles.length > 0) {
        setError(`다음 파일에서 정보를 추출하지 못했습니다: ${failedFiles.join(', ')}. 확인 후 다시 시도해주세요.`);
    }
    
    setIsProcessing(false);
    setProcessingStatus('');
  };

  const handleSaveAll = () => {
    if (pendingReceipts.length > 0) {
      const receiptsToSave = pendingReceipts.map(({ id, ...rest }) => rest);
      onAddReceipts(projectId, receiptsToSave);
      resetForm();
    }
  };

  const handleUpdatePendingReceipt = (id: string, field: keyof ExtractedReceiptData, value: string | number) => {
    // Basic validation for total
    if (field === 'total') {
        const numValue = Number(value);
        if (isNaN(numValue)) return;
        value = numValue;
    }
    setPendingReceipts(prev =>
        prev.map(r => (r.id === id ? { ...r, [field]: value } : r))
    );
  };
  
  const handleRemovePendingReceipt = (id: string) => {
    setPendingReceipts(prev => {
        const receiptToRemove = prev.find(r => r.id === id);
        if (receiptToRemove) {
            URL.revokeObjectURL(receiptToRemove.imageUrl);
        }
        return prev.filter(r => r.id !== id);
    });
  };

  return (
    <>
      <ImageModal imageUrl={selectedImageUrl} onClose={() => setSelectedImageUrl(null)} />
      <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
        <h3 className="font-semibold mb-2 text-slate-200">새 영수증 추가</h3>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          disabled={isProcessing}
          multiple
        />
        {!isProcessing && pendingReceipts.length === 0 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex justify-center items-center gap-2 px-4 py-3 border-2 border-dashed border-slate-500 rounded-md text-slate-400 hover:text-white hover:border-sky-500 transition-colors duration-200"
          >
            <PhotoIcon className="h-6 w-6" />
            <span>탭하여 영수증 스캔</span>
          </button>
        )}

        {isProcessing && (
          <div className="text-center p-4">
            <ArrowPathIcon className="h-8 w-8 text-sky-400 animate-spin mx-auto" />
            <p className="mt-2 text-slate-300">{processingStatus || '영수증 분석 중...'}</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-900/50 text-red-300 p-3 rounded-md my-4">
              <XCircleIcon className="h-5 w-5"/>
              <span>{error}</span>
          </div>
        )}

        {pendingReceipts.length > 0 && !isProcessing && (
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-2 bg-green-900/50 text-green-300 p-3 rounded-md">
              <CheckCircleIcon className="h-5 w-5"/>
              <span>영수증 {pendingReceipts.length}개 처리 완료! 내용을 확인하고 저장해주세요.</span>
            </div>

            <div className="space-y-6">
              {pendingReceipts.map((receipt) => (
                  <div key={receipt.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-800 p-4 rounded-lg relative ring-1 ring-slate-700">
                      <button 
                          onClick={() => handleRemovePendingReceipt(receipt.id)} 
                          className="absolute -top-2 -right-2 text-slate-400 bg-slate-800 rounded-full hover:text-white transition-colors"
                          aria-label="영수증 삭제"
                      >
                          <XCircleIcon className="h-7 w-7" />
                      </button>
                      <div className="md:col-span-1">
                          <button onClick={() => setSelectedImageUrl(receipt.imageUrl)} className="w-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 rounded-md">
                              <img src={receipt.imageUrl} alt="영수증 미리보기" className="rounded-md object-cover w-full h-auto aspect-[3/4] hover:opacity-80 transition-opacity" />
                          </button>
                      </div>
                      <div className="md:col-span-3 space-y-3">
                          <div>
                              <label htmlFor={`store-${receipt.id}`} className="block text-sm font-medium text-slate-400">가게 이름</label>
                              <input type="text" id={`store-${receipt.id}`} value={receipt.store} onChange={(e) => handleUpdatePendingReceipt(receipt.id, 'store', e.target.value)} className="mt-1 w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-sky-500"/>
                          </div>
                          <div>
                              <label htmlFor={`date-${receipt.id}`} className="block text-sm font-medium text-slate-400">날짜</label>
                              <input type="date" id={`date-${receipt.id}`} value={receipt.date} onChange={(e) => handleUpdatePendingReceipt(receipt.id, 'date', e.target.value)} className="mt-1 w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-sky-500"/>
                          </div>
                          <div>
                              <label htmlFor={`total-${receipt.id}`} className="block text-sm font-medium text-slate-400">금액</label>
                              <input type="number" id={`total-${receipt.id}`} value={receipt.total} onChange={(e) => handleUpdatePendingReceipt(receipt.id, 'total', e.target.value)} className="mt-1 w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-sky-500"/>
                          </div>
                      </div>
                  </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-slate-600 text-white font-semibold rounded-md hover:bg-slate-500 transition-colors"
              >
                  취소
              </button>
              <button
                  onClick={handleSaveAll}
                  className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-md hover:bg-sky-500 transition-colors"
              >
                  모두 저장 ({pendingReceipts.length})
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AddReceiptForm;

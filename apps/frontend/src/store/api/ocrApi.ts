import { api } from './apiSlice';

export interface OCRResult {
  id: string;
  receiptId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  merchantName?: string;
  transactionDate?: string;
  totalAmount?: number;
  items?: OCRLineItem[];
  confidence?: number;
  rawText?: string;
  errorMessage?: string;
  processedAt?: string;
}

export interface OCRLineItem {
  id: string;
  description: string;
  quantity?: number;
  unitPrice?: number;
  amount: number;
  confidence?: number;
}

export interface ProcessOCRDto {
  receiptId: string;
}

export interface UpdateOCRResultDto {
  merchantName?: string;
  transactionDate?: string;
  totalAmount?: number;
  items?: Omit<OCRLineItem, 'id'>[];
}

export const ocrApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // OCR 처리 요청
    processOCR: builder.mutation<OCRResult, ProcessOCRDto>({
      query: (data) => ({
        url: '/ocr/process',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['OCR'],
    }),

    // OCR 결과 조회
    getOCRResult: builder.query<OCRResult, string>({
      query: (id) => `/ocr/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'OCR', id }],
    }),

    // 영수증별 OCR 결과 조회
    getOCRResultByReceipt: builder.query<OCRResult, string>({
      query: (receiptId) => `/ocr/receipt/${receiptId}`,
      providesTags: (_result, _error, receiptId) => [
        { type: 'OCR', id: receiptId },
      ],
    }),

    // OCR 결과 수정
    updateOCRResult: builder.mutation<
      OCRResult,
      { id: string; data: UpdateOCRResultDto }
    >({
      query: ({ id, data }) => ({
        url: `/ocr/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'OCR', id }],
    }),

    // 여러 영수증에 대한 OCR 일괄 처리
    batchProcessOCR: builder.mutation<OCRResult[], { receiptIds: string[] }>({
      query: (data) => ({
        url: '/ocr/batch',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['OCR'],
    }),

    // OCR 처리 상태 조회 (폴링용)
    getOCRStatus: builder.query<
      { completed: number; total: number; results: OCRResult[] },
      string[]
    >({
      query: (receiptIds) => ({
        url: '/ocr/status',
        params: { receiptIds: receiptIds.join(',') },
      }),
      providesTags: ['OCR'],
    }),
  }),
});

export const {
  useProcessOCRMutation,
  useGetOCRResultQuery,
  useGetOCRResultByReceiptQuery,
  useUpdateOCRResultMutation,
  useBatchProcessOCRMutation,
  useGetOCRStatusQuery,
} = ocrApi;

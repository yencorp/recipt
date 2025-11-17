import { api } from './baseApi';

export enum PDFType {
  BUDGET = 'BUDGET',
  SETTLEMENT = 'SETTLEMENT',
  BUDGET_DETAIL = 'BUDGET_DETAIL',
  SETTLEMENT_DETAIL = 'SETTLEMENT_DETAIL',
}

export interface BudgetPrintData {
  eventId: string;
  eventName: string;
  organizationName: string;
  budgetPeriod: {
    startDate: string;
    endDate: string;
  };
  incomeItems: PrintItem[];
  expenseItems: PrintItem[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
  createdBy: string;
  createdAt: string;
  notes?: string;
}

export interface SettlementPrintData {
  eventId: string;
  eventName: string;
  organizationName: string;
  settlementPeriod: {
    startDate: string;
    endDate: string;
  };
  incomeItems: PrintSettlementItem[];
  expenseItems: PrintSettlementItem[];
  totalBudgetIncome: number;
  totalActualIncome: number;
  totalBudgetExpense: number;
  totalActualExpense: number;
  budgetBalance: number;
  actualBalance: number;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

export interface PrintItem {
  category: string;
  description: string;
  amount: number;
  notes?: string;
}

export interface PrintSettlementItem extends PrintItem {
  budgetAmount: number;
  actualAmount: number;
  difference: number;
  receiptCount?: number;
}

export interface GeneratePDFDto {
  eventId: string;
  type: PDFType;
  includeReceipts?: boolean;
}

export interface GeneratePDFResponse {
  url: string;
  filename: string;
  size: number;
}

export const printApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // 예산서 인쇄 데이터 조회
    getBudgetPrintData: builder.query<BudgetPrintData, string>({
      query: (eventId) => `/print/budget/${eventId}`,
      providesTags: (_result, _error, eventId) => [
        { type: 'Budgets', id: eventId },
      ],
    }),

    // 결산서 인쇄 데이터 조회
    getSettlementPrintData: builder.query<SettlementPrintData, string>({
      query: (eventId) => `/print/settlement/${eventId}`,
      providesTags: (_result, _error, eventId) => [
        { type: 'Settlements', id: eventId },
      ],
    }),

    // PDF 생성
    generatePDF: builder.mutation<GeneratePDFResponse, GeneratePDFDto>({
      query: (data) => ({
        url: '/print/pdf',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useGetBudgetPrintDataQuery,
  useGetSettlementPrintDataQuery,
  useGeneratePDFMutation,
} = printApi;

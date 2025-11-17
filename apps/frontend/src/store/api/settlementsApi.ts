import { api } from './baseApi';
import type { Settlement, CreateSettlementDto, Receipt } from '@/types';

export const settlementsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSettlementByEvent: builder.query<Settlement, string>({
      query: (eventId) => `/settlements/event/${eventId}`,
      providesTags: (_result, _error, eventId) => [{ type: 'Settlement', id: eventId }],
    }),
    getSettlement: builder.query<Settlement, string>({
      query: (id) => `/settlements/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Settlement', id }],
    }),
    createSettlement: builder.mutation<Settlement, CreateSettlementDto>({
      query: (settlement) => ({
        url: '/settlements',
        method: 'POST',
        body: settlement,
      }),
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: 'Settlement', id: eventId },
        'Event',
      ],
    }),
    updateSettlement: builder.mutation<Settlement, { id: string; settlement: Partial<CreateSettlementDto> }>({
      query: ({ id, settlement }) => ({
        url: `/settlements/${id}`,
        method: 'PATCH',
        body: settlement,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Settlement', id }],
    }),
    uploadReceipts: builder.mutation<Receipt[], { settlementId: string; files: FormData }>({
      query: ({ settlementId, files }) => ({
        url: `/settlements/${settlementId}/receipts`,
        method: 'POST',
        body: files,
      }),
      invalidatesTags: (_result, _error, { settlementId }) => [
        { type: 'Settlement', id: settlementId },
      ],
    }),
    deleteReceipt: builder.mutation<void, { settlementId: string; receiptId: string }>({
      query: ({ settlementId, receiptId }) => ({
        url: `/settlements/${settlementId}/receipts/${receiptId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { settlementId }) => [
        { type: 'Settlement', id: settlementId },
      ],
    }),
  }),
});

export const {
  useGetSettlementByEventQuery,
  useGetSettlementQuery,
  useCreateSettlementMutation,
  useUpdateSettlementMutation,
  useUploadReceiptsMutation,
  useDeleteReceiptMutation,
} = settlementsApi;

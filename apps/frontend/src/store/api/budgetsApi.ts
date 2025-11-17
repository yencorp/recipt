import { api } from './baseApi';
import type { Budget, CreateBudgetDto, BudgetItem } from '@/types';

export const budgetsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getBudgetByEvent: builder.query<Budget, string>({
      query: (eventId) => `/budgets/event/${eventId}`,
      providesTags: (_result, _error, eventId) => [{ type: 'Budget', id: eventId }],
    }),
    getBudget: builder.query<Budget, string>({
      query: (id) => `/budgets/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Budget', id }],
    }),
    createBudget: builder.mutation<Budget, CreateBudgetDto>({
      query: (budget) => ({
        url: '/budgets',
        method: 'POST',
        body: budget,
      }),
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: 'Budget', id: eventId },
        'Event',
      ],
    }),
    updateBudget: builder.mutation<Budget, { id: string; budget: Partial<CreateBudgetDto> }>({
      query: ({ id, budget }) => ({
        url: `/budgets/${id}`,
        method: 'PATCH',
        body: budget,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Budget', id }],
    }),
    saveBudgetDraft: builder.mutation<Budget, { id?: string; budget: Partial<CreateBudgetDto> }>({
      query: ({ id, budget }) => ({
        url: id ? `/budgets/${id}/draft` : '/budgets/draft',
        method: id ? 'PATCH' : 'POST',
        body: budget,
      }),
      invalidatesTags: (_result, _error, { id }) =>
        id ? [{ type: 'Budget', id }] : [],
    }),
  }),
});

export const {
  useGetBudgetByEventQuery,
  useGetBudgetQuery,
  useCreateBudgetMutation,
  useUpdateBudgetMutation,
  useSaveBudgetDraftMutation,
} = budgetsApi;

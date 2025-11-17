import { api } from './baseApi';
import type { Event, CreateEventDto, PaginatedResponse } from '@/types';

export const eventsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getEvents: builder.query<Event[], void>({
      query: () => '/events',
      transformResponse: (response: PaginatedResponse<Event>) => response.items,
      providesTags: ['Event'],
    }),
    getEvent: builder.query<Event, string>({
      query: (id) => `/events/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Event', id }],
    }),
    createEvent: builder.mutation<Event, CreateEventDto>({
      query: (event) => ({
        url: '/events',
        method: 'POST',
        body: event,
      }),
      invalidatesTags: ['Event'],
    }),
    updateEvent: builder.mutation<Event, { id: string; event: Partial<CreateEventDto> }>({
      query: ({ id, event }) => ({
        url: `/events/${id}`,
        method: 'PATCH',
        body: event,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Event', id }, 'Event'],
    }),
    deleteEvent: builder.mutation<void, string>({
      query: (id) => ({
        url: `/events/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Event'],
    }),
  }),
});

export const {
  useGetEventsQuery,
  useGetEventQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
} = eventsApi;

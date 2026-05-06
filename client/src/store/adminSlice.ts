import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createApiClient } from '../api/apiClient';
import type { EventWithSingersDto } from '../types';
import type { RootState } from './index';

export const fetchEvents = createAsyncThunk(
  'admin/fetchEvents',
  async (_, { getState }) => {
    const { auth } = getState() as RootState;
    return createApiClient(auth.credentials).get<EventWithSingersDto[]>('/events');
  }
);

export const createEvent = createAsyncThunk(
  'admin/createEvent',
  async (dto: { name: string; date: string }, { getState, dispatch }) => {
    const { auth } = getState() as RootState;
    await createApiClient(auth.credentials).post('/events', dto);
    dispatch(fetchEvents());
  }
);

export const updateEvent = createAsyncThunk(
  'admin/updateEvent',
  async ({ id, name, date }: { id: number; name: string; date: string }, { getState, dispatch }) => {
    const { auth } = getState() as RootState;
    await createApiClient(auth.credentials).put(`/events/${id}`, { name, date });
    dispatch(fetchEvents());
  }
);

export const deleteEvent = createAsyncThunk(
  'admin/deleteEvent',
  async (id: number, { getState, dispatch }) => {
    const { auth } = getState() as RootState;
    await createApiClient(auth.credentials).delete(`/events/${id}`);
    dispatch(fetchEvents());
  }
);

export const addSinger = createAsyncThunk(
  'admin/addSinger',
  async (
    dto: { eventId: number; badgeName: string; firstName: string; lastName: string; part: string; status: string },
    { getState, dispatch }
  ) => {
    const { auth } = getState() as RootState;
    const { eventId, ...body } = dto;
    await createApiClient(auth.credentials).post(`/events/${eventId}/singers`, body);
    dispatch(fetchEvents());
  }
);

export const updateSingerStatus = createAsyncThunk(
  'admin/updateSingerStatus',
  async ({ singerId, status }: { singerId: number; status: string }, { getState, dispatch }) => {
    const { auth } = getState() as RootState;
    await createApiClient(auth.credentials).patch(`/singers/${singerId}/status`, { status });
    dispatch(fetchEvents());
  }
);

interface AdminState {
  events: EventWithSingersDto[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AdminState = { events: [], status: 'idle', error: null };

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchEvents.pending, state => { state.status = 'loading'; })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.events = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to load';
      });
  },
});

export default adminSlice.reducer;

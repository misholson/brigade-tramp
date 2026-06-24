import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createApiClient } from '../api/apiClient';
import type { EventWithSingersDto } from '../types';
import type { RootState } from './index';

export const fetchEvents = createAsyncThunk(
  'admin/fetchEvents',
  async (_, { getState }) => {
    const { auth } = getState() as RootState;
    return createApiClient(auth.token).get<EventWithSingersDto[]>('/events');
  }
);

export const createEvent = createAsyncThunk(
  'admin/createEvent',
  async (dto: { name: string; date: string; endDate: string | null; allowBusyBee: boolean; emailFooter: string }, { getState, dispatch }) => {
    const { auth } = getState() as RootState;
    await createApiClient(auth.token).post('/events', dto);
    dispatch(fetchEvents());
  }
);

export const updateEvent = createAsyncThunk(
  'admin/updateEvent',
  async ({ id, name, date, endDate, allowBusyBee, emailFooter }: { id: number; name: string; date: string; endDate: string | null; allowBusyBee: boolean; emailFooter: string }, { getState, dispatch }) => {
    const { auth } = getState() as RootState;
    await createApiClient(auth.token).put(`/events/${id}`, { name, date, endDate, allowBusyBee, emailFooter });
    dispatch(fetchEvents());
  }
);

export const deleteEvent = createAsyncThunk(
  'admin/deleteEvent',
  async (id: number, { getState, dispatch }) => {
    const { auth } = getState() as RootState;
    await createApiClient(auth.token).delete(`/events/${id}`);
    dispatch(fetchEvents());
  }
);

export const addSinger = createAsyncThunk(
  'admin/addSinger',
  async (
    dto: { eventId: number; badgeName: string; firstName: string; lastName: string; part: string; email: string; danceCardStatus: string; contestStatus: string },
    { getState, dispatch }
  ) => {
    const { auth } = getState() as RootState;
    const { eventId, ...body } = dto;
    await createApiClient(auth.token).post(`/events/${eventId}/singers`, body);
    dispatch(fetchEvents());
  }
);

export const editSinger = createAsyncThunk(
  'admin/editSinger',
  async (
    dto: { singerId: number; badgeName: string; firstName: string; lastName: string; part: string; email: string; danceCardStatus: string; contestStatus: string },
    { getState, dispatch }
  ) => {
    const { auth } = getState() as RootState;
    const { singerId, ...body } = dto;
    await createApiClient(auth.token).put(`/singers/${singerId}`, body);
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

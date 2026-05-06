import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createApiClient } from '../api/apiClient';
import type { SingerDetailDto } from '../types';
import type { RootState } from './index';

export const fetchSingerByCode = createAsyncThunk(
  'singer/fetchByCode',
  async (code: string, { getState }) => {
    const { auth } = getState() as RootState;
    return createApiClient(auth.credentials).get<SingerDetailDto>(`/singer/${code}`);
  }
);

interface ToggleArgs { singerId: number; otherId: number; remove: boolean; }

export const toggleSungWith = createAsyncThunk(
  'singer/toggleSungWith',
  async ({ singerId, otherId, remove }: ToggleArgs, { getState }) => {
    const { auth } = getState() as RootState;
    const client = createApiClient(auth.credentials);
    if (remove) {
      await client.delete(`/singer/${singerId}/sung-with/${otherId}`);
    } else {
      await client.post(`/singer/${singerId}/sung-with/${otherId}`);
    }
    return { otherId, remove };
  }
);

interface SingerState {
  currentSinger: SingerDetailDto | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: SingerState = { currentSinger: null, status: 'idle', error: null };

const singerSlice = createSlice({
  name: 'singer',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchSingerByCode.pending, state => { state.status = 'loading'; })
      .addCase(fetchSingerByCode.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentSinger = action.payload;
      })
      .addCase(fetchSingerByCode.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to load';
      })
      .addCase(toggleSungWith.pending, (state, action) => {
        if (!state.currentSinger) return;
        const { otherId, remove } = action.meta.arg;
        if (remove) {
          state.currentSinger.sungWithIds = state.currentSinger.sungWithIds.filter(id => id !== otherId);
        } else {
          state.currentSinger.sungWithIds.push(otherId);
        }
      })
      .addCase(toggleSungWith.rejected, (state, action) => {
        if (!state.currentSinger) return;
        const { otherId, remove } = action.meta.arg;
        if (remove) {
          state.currentSinger.sungWithIds.push(otherId);
        } else {
          state.currentSinger.sungWithIds = state.currentSinger.sungWithIds.filter(id => id !== otherId);
        }
      });
  },
});

export default singerSlice.reducer;

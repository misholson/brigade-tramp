import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  credentials: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = { credentials: null, isAuthenticated: false };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<string>) {
      state.credentials = action.payload;
      state.isAuthenticated = true;
    },
    clearCredentials(state) {
      state.credentials = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;

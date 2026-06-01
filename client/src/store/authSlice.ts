import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './index';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export interface EventRoleInfo {
  eventId: number;
  role: string;
}

export interface UserInfo {
  id: number;
  email: string;
  name: string;
  isSiteAdmin: boolean;
  eventRoles: EventRoleInfo[];
}

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
}

function loadFromStorage(): Pick<AuthState, 'token' | 'user' | 'isAuthenticated'> {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userRaw = localStorage.getItem(USER_KEY);
    if (token && userRaw) {
      return { token, user: JSON.parse(userRaw) as UserInfo, isAuthenticated: true };
    }
  } catch {
    // ignore corrupt storage
  }
  return { token: null, user: null, isAuthenticated: false };
}

const initialState: AuthState = loadFromStorage();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<{ token: string; user: UserInfo }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      localStorage.setItem(TOKEN_KEY, action.payload.token);
      localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user));
    },
    clearAuth(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
    // Keep legacy name for backward compat with any remaining references
    clearCredentials(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
  },
});

export const { setAuth, clearAuth, clearCredentials } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectIsSiteAdmin = (state: RootState) =>
  state.auth.user?.isSiteAdmin ?? false;

export const selectCanManageEvent = (eventId: number) => (state: RootState) => {
  const user = state.auth.user;
  if (!user) return false;
  if (user.isSiteAdmin) return true;
  return user.eventRoles.some(r => r.eventId === eventId && r.role === 'EventAdmin');
};

export const selectCanViewEvent = (eventId: number) => (state: RootState) => {
  const user = state.auth.user;
  if (!user) return false;
  if (user.isSiteAdmin) return true;
  return user.eventRoles.some(
    r => r.eventId === eventId && ['EventAdmin', 'EventUser', 'ContestAdmin'].includes(r.role)
  );
};

export const selectIsContestAdmin = (eventId: number) => (state: RootState) => {
  const user = state.auth.user;
  if (!user) return false;
  return user.eventRoles.some(r => r.eventId === eventId && r.role === 'ContestAdmin');
};

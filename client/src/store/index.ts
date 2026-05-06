import { configureStore } from '@reduxjs/toolkit';
import singerReducer from './singerSlice';
import adminReducer from './adminSlice';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    singer: singerReducer,
    admin: adminReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

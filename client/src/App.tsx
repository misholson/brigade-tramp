import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createGlobalStyle } from 'styled-components';
import { lightTheme, darkTheme } from './theme';
import MainPage from './pages/MainPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import EventPage from './pages/EventPage';
import ImportPage from './pages/ImportPage';
import ContestsPage from './pages/ContestsPage';
import SingerLandingPage from './pages/SingerLandingPage';
import PdfMergePage from './pages/PdfMergePage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAppSelector } from './hooks/useAppDispatch';

const GlobalStyle = createGlobalStyle`
  body { background: ${p => p.theme.colors.pageBg}; color: ${p => p.theme.colors.text}; }
`;

function RootRedirect() {
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated);
  return <Navigate to={isAuthenticated ? '/my-events' : '/login'} replace />;
}

export default function App() {
  const [isDark, setIsDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <BrowserRouter>
        <Routes>
          <Route path="/singer/:code" element={<MainPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/my-events" element={
            <ProtectedRoute>
              <SingerLandingPage />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/events/:id" element={
            <ProtectedRoute>
              <EventPage />
            </ProtectedRoute>
          } />
          <Route path="/import" element={
            <ProtectedRoute>
              <ImportPage />
            </ProtectedRoute>
          } />
          <Route path="/contests" element={
            <ProtectedRoute>
              <ContestsPage />
            </ProtectedRoute>
          } />
          <Route path="/pdf" element={
            <ProtectedRoute>
              <PdfMergePage />
            </ProtectedRoute>
          } />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

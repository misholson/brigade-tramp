import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { setAuth } from '../store/authSlice';
import type { UserInfo } from '../store/authSlice';
import { BASE_URL } from '../api/apiClient';

const Container = styled.div`
  max-width: 360px;
  margin: 80px auto;
  padding: 32px;
  background: ${p => p.theme.colors.surface};
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  margin: 0;
  text-align: center;
  color: ${p => p.theme.colors.text};
`;

const ErrorMsg = styled.div`
  color: #c62828;
  font-size: 0.9rem;
  text-align: center;
`;

interface AuthResultDto {
  token: string;
  user: UserInfo;
}

export default function LoginPage() {
  const [error, setError] = useState('');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    setError('');
    if (!response.credential) {
      setError('No credential received from Google.');
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: response.credential }),
      });
      if (!res.ok) {
        setError('Login failed. Your account may not be authorized.');
        return;
      }
      const data = await res.json() as AuthResultDto;
      dispatch(setAuth({ token: data.token, user: data.user }));
      if (data.user.isSiteAdmin || data.user.eventRoles.length > 0) {
        navigate('/admin');
      } else {
        navigate('/my-events');
      }
    } catch {
      setError('Connection error. Is the server running?');
    }
  };

  return (
    <Container>
      <Title>Brigade Tramp</Title>
      {error && <ErrorMsg>{error}</ErrorMsg>}
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => setError('Google sign-in failed. Please try again.')}
        useOneTap
      />
    </Container>
  );
}

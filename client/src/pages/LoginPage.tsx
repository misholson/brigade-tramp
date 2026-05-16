import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { setCredentials } from '../store/authSlice';

const Container = styled.div`
  max-width: 360px;
  margin: 80px auto;
  padding: 32px;
  background: ${p => p.theme.colors.surface};
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  font-size: 1.5rem;
  margin: 0 0 24px;
  text-align: center;
  color: ${p => p.theme.colors.text};
`;

const Field = styled.div`
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${p => p.theme.colors.textSecondary};
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid ${p => p.theme.colors.inputBorder};
  border-radius: 6px;
  font-size: 1rem;
  background: ${p => p.theme.colors.inputBg};
  color: ${p => p.theme.colors.text};
  &:focus { outline: 2px solid ${p => p.theme.colors.focus}; border-color: transparent; }
`;

const SubmitBtn = styled.button`
  width: 100%;
  padding: 12px;
  background: #1565c0;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #0d47a1; }
  &:disabled { opacity: 0.6; cursor: default; }
`;

const ErrorMsg = styled.div`
  color: #c62828;
  font-size: 0.9rem;
  margin-bottom: 12px;
  text-align: center;
`;

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password }),
      });
      if (res.ok) {
        dispatch(setCredentials(btoa(`admin:${password}`)));
        navigate('/admin');
      } else {
        setError('Invalid password.');
      }
    } catch {
      setError('Connection error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Title>Brigade Tramp Admin</Title>
      {error && <ErrorMsg>{error}</ErrorMsg>}
      <form onSubmit={handleSubmit}>
        <Field>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
          />
        </Field>
        <SubmitBtn type="submit" disabled={loading || !password}>
          {loading ? 'Logging in...' : 'Login'}
        </SubmitBtn>
      </form>
    </Container>
  );
}

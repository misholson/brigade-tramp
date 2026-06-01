import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAppSelector, useAppDispatch } from '../hooks/useAppDispatch';
import { clearAuth } from '../store/authSlice';
import { createApiClient } from '../api/apiClient';
import type { MyEventDto } from '../types';

const Container = styled.div`
  max-width: 480px;
  margin: 0 auto;
  padding: 32px 16px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  margin: 0;
  color: ${p => p.theme.colors.text};
`;

const Btn = styled.button<{ $variant?: 'primary' | 'danger' | 'secondary' }>`
  padding: 9px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  background: ${p =>
    p.$variant === 'danger' ? '#c62828' : p.$variant === 'primary' ? '#1565c0' : '#757575'};
  color: #fff;
  &:hover { opacity: 0.85; }
`;

const EventCard = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  padding: 16px 20px;
  margin-bottom: 10px;
  background: ${p => p.theme.colors.surface};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: 8px;
  cursor: pointer;
  &:hover { background: ${p => p.theme.colors.surfaceHover ?? p.theme.colors.surfaceAlt}; }
`;

const EventName = styled.div`
  font-size: 1.05rem;
  font-weight: 700;
  color: ${p => p.theme.colors.text};
`;

const EventDate = styled.div`
  font-size: 0.85rem;
  color: ${p => p.theme.colors.textMuted};
  margin-top: 3px;
`;

const Msg = styled.div`
  color: ${p => p.theme.colors.textMuted};
  text-align: center;
  padding: 40px 0;
`;

const AdminLink = styled.a`
  display: block;
  text-align: center;
  margin-top: 24px;
  color: ${p => p.theme.colors.link ?? '#1565c0'};
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: underline;
`;

export default function SingerLandingPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const token = useAppSelector(s => s.auth.token);
  const user = useAppSelector(s => s.auth.user);
  const [events, setEvents] = useState<MyEventDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);

    createApiClient(token).get<MyEventDto[]>('/auth/my-events')
      .then(data => {
        setEvents(data);
        // Auto-redirect if exactly one event is active today and has a singer code
        const active = data.filter(e =>
          e.singerCode &&
          e.date <= today &&
          (e.endDate == null || e.endDate >= today)
        );
        if (active.length === 1) {
          navigate(`/singer/${active[0].singerCode}`, { replace: true });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, navigate]);

  const handleLogout = () => {
    dispatch(clearAuth());
    navigate('/login');
  };

  return (
    <Container>
      <Header>
        <Title>My Events</Title>
        <Btn $variant="danger" onClick={handleLogout}>Logout</Btn>
      </Header>

      {loading && <Msg>Loading...</Msg>}

      {!loading && events.length === 0 && (
        <Msg>No events found for your account.</Msg>
      )}

      {events.map(ev => (
        <EventCard
          key={ev.eventId}
          onClick={() => ev.singerCode ? navigate(`/singer/${ev.singerCode}`) : undefined}
          disabled={!ev.singerCode}
        >
          <EventName>{ev.eventName}</EventName>
          <EventDate>{ev.date}{ev.endDate ? ` – ${ev.endDate}` : ''}</EventDate>
        </EventCard>
      ))}

      {user && (user.isSiteAdmin || user.eventRoles.length > 0) && (
        <AdminLink onClick={() => navigate('/admin')}>Go to Admin</AdminLink>
      )}
    </Container>
  );
}

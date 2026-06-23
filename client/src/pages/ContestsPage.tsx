import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { useAppSelector } from '../hooks/useAppDispatch';
import { BASE_URL } from '../api/apiClient';

const Container = styled.div`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 20px 16px;
  box-sizing: border-box;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 12px;
`;

const TitleBlock = styled.div``;

const Title = styled.h1`
  font-size: 1.5rem;
  margin: 0;
`;

const Sub = styled.div`
  font-size: 0.85rem;
  color: ${p => p.theme.colors.textMuted};
  margin-top: 3px;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
`;

const Btn = styled.button<{ $variant?: 'primary' | 'danger' | 'secondary' }>`
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  background: ${p =>
    p.$variant === 'primary' ? '#1565c0'
    : p.$variant === 'danger' ? '#c62828'
    : '#757575'};
  color: #fff;
  &:hover { opacity: 0.85; }
  &:disabled { opacity: 0.5; cursor: default; }
`;

const BackLink = styled(Link)`
  font-size: 0.88rem;
  color: ${p => p.theme.colors.textMuted};
  text-decoration: none;
  display: inline-block;
  margin-bottom: 12px;
  &:hover { text-decoration: underline; }
`;

const ContestCard = styled.div`
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: 8px;
  margin-bottom: 12px;
  background: ${p => p.theme.colors.surface};
  padding: 16px 20px;
  cursor: pointer;
  &:hover { background: ${p => p.theme.colors.surfaceHover}; }
`;

const ContestName = styled.div`
  font-weight: 700;
  font-size: 1.05rem;
  margin-bottom: 4px;
`;

const ContestMeta = styled.div`
  font-size: 0.82rem;
  color: ${p => p.theme.colors.textMuted};
`;

const Msg = styled.div<{ $err?: boolean }>`
  padding: 20px;
  text-align: center;
  color: ${p => p.$err ? '#c62828' : p.theme.colors.textMuted};
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const ModalBox = styled.div`
  background: ${p => p.theme.colors.surface};
  border-radius: 10px;
  padding: 28px;
  width: 380px;
  max-width: 95vw;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
`;

const ModalTitle = styled.h2`
  margin: 0 0 18px;
  font-size: 1.1rem;
`;

const Field = styled.div`
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Label = styled.label`
  font-size: 0.88rem;
  font-weight: 600;
  color: ${p => p.theme.colors.textSecondary};
`;

const Input = styled.input`
  padding: 9px;
  border: 1px solid ${p => p.theme.colors.inputBorder};
  border-radius: 5px;
  font-size: 0.95rem;
  background: ${p => p.theme.colors.inputBg};
  color: ${p => p.theme.colors.text};
  &:focus { outline: 2px solid ${p => p.theme.colors.focus}; border-color: transparent; }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
`;

interface ContestSummary {
  id: number;
  name: string;
  eventId: number;
  round2Count: number | null;
  quartets: { id: number }[];
}

export default function ContestsPage() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const navigate = useNavigate();
  const token = useAppSelector(s => s.auth.token);
  const user = useAppSelector(s => s.auth.user);

  const [eventName, setEventName] = useState('');
  const [contests, setContests] = useState<ContestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const numericEventId = eventId ? parseInt(eventId, 10) : null;
  const canManageContest = !!(numericEventId != null && (
    user?.isSiteAdmin ||
    user?.eventRoles.some(r => r.eventId === numericEventId && r.role === 'ContestAdmin')
  ));
  const canViewContests = !!(numericEventId != null && (
    user?.isSiteAdmin ||
    user?.eventRoles.some(r => r.eventId === numericEventId && ['EventAdmin', 'ContestAdmin'].includes(r.role))
  ));

  const authHeader = `Bearer ${token ?? ''}`;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/events/${eventId}/contests`, {
        headers: { Authorization: authHeader },
      });
      if (!res.ok) { setError(`Failed to load (HTTP ${res.status})`); return; }
      const data = await res.json() as { eventName: string; contests: ContestSummary[] };
      setEventName(data.eventName);
      setContests(data.contests);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (eventId) load(); }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await fetch(`${BASE_URL}/events/${eventId}/contests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setNewName('');
    setShowCreate(false);
    load();
  };

  if (!eventId) {
    return (
      <Container>
        <Btn onClick={() => navigate('/admin')}>← Back to Admin</Btn>
      </Container>
    );
  }

  if (!loading && !canViewContests) {
    return (
      <Container>
        <Msg $err>You do not have permission to view contests for this event.</Msg>
        <div style={{ textAlign: 'center' }}>
          <Btn onClick={() => navigate('/admin')}>← Back to Admin</Btn>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <BackLink to={`/admin/events/${eventId}`}>← Event</BackLink>
      <Header>
        <TitleBlock>
          <Title>Contests</Title>
          {eventName && <Sub>{eventName}</Sub>}
        </TitleBlock>
        <HeaderActions>
          {canManageContest && (
            <Btn $variant="primary" onClick={() => { setNewName(''); setShowCreate(true); }}>+ New Contest</Btn>
          )}
        </HeaderActions>
      </Header>

      {loading && <Msg>Loading...</Msg>}
      {error && <Msg $err>{error}</Msg>}
      {!loading && contests.length === 0 && !error && (
        <Msg>No contests yet. Create one to get started.</Msg>
      )}

      {contests.map(contest => (
        <ContestCard key={contest.id} onClick={() => navigate(`/contests/${contest.id}`)}>
          <ContestName>{contest.name}</ContestName>
          <ContestMeta>
            {contest.quartets.length} quartet{contest.quartets.length !== 1 ? 's' : ''}
            {contest.round2Count ? ` · Round 2: Top ${contest.round2Count}` : ''}
          </ContestMeta>
        </ContestCard>
      ))}

      {showCreate && (
        <Overlay>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalTitle>New Contest</ModalTitle>
            <Field>
              <Label>Name</Label>
              <Input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
              />
            </Field>
            <ModalActions>
              <Btn onClick={() => setShowCreate(false)}>Cancel</Btn>
              <Btn $variant="primary" disabled={!newName.trim()} onClick={handleCreate}>Create</Btn>
            </ModalActions>
          </ModalBox>
        </Overlay>
      )}
    </Container>
  );
}

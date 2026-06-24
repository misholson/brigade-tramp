import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchSingerByCode, toggleSungWith, toggleSungWithTwice } from '../store/singerSlice';
import type { Part, SingerDto } from '../types';
import PartGroup from '../components/PartGroup';
import TrampBanner from '../components/TrampBanner';
import HelpCard from '../components/HelpCard';
import SongListCard from '../components/SongListCard';
import ContestInfoCard, { type PublicContest } from '../components/ContestInfoCard';
import { BASE_URL } from '../api/apiClient';

const PART_ORDER: Part[] = ['Tenor', 'Lead', 'Baritone', 'Bass'];

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
`;

const PageTitle = styled.h1`
  font-size: 1.2rem;
  margin: 0 0 16px;
  text-align: center;
  color: ${p => p.theme.colors.text};
  font-weight: 600;
`;

const CenteredMsg = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${p => p.theme.colors.textMuted};
  font-size: 1rem;
`;

const AdminLink = styled(Link)`
  display: block;
  text-align: center;
  margin-top: 32px;
  font-size: 0.82rem;
  color: ${p => p.theme.colors.textMuted};
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
`;

const ModalBox = styled.div`
  background: ${p => p.theme.colors.surface};
  border-radius: 12px;
  padding: 28px 24px;
  max-width: 340px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`;

const ModalTitle = styled.div`
  font-size: 1.3rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 12px;
  color: ${p => p.theme.colors.text};
`;

const ModalMessage = styled.div`
  font-size: 0.95rem;
  text-align: center;
  color: ${p => p.theme.colors.textSecondary};
  margin-bottom: 22px;
  line-height: 1.5;
`;

const ModalActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ModalBtn = styled.button<{ $primary?: boolean }>`
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  background: ${p => p.$primary ? '#1565c0' : p.theme.colors.surfaceAlt};
  color: ${p => p.$primary ? '#fff' : p.theme.colors.text};
  &:hover { opacity: 0.85; }
`;


export default function DanceCard() {
  const { code } = useParams<{ code: string }>();
  const dispatch = useAppDispatch();
  const { currentSinger, status } = useAppSelector(s => s.singer);
  const user = useAppSelector(s => s.auth.user);
  const [songs, setSongs] = useState<string[]>([]);
  const [contestInfos, setContestInfos] = useState<PublicContest[]>([]);
  const [showBusyBeeModal, setShowBusyBeeModal] = useState(false);
  const prevIsTrampRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (code) dispatch(fetchSingerByCode(code));
  }, [code, dispatch]);

  useEffect(() => {
    if (!code) return;
    fetch(`${BASE_URL}/singer/${code}/songs`)
      .then(r => r.ok ? r.json() as Promise<string[]> : [])
      .then(setSongs)
      .catch(() => {});
  }, [code]);

  useEffect(() => {
    if (!code) return;
    fetch(`${BASE_URL}/singer/${code}/contests`)
      .then(r => r.ok ? r.json() as Promise<PublicContest[]> : [])
      .then(setContestInfos)
      .catch(() => {});
  }, [code]);

  // Compute isTramp before early returns so the effect can use it.
  const allowBusyBee = currentSinger?.allowBusyBee ?? false;
  const isTrampEarly = (() => {
    if (!currentSinger) return false;
    const { singer, allSingers, sungWithIds } = currentSinger;
    const required = allSingers.filter(
      s => s.id !== singer.id && s.part !== singer.part && s.danceCardStatus !== 'Optional'
    );
    return required.length > 0 && required.every(s => sungWithIds.includes(s.id));
  })();

  useEffect(() => {
    if (status !== 'succeeded' || !allowBusyBee) return;
    const prev = prevIsTrampRef.current;
    prevIsTrampRef.current = isTrampEarly;
    if (prev === false && isTrampEarly) {
      setShowBusyBeeModal(true);
    }
  }, [isTrampEarly, status, allowBusyBee]);

  if (status === 'loading' || (status === 'idle' && !currentSinger)) {
    return <CenteredMsg>Loading...</CenteredMsg>;
  }

  if (status === 'failed' || !currentSinger) {
    return <CenteredMsg>Singer not found.</CenteredMsg>;
  }

  const { singer, allSingers, sungWithIds, sungWithTwiceIds, eventId } = currentSinger;
  const twiceIds = sungWithTwiceIds ?? [];
  const selfPart = singer.part;

  const grouped = PART_ORDER
    .map(part => ({ part, singers: allSingers.filter(s => s.part === part) }))
    .filter(g => g.singers.length > 0);

  const requiredOtherPart = allSingers.filter(s => s.id !== singer.id && s.part !== selfPart && s.danceCardStatus !== 'Optional');
  const isTramp = requiredOtherPart.length > 0 && requiredOtherPart.every(s => sungWithIds.includes(s.id));

  const requiredAll = allSingers.filter(s => s.id !== singer.id && s.danceCardStatus !== 'Optional');
  const isSuperTramp = requiredAll.length > 0 && requiredAll.every(s => sungWithIds.includes(s.id));

  const isBusyBeeRound = allowBusyBee && isTramp;
  const isBusyBee = isBusyBeeRound && requiredOtherPart.every(s => twiceIds.includes(s.id));

  const handleToggle = (s: SingerDto, remove: boolean) => {
    if (isBusyBeeRound) {
      const alreadyTwice = twiceIds.includes(s.id);
      dispatch(toggleSungWithTwice({ singerId: singer.id, otherId: s.id, remove: alreadyTwice }));
    } else {
      dispatch(toggleSungWith({ singerId: singer.id, otherId: s.id, remove }));
    }
  };

  return (
    <Container>
      <PageTitle>Hi, {singer.badgeName}!</PageTitle>
      <HelpCard />
      <SongListCard songs={songs} />
      {contestInfos.map(c => (
        <ContestInfoCard key={c.name} contest={c} />
      ))}
      <TrampBanner
        isTramp={isTramp}
        isSuperTramp={isSuperTramp}
        isBusyBeeRound={isBusyBeeRound}
        isBusyBee={isBusyBee}
      />
      {grouped.map(({ part, singers }) => (
        <PartGroup
          key={part}
          part={part}
          singers={singers}
          selfId={singer.id}
          sungWithIds={sungWithIds}
          isOwnPart={part === selfPart}
          onToggle={handleToggle}
          isBusyBeeRound={isBusyBeeRound}
          sungWithTwiceIds={twiceIds}
        />
      ))}
      <AdminLink to={`/events/${eventId}/stats`}>View Stats</AdminLink>
      {user && (user.isSiteAdmin || user.eventRoles.some(r => r.eventId === eventId && ['EventAdmin', 'ContestAdmin'].includes(r.role))) && (
        <AdminLink to={`/admin/events/${eventId}`}>Admin</AdminLink>
      )}

      {showBusyBeeModal && (
        <Overlay>
          <ModalBox>
            <ModalTitle>Congratulations!</ModalTitle>
            <ModalMessage>
              You are a Harmony Brigade Tramp! Click OK to start Round 2 and become a Busy Bee!
            </ModalMessage>
            <ModalActions>
              <ModalBtn $primary onClick={() => setShowBusyBeeModal(false) }>
                OK
              </ModalBtn>
            </ModalActions>
          </ModalBox>
        </Overlay>
      )}
    </Container>
  );
}

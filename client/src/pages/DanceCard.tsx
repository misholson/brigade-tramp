import { useEffect, useState } from 'react';
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

export default function DanceCard() {
  const { code } = useParams<{ code: string }>();
  const dispatch = useAppDispatch();
  const { currentSinger, status } = useAppSelector(s => s.singer);
  const user = useAppSelector(s => s.auth.user);
  const [songs, setSongs] = useState<string[]>([]);
  const [contestInfos, setContestInfos] = useState<PublicContest[]>([]);

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

  if (status === 'loading' || (status === 'idle' && !currentSinger)) {
    return <CenteredMsg>Loading...</CenteredMsg>;
  }

  if (status === 'failed' || !currentSinger) {
    return <CenteredMsg>Singer not found.</CenteredMsg>;
  }

  const { singer, allSingers, sungWithIds, allowBusyBee, sungWithTwiceIds, eventId } = currentSinger;
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
        allowBusyBee={allowBusyBee}
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
      {user && (user.isSiteAdmin || user.eventRoles.some(r => r.eventId === eventId && ['EventAdmin', 'ContestAdmin'].includes(r.role))) && (
        <AdminLink to={`/admin/events/${eventId}`}>Admin</AdminLink>
      )}
    </Container>
  );
}

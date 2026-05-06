import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchSingerByCode, toggleSungWith } from '../store/singerSlice';
import type { Part, SingerDto } from '../types';
import PartGroup from '../components/PartGroup';
import TrampBanner from '../components/TrampBanner';

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
  color: #333;
  font-weight: 600;
`;

const CenteredMsg = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #888;
  font-size: 1rem;
`;

export default function MainPage() {
  const { code } = useParams<{ code: string }>();
  const dispatch = useAppDispatch();
  const { currentSinger, status } = useAppSelector(s => s.singer);

  useEffect(() => {
    if (code) dispatch(fetchSingerByCode(code));
  }, [code, dispatch]);

  if (status === 'loading' || (status === 'idle' && !currentSinger)) {
    return <CenteredMsg>Loading...</CenteredMsg>;
  }

  if (status === 'failed' || !currentSinger) {
    return <CenteredMsg>Singer not found.</CenteredMsg>;
  }

  const { singer, allSingers, sungWithIds } = currentSinger;
  const selfPart = singer.part;

  const grouped = PART_ORDER
    .map(part => ({ part, singers: allSingers.filter(s => s.part === part) }))
    .filter(g => g.singers.length > 0);

  const requiredOtherPart = allSingers.filter(s => s.id !== singer.id && s.part !== selfPart && s.status !== 'Optional');
  const isTramp = requiredOtherPart.length > 0 && requiredOtherPart.every(s => sungWithIds.includes(s.id));

  const requiredAll = allSingers.filter(s => s.id !== singer.id && s.status !== 'Optional');
  const isSuperTramp = requiredAll.length > 0 && requiredAll.every(s => sungWithIds.includes(s.id));

  const handleToggle = (s: SingerDto, remove: boolean) => {
    dispatch(toggleSungWith({ singerId: singer.id, otherId: s.id, remove }));
  };

  return (
    <Container>
      <PageTitle>Hi, {singer.badgeName}!</PageTitle>
      <TrampBanner isTramp={isTramp} isSuperTramp={isSuperTramp} />
      {grouped.map(({ part, singers }) => (
        <PartGroup
          key={part}
          part={part}
          singers={singers}
          selfId={singer.id}
          sungWithIds={sungWithIds}
          isOwnPart={part === selfPart}
          onToggle={handleToggle}
        />
      ))}
    </Container>
  );
}

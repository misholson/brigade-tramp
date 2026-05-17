import { useState } from 'react';
import styled from 'styled-components';
import type { Part, SingerDto } from '../types';
import SingerCard from './SingerCard';

interface Props {
  part: Part;
  singers: SingerDto[];
  selfId: number;
  sungWithIds: number[];
  isOwnPart: boolean;
  onToggle: (singer: SingerDto, remove: boolean) => void;
  isBusyBeeRound?: boolean;
  sungWithTwiceIds?: number[];
}

const GroupWrapper = styled.div`
  margin-bottom: 12px;
`;

const GroupHeader = styled.div<{ $part: Part }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: ${p => p.theme.parts[p.$part].dark};
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  font-weight: 600;
  font-size: 1rem;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Chevron = styled.span<{ $open: boolean }>`
  transform: ${p => (p.$open ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform 0.2s;
  display: inline-block;
  font-size: 0.75rem;
`;

const CountBadge = styled.span`
  background: rgba(255, 255, 255, 0.25);
  border-radius: 12px;
  padding: 2px 10px;
  font-size: 0.8rem;
  font-weight: normal;
`;

const SingerGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 8px 0 0;
`;

export default function PartGroup({ part, singers, selfId, sungWithIds, isOwnPart, onToggle, isBusyBeeRound, sungWithTwiceIds }: Props) {
  const twiceIds = sungWithTwiceIds ?? [];

  const remaining = isOwnPart
    ? 0
    : singers.filter(s => {
        if (s.id === selfId || s.status === 'Optional') return false;
        return isBusyBeeRound ? !twiceIds.includes(s.id) : !sungWithIds.includes(s.id);
      }).length;

  const [isExpanded, setIsExpanded] = useState(remaining > 1);

  return (
    <GroupWrapper>
      <GroupHeader $part={part} onClick={() => setIsExpanded(e => !e)}>
        <HeaderLeft>
          <span>{part}</span>
          <Chevron $open={isExpanded}>▼</Chevron>
        </HeaderLeft>
        <CountBadge>{remaining} left</CountBadge>
      </GroupHeader>

      {isExpanded && (
        <SingerGrid>
          {singers.map(singer => {
            const isSelf = singer.id === selfId;
            const isSelected = isSelf || sungWithIds.includes(singer.id);
            const isTwice = isSelf || twiceIds.includes(singer.id);
            return (
              <SingerCard
                key={singer.id}
                badgeName={singer.badgeName}
                firstName={singer.firstName}
                lastName={singer.lastName}
                part={singer.part}
                isSelected={isSelected}
                isSelf={isSelf}
                isOptional={singer.status === 'Optional'}
                isBusyBeeRound={isBusyBeeRound}
                sungWithTwice={isTwice}
                onClick={() => {
                  if (isSelf) return;
                  onToggle(singer, isBusyBeeRound ? isTwice : isSelected);
                }}
              />
            );
          })}
        </SingerGrid>
      )}
    </GroupWrapper>
  );
}

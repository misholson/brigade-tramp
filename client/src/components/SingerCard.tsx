import styled from 'styled-components';
import type { Part } from '../types';

interface Props {
  badgeName: string;
  firstName: string;
  lastName: string;
  part: Part;
  isSelected: boolean;
  isSelf: boolean;
  isOptional?: boolean;
  isBusyBeeRound?: boolean;
  sungWithTwice?: boolean;
  onClick: () => void;
  onEllipsis?: () => void;
}

const Card = styled.div<{ $part: Part; $dark: boolean }>`
  border-radius: ${p => p.theme.cardBorderRadius};
  padding: 10px 8px;
  cursor: pointer;
  background-color: ${p =>
    p.$dark
      ? p.theme.parts[p.$part].dark
      : p.theme.parts[p.$part].light};
  color: ${p => (p.$dark ? '#fff' : p.theme.colors.cardUnselectedText)};
  transition: background-color 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 2px;
  user-select: none;
  position: relative;
  min-width: 0;
`;

const BadgeName = styled.span`
  font-weight: bold;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 18px;
`;

const FullName = styled.span`
  font-size: 0.75rem;
  opacity: 0.85;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Check = styled.span`
  position: absolute;
  top: 6px;
  right: 8px;
  font-size: 0.9rem;
`;

const OptionalMark = styled.span`
  font-size: 0.8rem;
  font-weight: normal;
  opacity: 0.75;
  margin-left: 2px;
`;

const EllipsisBtn = styled.button<{ $dark: boolean }>`
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: ${p => p.$dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.35)'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover { background: rgba(0,0,0,0.12); color: ${p => p.$dark ? '#fff' : '#000'}; }
`;

export default function SingerCard({ badgeName, firstName, lastName, part, isSelected, isSelf, isOptional, isBusyBeeRound, sungWithTwice, onClick, onEllipsis }: Props) {
  const isDark = isBusyBeeRound
    ? (sungWithTwice || isSelf)
    : (isSelected || isSelf);

  const checkmark = isBusyBeeRound
    ? (sungWithTwice || isSelf) ? '✓✓'
      : isSelected ? '✓'
      : null
    : (isSelected || isSelf) ? '✓'
    : null;

  return (
    <Card $part={part} $dark={isDark} onClick={onClick}>
      {checkmark && <Check>{checkmark}</Check>}
      <BadgeName>{badgeName}{isOptional && <OptionalMark>*</OptionalMark>}</BadgeName>
      <FullName>{firstName} {lastName}</FullName>
      {onEllipsis && (
        <EllipsisBtn $dark={isDark} onClick={e => { e.stopPropagation(); onEllipsis(); }}>
          <svg width="14" height="4" viewBox="0 0 14 4" fill="currentColor">
            <circle cx="2" cy="2" r="1.5" />
            <circle cx="7" cy="2" r="1.5" />
            <circle cx="12" cy="2" r="1.5" />
          </svg>
        </EllipsisBtn>
      )}
    </Card>
  );
}
